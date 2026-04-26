import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { db } from '../../config/db';

// ─── STUDENT OVERVIEW ─────────────────────────────────────────────────────────
export const getStudentOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user!.userId; // Hard-scoped to self

        const student = await db.user.findUnique({
            where: { id: studentId },
            include: { 
                batch: { include: { branch: { include: { school: { select: { name: true } } } } } },
                managedNodes: { 
                    include: { 
                        parent: { select: { name: true, type: true } } 
                    } 
                }
            }
        });

        // Fallback names if batch is missing
        let schoolName = student?.batch?.branch?.school?.name || 'N/A';
        let branchName = student?.batch?.branch?.name || 'N/A';

        if (schoolName === 'N/A' || branchName === 'N/A') {
            const branchNode = student?.managedNodes?.find(n => n.type === 'BRANCH' || n.type === 'CUSTOM');
            const schoolNode = student?.managedNodes?.find(n => n.type === 'SCHOOL');
            
            if (branchName === 'N/A' && branchNode) branchName = branchNode.name;
            if (schoolName === 'N/A') {
                if (schoolNode) {
                    schoolName = schoolNode.name;
                } else if (branchNode?.parent?.type === 'SCHOOL') {
                    schoolName = branchNode.parent.name;
                } else if (branchNode?.parent) {
                    // One more level up if needed (e.g. Dept -> School)
                    schoolName = branchNode.parent.name;
                }
            }
            
            // Final fallback: if we have any node and both are N/A, use the node as branch
            if (branchName === 'N/A' && student?.managedNodes?.[0]) branchName = student.managedNodes[0].name;
        }

        const latestSemResult = await db.semesterResult.findFirst({
            where: { studentId },
            orderBy: { semesterNumber: 'desc' }
        });

        const activeBacklogs = await db.studentBacklog.count({ where: { studentId, status: 'ACTIVE' } });

        const promotionLog = await db.promotionLog.findFirst({
            where: { studentId },
            orderBy: { promotedAt: 'desc' }
        });

        res.json({
            rollNumber: student?.rollNumber || 'N/A',
            cgpa: student?.cgpa || 0,
            currentSemester: student?.currentSemester || 1,
            status: student?.status || 'ACTIVE',
            sgpa: latestSemResult?.sgpa || 0,
            activeBacklogs,
            school: schoolName,
            branch: branchName,
            lastPromotion: promotionLog
        });
    } catch (error) {
        console.error('Student Overview Error:', error);
        res.status(500).json({ error: 'Failed to load overview.' });
    }
};

// ─── STUDENT MARKS ────────────────────────────────────────────────────────────
export const getStudentMarks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user!.userId; // Self-only

        const results = await db.studentResult.findMany({
            where: { studentId, isPublished: true }, // PUBLISHED only
            include: {
                subject: { select: { name: true, code: true, creditHours: true, type: true } },
                examInstance: { select: { name: true, semester: true, type: true } }
            },
            orderBy: [{ examInstance: { semester: 'asc' } }, { subject: { name: 'asc' } }]
        });

        // Get component-wise marks too
        const marks = await db.studentMark.findMany({
            where: {
                studentId,
                examInstance: { results: { some: { studentId, isPublished: true } } }
            },
            include: {
                component: { select: { name: true, category: true, maxMarks: true } },
                subject: { select: { id: true } }
            }
        });

        // Group marks by subject+exam
        const marksMap: Record<string, any[]> = {};
        for (const m of marks) {
            const key = `${m.subjectId}-${m.examInstanceId}`;
            if (!marksMap[key]) marksMap[key] = [];
            marksMap[key].push({ component: m.component.name, category: m.component.category, marks: m.marksObtained, maxMarks: m.component.maxMarks });
        }

        const grouped = results.map(r => ({
            subjectName: r.subject.name,
            subjectCode: r.subject.code,
            creditHours: r.subject.creditHours,
            examName: r.examInstance.name,
            semester: r.examInstance.semester,
            totalMarks: r.totalMarks,
            grade: r.grade,
            gradePoint: r.gradePoint,
            status: r.status,
            components: marksMap[`${r.subjectId}-${r.examInstanceId}`] || []
        }));

        res.json({ results: grouped });
    } catch (error) {
        console.error('Student Marks Error:', error);
        res.status(500).json({ error: 'Failed to load marks.' });
    }
};

// ─── STUDENT BACKLOGS ─────────────────────────────────────────────────────────
export const getStudentBacklogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user!.userId;

        const backlogs = await db.studentBacklog.findMany({
            where: { studentId },
            include: { subject: { select: { name: true, code: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            active: backlogs.filter(b => b.status === 'ACTIVE'),
            cleared: backlogs.filter(b => b.status === 'CLEARED')
        });
    } catch (error) {
        console.error('Student Backlogs Error:', error);
        res.status(500).json({ error: 'Failed to load backlogs.' });
    }
};

// ─── STUDENT SEMESTER HISTORY ─────────────────────────────────────────────────
export const getStudentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user!.userId;

        const semResults = await db.semesterResult.findMany({
            where: { studentId },
            orderBy: { semesterNumber: 'asc' }
        });

        const promotions = await db.promotionLog.findMany({
            where: { studentId },
            orderBy: { fromSemester: 'asc' }
        });

        res.json({ semesters: semResults, promotions });
    } catch (error) {
        console.error('Student History Error:', error);
        res.status(500).json({ error: 'Failed to load history.' });
    }
};
