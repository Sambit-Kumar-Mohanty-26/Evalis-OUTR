import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { db } from '../../config/db';
import { cache } from '../../services/cacheService';
import { getPassPercent, getFailPercent, getAvgCGPA, getBacklogPercent, getSchoolStats } from '../../services/analyticsService';

// Helper: get school orgNodeId from user metadata
const getHosSchoolOrgNodeId = (req: AuthRequest): string | null => {
    const meta = (req.user as any)?.metadata;
    if (meta && typeof meta === 'object' && meta.schoolOrgNodeId) return meta.schoolOrgNodeId;
    return null;
};

// ─── SCHOOL OVERVIEW ──────────────────────────────────────────────────────────
export const getHosOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        // Get the school this HOS manages from their managed nodes
        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true, name: true, type: true } } }
        });

        const schoolNode = hosUser?.managedNodes?.find(n => n.type === 'SCHOOL' || n.type === 'CUSTOM') || hosUser?.managedNodes?.[0];
        if (!schoolNode) {
            res.json({ totalStudents: 0, totalBranches: 0, avgCGPA: 0, passPercent: 0, backlogPercent: 0, schoolName: 'No School Assigned' });
            return;
        }

        const cacheKey = cache.key(tenantId, 'hos', userId, 'overview');
        const cached = cache.get(cacheKey);
        if (cached) { res.json(cached); return; }

        const stats = await getSchoolStats(schoolNode.id, tenantId);
        if (!stats) {
            res.json({ totalStudents: 0, totalBranches: 0, avgCGPA: 0, passPercent: 0, backlogPercent: 0, schoolName: schoolNode.name });
            return;
        }

        cache.set(cacheKey, stats);
        res.json(stats);
    } catch (error) {
        console.error('HOS Overview Error:', error);
        res.status(500).json({ error: 'Failed to load school overview.' });
    }
};

// ─── BRANCH PERFORMANCE COMPARISON ───────────────────────────────────────────
export const getHosBranchPerformance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true } } }
        });
        const schoolNode = hosUser?.managedNodes?.[0];
        if (!schoolNode) { res.json({ branches: [] }); return; }

        const cacheKey = cache.key(tenantId, 'hos', userId, 'branches');
        const cached = cache.get(cacheKey);
        if (cached) { res.json(cached); return; }

        const school = await db.academicSchool.findFirst({
            where: { orgNodeId: schoolNode.id, isDeleted: false },
            include: { branches: { where: { isDeleted: false } } }
        });
        if (!school) { res.json({ branches: [] }); return; }

        const branchStats = await Promise.all(school.branches.map(async (branch) => {
            const results = await db.studentResult.findMany({
                where: { student: { batch: { branchId: branch.id } }, isPublished: true },
                select: { status: true }
            });
            const students = await db.user.count({
                where: { batch: { branchId: branch.id }, role: 'STUDENT', isDeleted: false }
            });
            return {
                branchId: branch.id,
                branchName: branch.name,
                totalStudents: students,
                passPercent: getPassPercent(results),
                failPercent: getFailPercent(results),
                totalResults: results.length
            };
        }));

        const result = { branches: branchStats };
        cache.set(cacheKey, result);
        res.json(result);
    } catch (error) {
        console.error('HOS Branch Performance Error:', error);
        res.status(500).json({ error: 'Failed to load branch performance.' });
    }
};

// ─── SUBJECT DIFFICULTY ANALYSIS ─────────────────────────────────────────────
export const getHosSubjectAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true } } }
        });
        const schoolNode = hosUser?.managedNodes?.[0];
        if (!schoolNode) { res.json({ subjects: [] }); return; }

        const cacheKey = cache.key(tenantId, 'hos', userId, 'subjects');
        const cached = cache.get(cacheKey);
        if (cached) { res.json(cached); return; }

        const school = await db.academicSchool.findFirst({
            where: { orgNodeId: schoolNode.id, isDeleted: false },
            include: { branches: { where: { isDeleted: false }, include: { semesters: { include: { subjects: { where: { isDeleted: false } } } } } } }
        });
        if (!school) { res.json({ subjects: [] }); return; }

        const subjectIds = school.branches.flatMap(b =>
            b.semesters.flatMap(s => s.subjects.map(sub => sub.id))
        );

        if (subjectIds.length === 0) { res.json({ subjects: [] }); return; }

        const allResults = await db.studentResult.findMany({
            where: { subjectId: { in: subjectIds }, isPublished: true },
            include: { subject: { select: { id: true, name: true, code: true } } }
        });

        // Group by subject
        const subjectMap = new Map<string, { name: string; code: string; results: { status: string }[] }>();
        for (const r of allResults) {
            const key = r.subjectId;
            if (!subjectMap.has(key)) {
                subjectMap.set(key, { name: r.subject.name, code: r.subject.code, results: [] });
            }
            subjectMap.get(key)!.results.push({ status: r.status });
        }

        const subjects = Array.from(subjectMap.entries()).map(([id, data]) => ({
            subjectId: id,
            name: data.name,
            code: data.code,
            total: data.results.length,
            passPercent: getPassPercent(data.results),
            failPercent: getFailPercent(data.results),
            isHighRisk: getFailPercent(data.results) >= 40
        })).sort((a, b) => b.failPercent - a.failPercent);

        const result = { subjects };
        cache.set(cacheKey, result);
        res.json(result);
    } catch (error) {
        console.error('HOS Subject Analysis Error:', error);
        res.status(500).json({ error: 'Failed to load subject analysis.' });
    }
};

