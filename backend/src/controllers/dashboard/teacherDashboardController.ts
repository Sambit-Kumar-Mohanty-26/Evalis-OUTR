import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { db } from '../../config/db';
import { getPassPercent, getAvgCGPA } from '../../services/analyticsService';

// ─── TEACHER OVERVIEW ────────────────────────────────────────────────────────
export const getTeacherOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const teacherId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const teacher = await db.user.findUnique({
            where: { id: teacherId },
            include: { managedNodes: { select: { id: true, name: true, type: true } } }
        });

        const subjects = await db.subject.findMany({
            where: { teacherId, isDeleted: false },
            include: { semester: { include: { branch: { include: { school: true } } } } }
        });

        // Infer school/branch from subjects if not in managedNodes
        let schoolName = teacher?.managedNodes?.find(n => n.type === 'SCHOOL')?.name || subjects[0]?.semester?.branch?.school?.name || 'N/A';
        let branchName = teacher?.managedNodes?.find(n => n.type === 'BRANCH')?.name || subjects[0]?.semester?.branch?.name || 'N/A';

        const stats = {
            totalSubjects: subjects.length,
            totalStudents: subjects.length > 0 ? await db.user.count({ where: { batch: { branchId: { in: subjects.map(s => s.semester.branchId) } }, role: 'STUDENT', isDeleted: false } }) : 0,
            schoolName,
            branchName
        };

        res.json(stats);
    } catch (error) {
        console.error('Teacher Overview Error:', error);
        res.status(500).json({ error: 'Failed to load teacher overview.' });
    }
};

// ─── MY SUBJECTS ─────────────────────────────────────────────────────────────
export const getTeacherSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const teacherId = req.user!.userId;

        const subjects = await db.subject.findMany({
            where: { teacherId, isDeleted: false },
            include: {
                semester: {
                    include: {
                        branch: {
                            include: { school: { select: { name: true } } }
                        }
                    }
                },
                examSchema: { select: { id: true, name: true, components: { select: { id: true, name: true, maxMarks: true, category: true } } } },
                _count: { select: { marks: true, results: true } }
            }
        });

        res.json({ subjects });
    } catch (error) {
        console.error('Teacher Subjects Error:', error);
        res.status(500).json({ error: 'Failed to load subjects.' });
    }
};

// ─── STUDENTS PER SUBJECT ────────────────────────────────────────────────────
export const getTeacherSubjectStudents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const teacherId = req.user!.userId;
        const subjectId = req.params.id as string;
        const { examInstanceId, page = '1', limit = '50' } = req.query as Record<string, string>;

        // Ownership check: teacher must own this subject
        const subject = await db.subject.findFirst({ where: { id: subjectId, teacherId } });
        if (!subject) { res.status(403).json({ error: 'You do not teach this subject.' }); return; }

        const sem = await db.semester.findUnique({ where: { id: subject.semesterId } });
        if (!sem) { res.json({ students: [] }); return; }

        const students = await db.user.findMany({
            where: { batch: { branchId: sem.branchId }, role: 'STUDENT', isDeleted: false },
            select: { id: true, fullName: true, rollNumber: true, email: true },
            orderBy: { rollNumber: 'asc' }
        });

        // Fetch existing marks if examInstance selected
        let marksMap: Record<string, any> = {};
        if (examInstanceId) {
            const marks = await db.studentMark.findMany({
                where: { subjectId, examInstanceId },
                include: { component: { select: { id: true, name: true, maxMarks: true } } }
            });
            for (const m of marks) {
                if (!marksMap[m.studentId]) marksMap[m.studentId] = {};
                marksMap[m.studentId][m.componentId] = { marksObtained: m.marksObtained, componentName: (m as any).component?.name };
            }
        }

        const result = students.map(s => ({
            ...s,
            marks: marksMap[s.id] || {},
            hasMarks: !!marksMap[s.id]
        }));

        res.json({ students: result, total: students.length });
    } catch (error) {
        console.error('Teacher Subject Students Error:', error);
        res.status(500).json({ error: 'Failed to load students.' });
    }
};

// ─── SUBJECT STATS ───────────────────────────────────────────────────────────
export const getTeacherSubjectStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const teacherId = req.user!.userId;
        const subjectId = req.params.id as string;

        const subject = await db.subject.findFirst({ where: { id: subjectId, teacherId } });
        if (!subject) { res.status(403).json({ error: 'You do not teach this subject.' }); return; }

        const results = await db.studentResult.findMany({
            where: { subjectId, isPublished: true },
            include: { student: { select: { fullName: true, rollNumber: true } } },
            orderBy: { totalMarks: 'desc' }
        });

        const avgMarks = results.length > 0
            ? parseFloat((results.reduce((s, r) => s + r.totalMarks, 0) / results.length).toFixed(1))
            : 0;

        res.json({
            totalResults: results.length,
            passPercent: getPassPercent(results.map(r => ({ status: r.status }))),
            avgMarks,
            topStudents: results.slice(0, 5).map(r => ({
                name: (r as any).student?.fullName,
                rollNumber: (r as any).student?.rollNumber,
                marks: r.totalMarks,
                grade: r.grade
            }))
        });
    } catch (error) {
        console.error('Teacher Subject Stats Error:', error);
        res.status(500).json({ error: 'Failed to load subject stats.' });
    }
};

// ─── SUBMISSION STATUS ───────────────────────────────────────────────────────
export const getTeacherSubmissionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const teacherId = req.user!.userId;

        const subjects = await db.subject.findMany({
            where: { teacherId, isDeleted: false },
            include: {
                semester: { include: { branch: true } }
            }
        });

        const subjectIds = subjects.map(s => s.id);

        const activeInstances = await db.examInstance.findMany({
            where: { status: { in: ['ACTIVE', 'LOCKED'] }, isDeleted: false },
            include: {
                marks: { where: { subjectId: { in: subjectIds as string[] }, enteredBy: teacherId }, select: { id: true } }
            }
        });

        const statusMap = activeInstances.map(inst => ({
            instanceId: inst.id,
            instanceName: inst.name,
            status: inst.status,
            marksEntryClosed: inst.marksEntryClosed,
            marksCount: inst.marks.length,
            submissionStatus: inst.status === 'LOCKED' ? 'LOCKED' : inst.marks.length > 0 ? 'SUBMITTED' : 'PENDING'
        }));

        res.json({ instances: statusMap });
    } catch (error) {
        console.error('Teacher Submission Status Error:', error);
        res.status(500).json({ error: 'Failed to load submission status.' });
    }
};
