import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { db } from '../../config/db';
import { cache } from '../../services/cacheService';
import { getPassPercent, getFailPercent, getAvgCGPA, getBacklogPercent, getBranchStats } from '../../services/analyticsService';

// Helper: resolve branch from advisor's managed nodes
const getAdvisorBranchId = async (userId: string): Promise<string | null> => {
    const advisor = await db.user.findUnique({
        where: { id: userId },
        include: { managedNodes: { select: { id: true, type: true } } }
    });
    const branchNode = advisor?.managedNodes?.find(n => n.type === 'BRANCH' || n.type === 'CUSTOM') || advisor?.managedNodes?.[0];
    if (!branchNode) return null;
    const branch = await db.branch.findFirst({ where: { orgNodeId: branchNode.id, isDeleted: false } });
    return branch?.id || null;
};

// ─── BRANCH OVERVIEW ─────────────────────────────────────────────────────────
export const getAdvisorOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const branchId = await getAdvisorBranchId(userId);
        if (!branchId) { res.json({ totalStudents: 0, passPercent: 0, backlogPercent: 0, avgCGPA: 0, semesterDistribution: {} }); return; }

        const cacheKey = cache.key(tenantId, 'advisor', userId, 'overview');
        const cached = cache.get(cacheKey);
        if (cached) { res.json(cached); return; }

        const stats = await getBranchStats(branchId);
        cache.set(cacheKey, stats, 2 * 60 * 1000); // 2-min cache for frequently changing advisor data
        res.json(stats);
    } catch (error) {
        console.error('Advisor Overview Error:', error);
        res.status(500).json({ error: 'Failed to load branch overview.' });
    }
};

// ─── STUDENT LIST (Paginated) ────────────────────────────────────────────────
export const getAdvisorStudents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { search, semester, hasBacklog, page = '1', limit = '20' } = req.query as Record<string, string>;

        const branchId = await getAdvisorBranchId(userId);
        if (!branchId) { res.json({ students: [], total: 0 }); return; }

        const where: any = {
            batch: { branchId },
            role: 'STUDENT',
            isDeleted: false
        };

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { rollNumber: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (semester) where.currentSemester = parseInt(semester);

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        let [students, total] = await Promise.all([
            db.user.findMany({
                where,
                select: {
                    id: true, fullName: true, rollNumber: true, email: true,
                    cgpa: true, currentSemester: true, status: true,
                    backlogs: { where: { status: 'ACTIVE' }, select: { id: true } }
                },
                skip, take,
                orderBy: { rollNumber: 'asc' }
            }),
            db.user.count({ where })
        ]);

        // Filter by backlog if requested
        let filteredStudents = students;
        if (hasBacklog === 'true') {
            filteredStudents = students.filter(s => s.backlogs.length > 0);
        }

        const result = filteredStudents.map(s => ({
            id: s.id,
            fullName: s.fullName,
            rollNumber: s.rollNumber,
            email: s.email,
            cgpa: s.cgpa,
            currentSemester: s.currentSemester,
            status: s.status,
            backlogCount: s.backlogs.length
        }));

        res.json({ students: result, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / take) });
    } catch (error) {
        console.error('Advisor Students Error:', error);
        res.status(500).json({ error: 'Failed to load student list.' });
    }
};