// ─── ALERTS ──────────────────────────────────────────────────────────────────
export const getHosAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true } } }
        });
        const schoolNode = hosUser?.managedNodes?.[0];
        if (!schoolNode) { res.json({ alerts: [] }); return; }

        const school = await db.academicSchool.findFirst({
            where: { orgNodeId: schoolNode.id, isDeleted: false },
            include: { branches: { where: { isDeleted: false }, include: { batches: { where: { isDeleted: false } } } } }
        });
        if (!school) { res.json({ alerts: [] }); return; }

        const batchIds = school.branches.flatMap(b => b.batches.map(bt => bt.id));
        const alerts: { type: string; message: string; severity: string }[] = [];

        // Draft exams (not activated)
        const draftExams = await db.examInstance.count({
            where: { batchId: { in: batchIds }, status: 'DRAFT', isDeleted: false }
        });
        if (draftExams > 0) {
            alerts.push({ type: 'DRAFT_EXAM', message: `${draftExams} exam(s) still in Draft — not yet activated`, severity: 'WARNING' });
        }

        // Locked but unpublished
        const lockedUnpublished = await db.examInstance.findMany({
            where: { batchId: { in: batchIds }, status: 'LOCKED', isDeleted: false },
            include: { _count: { select: { results: true } } }
        });
        const unpublishedCount = lockedUnpublished.filter(e => e._count.results === 0).length;
        if (unpublishedCount > 0) {
            alerts.push({ type: 'UNPUBLISHED_RESULTS', message: `${unpublishedCount} exam(s) locked but results not published`, severity: 'ERROR' });
        }

        // Active exams with no marks
        const activeExams = await db.examInstance.findMany({
            where: { batchId: { in: batchIds }, status: 'ACTIVE', isDeleted: false },
            include: { _count: { select: { marks: true } } }
        });
        const noMarksCount = activeExams.filter(e => e._count.marks === 0).length;
        if (noMarksCount > 0) {
            alerts.push({ type: 'NO_MARKS', message: `${noMarksCount} active exam(s) have no marks entered yet`, severity: 'WARNING' });
        }

        res.json({ alerts });
    } catch (error) {
        console.error('HOS Alerts Error:', error);
        res.status(500).json({ error: 'Failed to load alerts.' });
    }
};

// ─── BACKLOG HEATMAP ─────────────────────────────────────────────────────────
export const getHosBacklogHeatmap = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true } } }
        });
        const schoolNode = hosUser?.managedNodes?.[0];
        if (!schoolNode) { res.json({ heatmap: [] }); return; }

        const cacheKey = cache.key(tenantId, 'hos', userId, 'heatmap');
        const cached = cache.get(cacheKey);
        if (cached) { res.json(cached); return; }

        const school = await db.academicSchool.findFirst({
            where: { orgNodeId: schoolNode.id, isDeleted: false },
            include: { branches: { where: { isDeleted: false } } }
        });
        if (!school) { res.json({ heatmap: [] }); return; }

        const branchIds = school.branches.map(b => b.id);

        const backlogs = await db.studentBacklog.findMany({
            where: { student: { batch: { branchId: { in: branchIds } } }, status: 'ACTIVE' },
            include: {
                subject: { select: { name: true, code: true } }
            }
        });

        // Group by subject + semester
        const heatmapMap = new Map<string, { subjectName: string; code: string; semester: number; count: number }>();
        for (const bl of backlogs) {
            const key = `${bl.subjectId}-${bl.semesterNumber}`;
            if (!heatmapMap.has(key)) {
                heatmapMap.set(key, { subjectName: bl.subject.name, code: bl.subject.code, semester: bl.semesterNumber, count: 0 });
            }
            heatmapMap.get(key)!.count++;
        }

        const heatmap = Array.from(heatmapMap.values()).sort((a, b) => b.count - a.count);
        const result = { heatmap };
        cache.set(cacheKey, result);
        res.json(result);
    } catch (error) {
        console.error('HOS Backlog Heatmap Error:', error);
        res.status(500).json({ error: 'Failed to load backlog heatmap.' });
    }
};
