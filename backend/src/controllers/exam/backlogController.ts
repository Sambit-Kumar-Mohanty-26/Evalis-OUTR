import { Response } from 'express';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';
import { calculateGrade } from '../../services/promotionService';

const p = (v: string | string[] | undefined): string => Array.isArray(v) ? v[0] : (v || '');

// ─── GET ALL BACKLOGS ────────────────────────────────────────────────────────
export const getBacklogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;
        const { batchId, status } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (batchId) {
            where.student = { batchId: p(batchId as string), tenantId, isDeleted: false };
        } else {
            where.student = { tenantId, isDeleted: false };
        }

        const backlogs = await db.studentBacklog.findMany({
            where,
            include: {
                student: {
                    select: { id: true, fullName: true, rollNumber: true, currentSemester: true, batchId: true }
                },
                subject: {
                    select: { id: true, name: true, code: true, type: true, passMarks: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ backlogs });
    } catch (error) {
        console.error('Get Backlogs Error:', error);
        res.status(500).json({ error: 'Failed to retrieve backlogs.' });
    }
};

// ─── CREATE BACK PAPER EXAM ──────────────────────────────────────────────────
export const createBackPaperExam = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminUserId = req.user!.userId;
        const { name, batchId, semester, scheduledDate } = req.body;

        if (!name || !batchId || !semester) {
            res.status(400).json({ error: 'name, batchId, and semester are required.' });
            return;
        }

        const instance = await db.examInstance.create({
            data: {
                name,
                type: 'BACK_PAPER',
                batchId,
                semester: parseInt(semester),
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                status: 'DRAFT',
            }
        });

        await db.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'CREATE',
                entity: 'BackPaperExam',
                entityId: instance.id,
                metadata: { name, batchId, semester } as any
            }
        });

        res.status(201).json(instance);
    } catch (error) {
        console.error('Create Back Paper Exam Error:', error);
        res.status(500).json({ error: 'Failed to create back paper exam.' });
    }
};

// ─── ENTER BACK PAPER MARKS ─────────────────────────────────────────────────
export const enterBackPaperMarks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const teacherId = req.user!.userId;
        const id = p(req.params.id);
        const { subjectId, marks } = req.body;

        const instance = await db.examInstance.findUnique({ where: { id } });
        if (!instance) { res.status(404).json({ error: 'Back paper exam not found.' }); return; }
        if (instance.type !== 'BACK_PAPER') {
            res.status(400).json({ error: 'This is not a back paper exam.' }); return;
        }
        if (instance.status !== 'ACTIVE') {
            res.status(400).json({ error: 'Back paper exam must be ACTIVE.' }); return;
        }

        for (const entry of marks) {
            await db.studentMark.upsert({
                where: {
                    studentId_subjectId_componentId_examInstanceId: {
                        studentId: entry.studentId,
                        subjectId,
                        componentId: entry.componentId,
                        examInstanceId: id,
                    }
                },
                create: {
                    studentId: entry.studentId,
                    subjectId,
                    componentId: entry.componentId,
                    examInstanceId: id,
                    marksObtained: entry.marksObtained,
                    isBacklog: true,
                    enteredBy: teacherId,
                },
                update: {
                    marksObtained: entry.marksObtained,
                    enteredBy: teacherId,
                }
            });
        }

        res.json({ message: `Back paper marks saved for ${marks.length} entries.` });
    } catch (error) {
        console.error('Enter Back Paper Marks Error:', error);
        res.status(500).json({ error: 'Failed to enter back paper marks.' });
    }
};

// ─── CLEAR BACKLOG ──────────────────────────────────────────────────────────
export const clearBacklog = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminUserId = req.user!.userId;
        const id = p(req.params.id);

        // Get all back paper marks for this instance with subject info
        const backMarks = await db.studentMark.findMany({
            where: { examInstanceId: id, isBacklog: true },
        });

        // Fetch subject data for each unique subjectId
        const subjectIds = [...new Set(backMarks.map(m => m.subjectId))];
        const subjects = await db.subject.findMany({
            where: { id: { in: subjectIds } },
            select: { id: true, creditHours: true, maxMarks: true, passMarks: true }
        });
        const subjectMap = new Map(subjects.map(s => [s.id, s]));

        // Group by student × subject
        const groupMap = new Map<string, typeof backMarks>();
        for (const mark of backMarks) {
            const key = `${mark.studentId}|${mark.subjectId}`;
            if (!groupMap.has(key)) groupMap.set(key, []);
            groupMap.get(key)!.push(mark);
        }

        let cleared = 0;
        let stillFailed = 0;

        for (const [key, studentMarks] of groupMap.entries()) {
            const [studentId, subjectId] = key.split('|');
            const subject = subjectMap.get(subjectId);
            if (!subject) continue;

            const totalMarks = studentMarks.reduce((sum, m) => sum + m.marksObtained, 0);
            const percentage = (totalMarks / subject.maxMarks) * 100;
            const { grade, gradePoint } = calculateGrade(percentage);
            const creditPoints = gradePoint * subject.creditHours;
            const passed = totalMarks >= subject.passMarks;

            // Get original result to preserve original marks
            const originalResult = await db.studentResult.findFirst({
                where: { studentId, subjectId, examInstance: { type: 'REGULAR' } },
                orderBy: { createdAt: 'desc' }
            });

            // Create/update result for back paper
            await db.studentResult.upsert({
                where: {
                    studentId_subjectId_examInstanceId: { studentId, subjectId, examInstanceId: id }
                },
                create: {
                    studentId, subjectId, examInstanceId: id,
                    totalMarks, gradePoint, grade, creditPoints,
                    status: passed ? 'CLEARED' : 'FAILED',
                    originalMarks: originalResult?.totalMarks || null
                },
                update: {
                    totalMarks, gradePoint, grade, creditPoints,
                    status: passed ? 'CLEARED' : 'FAILED',
                    originalMarks: originalResult?.totalMarks || null
                }
            });

            if (passed) {
                await db.studentBacklog.update({
                    where: { studentId_subjectId: { studentId, subjectId } },
                    data: { status: 'CLEARED', clearedAt: new Date() }
                });
                cleared++;

                // Recalculate CGPA
                const allSemResults = await db.semesterResult.findMany({ where: { studentId } });
                const totalCP = allSemResults.reduce((s, r) => s + r.totalCreditPoints, 0);
                const totalCr = allSemResults.reduce((s, r) => s + r.totalCredits, 0);
                const cgpa = totalCr > 0 ? parseFloat((totalCP / totalCr).toFixed(2)) : 0;
                await db.user.update({ where: { id: studentId }, data: { cgpa } });
            } else {
                const backlog = await db.studentBacklog.findUnique({
                    where: { studentId_subjectId: { studentId, subjectId } }
                });
                if (backlog) {
                    await db.studentBacklog.update({
                        where: { id: backlog.id },
                        data: { attempts: backlog.attempts + 1 }
                    });
                }
                stillFailed++;
            }
        }

        await db.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'UPDATE',
                entity: 'BackPaperClear',
                entityId: id,
                metadata: { cleared, stillFailed } as any
            }
        });

        res.json({ message: `Backlog processing complete. Cleared: ${cleared}, Still Failed: ${stillFailed}` });
    } catch (error) {
        console.error('Clear Backlog Error:', error);
        res.status(500).json({ error: 'Failed to process backlog clearing.' });
    }
};