// ─── INDIVIDUAL STUDENT PROFILE ───────────────────────────────────────────────
export const getAdvisorStudentProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const studentId = req.params.id as string;

        // Scope check: student must be in advisor's branch
        const branchId = await getAdvisorBranchId(userId);
        if (!branchId) { res.status(403).json({ error: 'Branch not found.' }); return; }

        const student = await db.user.findFirst({
            where: { id: studentId, batch: { branchId }, role: 'STUDENT' },
            select: { id: true, fullName: true, rollNumber: true, email: true, cgpa: true, currentSemester: true, status: true }
        });
        if (!student) { res.status(403).json({ error: 'Student not in your branch.' }); return; }

        const [results, semResults, backlogs, promotionLogs] = await Promise.all([
            db.studentResult.findMany({
                where: { studentId, isPublished: true },
                include: {
                    subject: { select: { name: true, code: true, creditHours: true } },
                    examInstance: { select: { name: true, semester: true } }
                },
                orderBy: [{ examInstance: { semester: 'asc' } }]
            }),
            db.semesterResult.findMany({
                where: { studentId },
                orderBy: { semesterNumber: 'asc' }
            }),
            db.studentBacklog.findMany({
                where: { studentId },
                include: { subject: { select: { name: true, code: true } } }
            }),
            db.promotionLog.findMany({
                where: { studentId },
                orderBy: { promotedAt: 'desc' }
            })
        ]);

        res.json({ student, results, semesterResults: semResults, backlogs, promotionLogs });
    } catch (error) {
        console.error('Student Profile Error:', error);
        res.status(500).json({ error: 'Failed to load student profile.' });
    }
};

// ─── AT-RISK STUDENTS ─────────────────────────────────────────────────────────
export const getAdvisorAtRisk = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const branchId = await getAdvisorBranchId(userId);
        if (!branchId) { res.json({ students: [] }); return; }

        const students = await db.user.findMany({
            where: { batch: { branchId }, role: 'STUDENT', isDeleted: false },
            select: {
                id: true, fullName: true, rollNumber: true, cgpa: true, currentSemester: true,
                backlogs: { where: { status: 'ACTIVE' }, select: { id: true, subject: { select: { name: true } } } }
            }
        });

        // At-risk: CGPA < 5.0 OR ≥ 2 active backlogs
        const atRisk = students
            .filter(s => (s.cgpa !== null && s.cgpa < 5.0) || s.backlogs.length >= 2)
            .map(s => ({
                id: s.id,
                fullName: s.fullName,
                rollNumber: s.rollNumber,
                cgpa: s.cgpa,
                currentSemester: s.currentSemester,
                backlogCount: s.backlogs.length,
                backlogSubjects: s.backlogs.map(b => b.subject.name),
                riskReasons: [
                    ...(s.cgpa !== null && s.cgpa < 5.0 ? [`Low CGPA: ${s.cgpa}`] : []),
                    ...(s.backlogs.length >= 2 ? [`${s.backlogs.length} active backlogs`] : [])
                ]
            }))
            .sort((a, b) => (a.cgpa || 0) - (b.cgpa || 0));

        res.json({ students: atRisk });
    } catch (error) {
        console.error('At-Risk Error:', error);
        res.status(500).json({ error: 'Failed to load at-risk students.' });
    }
};

// ─── SUBJECT PERFORMANCE ─────────────────────────────────────────────────────
export const getAdvisorSubjectPerformance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const branchId = await getAdvisorBranchId(userId);
        if (!branchId) { res.json({ subjects: [] }); return; }

        const cacheKey = cache.key(tenantId, 'advisor', userId, 'subjects');
        const cached = cache.get(cacheKey);
        if (cached) { res.json(cached); return; }

        const results = await db.studentResult.findMany({
            where: { student: { batch: { branchId } }, isPublished: true },
            include: { subject: { select: { id: true, name: true, code: true } } }
        });

        const subjectMap = new Map<string, { name: string; code: string; results: { status: string }[] }>();
        for (const r of results) {
            if (!subjectMap.has(r.subjectId)) {
                subjectMap.set(r.subjectId, { name: r.subject.name, code: r.subject.code, results: [] });
            }
            subjectMap.get(r.subjectId)!.results.push({ status: r.status });
        }

        const subjects = Array.from(subjectMap.entries()).map(([id, d]) => ({
            subjectId: id, name: d.name, code: d.code,
            total: d.results.length,
            passPercent: getPassPercent(d.results),
            failPercent: getFailPercent(d.results)
        })).sort((a, b) => b.failPercent - a.failPercent);

        const resp = { subjects };
        cache.set(cacheKey, resp);
        res.json(resp);
    } catch (error) {
        console.error('Advisor Subject Performance Error:', error);
        res.status(500).json({ error: 'Failed to load subject performance.' });
    }
};
