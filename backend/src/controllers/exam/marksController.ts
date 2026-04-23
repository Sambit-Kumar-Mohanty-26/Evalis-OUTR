import { Response } from 'express';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';
import { calculateGrade } from '../../services/promotionService';

const p = (v: string | string[] | undefined): string => Array.isArray(v) ? v[0] : (v || '');

// ─── BULK MARKS ENTRY ────────────────────────────────────────────────────────
export const enterMarks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const teacherId = req.user!.userId;
        const { examInstanceId, subjectId, marks } = req.body;
        // marks: [{ studentId, componentId, marksObtained }]

        if (!examInstanceId || !subjectId || !marks || !Array.isArray(marks)) {
            res.status(400).json({ error: 'examInstanceId, subjectId, and marks array are required.' });
            return;
        }

        // Verify exam is ACTIVE
        const instance = await db.examInstance.findUnique({ where: { id: examInstanceId } });
        if (!instance) { res.status(404).json({ error: 'Exam instance not found.' }); return; }
        if (instance.status !== 'ACTIVE') {
            res.status(400).json({ error: `Marks can only be entered when exam is ACTIVE. Current: ${instance.status}` });
            return;
        }

        // Validate marks against component maxMarks
        const componentIds = [...new Set(marks.map((m: any) => m.componentId))];
        const components = await db.examComponent.findMany({
            where: { id: { in: componentIds } }
        });
        const componentMap = new Map(components.map(c => [c.id, c]));

        const errors: string[] = [];
        const validMarks: any[] = [];

        for (const entry of marks) {
            const comp = componentMap.get(entry.componentId);
            if (!comp) {
                errors.push(`Component ${entry.componentId} not found.`);
                continue;
            }
            if (entry.marksObtained < 0 || entry.marksObtained > comp.maxMarks) {
                errors.push(`Marks ${entry.marksObtained} out of range [0, ${comp.maxMarks}] for ${comp.name}.`);
                continue;
            }
            validMarks.push(entry);
        }

        if (errors.length > 0 && validMarks.length === 0) {
            res.status(400).json({ error: 'All entries invalid.', errors });
            return;
        }

        // Upsert marks
        let created = 0;
        let updated = 0;
        for (const entry of validMarks) {
            const existing = await db.studentMark.findUnique({
                where: {
                    studentId_subjectId_componentId_examInstanceId: {
                        studentId: entry.studentId,
                        subjectId,
                        componentId: entry.componentId,
                        examInstanceId,
                    }
                }
            });

            if (existing) {
                await db.studentMark.update({
                    where: { id: existing.id },
                    data: { marksObtained: entry.marksObtained, enteredBy: teacherId }
                });
                updated++;
            } else {
                await db.studentMark.create({
                    data: {
                        studentId: entry.studentId,
                        subjectId,
                        componentId: entry.componentId,
                        examInstanceId,
                        marksObtained: entry.marksObtained,
                        isBacklog: entry.isBacklog || false,
                        enteredBy: teacherId,
                    }
                });
                created++;
            }
        }

        res.json({ message: `Marks saved. Created: ${created}, Updated: ${updated}`, errors });
    } catch (error) {
        console.error('Enter Marks Error:', error);
        res.status(500).json({ error: 'Failed to save marks.' });
    }
};

// ─── GET MARKS FOR A SUBJECT ─────────────────────────────────────────────────
export const getMarks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const subjectId = p(req.params.subjectId);
        const { examInstanceId } = req.query;

        const where: any = { subjectId };
        if (examInstanceId) where.examInstanceId = examInstanceId;

        const marks = await db.studentMark.findMany({
            where,
            include: {
                student: { select: { id: true, fullName: true, rollNumber: true } },
                component: { select: { id: true, name: true, maxMarks: true, category: true } },
            },
            orderBy: [{ student: { rollNumber: 'asc' } }, { component: { order: 'asc' } }]
        });

        res.json({ marks });
    } catch (error) {
        console.error('Get Marks Error:', error);
        res.status(500).json({ error: 'Failed to retrieve marks.' });
    }
};

// ─── CALCULATE RESULTS ──────────────────────────────────────────────────────
// Correct Grading: ≥91→O(10) | 81-90→A(9) | 71-80→B(8) | 61-70→C(7) | 51-60→D(6) | 35-50→P(5) | <35→F(2)
export const calculateResults = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminUserId = req.user!.userId;
        const { examInstanceId } = req.body;

        if (!examInstanceId) {
            res.status(400).json({ error: 'examInstanceId is required.' });
            return;
        }

        const instance = await db.examInstance.findUnique({
            where: { id: examInstanceId },
            include: { batch: true }
        });
        if (!instance) { res.status(404).json({ error: 'Exam instance not found.' }); return; }

        // Get all marks for this exam instance
        const allMarks = await db.studentMark.findMany({
            where: { examInstanceId },
            include: {
                subject: { select: { id: true, creditHours: true, maxMarks: true, passMarks: true, type: true } },
                component: true
            }
        });

        // Group by student × subject
        const groupMap = new Map<string, typeof allMarks>();
        for (const mark of allMarks) {
            const key = `${mark.studentId}|${mark.subjectId}`;
            if (!groupMap.has(key)) groupMap.set(key, []);
            groupMap.get(key)!.push(mark);
        }

        let resultsCreated = 0;
        let backlogsCreated = 0;
        const studentSGPAMap = new Map<string, { totalCP: number; totalCredits: number; backlogs: number }>();

        for (const [key, studentMarks] of groupMap.entries()) {
            const [studentId, subjectId] = key.split('|');
            const subject = studentMarks[0].subject;

            // Sum all component marks
            const totalMarks = studentMarks.reduce((sum, m) => sum + m.marksObtained, 0);
            const percentage = (totalMarks / subject.maxMarks) * 100;

            // Apply correct grading
            const { grade, gradePoint } = calculateGrade(percentage);
            const creditPoints = gradePoint * subject.creditHours;

            // Check pass/fail using configurable passMarks
            const passed = totalMarks >= subject.passMarks;
            const status = passed ? 'PASSED' : 'FAILED';

            // Upsert StudentResult
            const existing = await db.studentResult.findUnique({
                where: {
                    studentId_subjectId_examInstanceId: { studentId, subjectId, examInstanceId }
                }
            });

            if (existing) {
                await db.studentResult.update({
                    where: { id: existing.id },
                    data: { totalMarks, gradePoint, grade, creditPoints, status }
                });
            } else {
                await db.studentResult.create({
                    data: {
                        studentId, subjectId, examInstanceId,
                        totalMarks, gradePoint, grade, creditPoints, status
                    }
                });
                resultsCreated++;
            }

            // Track for SGPA calculation
            if (!studentSGPAMap.has(studentId)) {
                studentSGPAMap.set(studentId, { totalCP: 0, totalCredits: 0, backlogs: 0 });
            }
            const sgpaEntry = studentSGPAMap.get(studentId)!;
            sgpaEntry.totalCP += creditPoints;
            sgpaEntry.totalCredits += subject.creditHours;

            // Handle backlog
            if (!passed) {
                sgpaEntry.backlogs++;

                // Upsert StudentBacklog
                const existingBacklog = await db.studentBacklog.findUnique({
                    where: { studentId_subjectId: { studentId, subjectId } }
                });

                if (existingBacklog) {
                    await db.studentBacklog.update({
                        where: { id: existingBacklog.id },
                        data: { attempts: existingBacklog.attempts + 1, status: 'ACTIVE' }
                    });
                } else {
                    await db.studentBacklog.create({
                        data: {
                            studentId, subjectId,
                            semesterNumber: instance.semester,
                            status: 'ACTIVE'
                        }
                    });
                    backlogsCreated++;
                }
            }
        }

        // Calculate & store SGPA for each student
        for (const [studentId, data] of studentSGPAMap.entries()) {
            const sgpa = data.totalCredits > 0 ? data.totalCP / data.totalCredits : 0;

            await db.semesterResult.upsert({
                where: {
                    studentId_semesterNumber_batchId: {
                        studentId,
                        semesterNumber: instance.semester,
                        batchId: instance.batchId
                    }
                },
                create: {
                    studentId,
                    semesterNumber: instance.semester,
                    batchId: instance.batchId,
                    sgpa: parseFloat(sgpa.toFixed(2)),
                    totalCredits: data.totalCredits,
                    totalCreditPoints: data.totalCP,
                    backlogs: data.backlogs
                },
                update: {
                    sgpa: parseFloat(sgpa.toFixed(2)),
                    totalCredits: data.totalCredits,
                    totalCreditPoints: data.totalCP,
                    backlogs: data.backlogs
                }
            });

            // Update CGPA on user (cumulative across all semesters)
            const allSemResults = await db.semesterResult.findMany({
                where: { studentId }
            });
            const totalCP = allSemResults.reduce((s, r) => s + r.totalCreditPoints, 0);
            const totalCr = allSemResults.reduce((s, r) => s + r.totalCredits, 0);
            const cgpa = totalCr > 0 ? parseFloat((totalCP / totalCr).toFixed(2)) : 0;

            await db.user.update({
                where: { id: studentId },
                data: { cgpa }
            });
        }

        // Audit
        await db.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'CREATE',
                entity: 'ResultCalculation',
                entityId: examInstanceId,
                metadata: { resultsCreated, backlogsCreated, studentsProcessed: studentSGPAMap.size } as any
            }
        });

        res.json({
            message: 'Results calculated successfully.',
            resultsCreated,
            backlogsCreated,
            studentsProcessed: studentSGPAMap.size
        });
    } catch (error) {
        console.error('Calculate Results Error:', error);
        res.status(500).json({ error: 'Failed to calculate results.' });
    }
};

// ─── GET STUDENT RESULT CARD ─────────────────────────────────────────────────
export const getStudentResults = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = p(req.params.studentId);

        const results = await db.studentResult.findMany({
            where: { studentId },
            include: {
                subject: { select: { name: true, code: true, creditHours: true, type: true } },
                examInstance: { select: { name: true, semester: true, type: true } }
            },
            orderBy: [{ examInstance: { semester: 'asc' } }, { subject: { name: 'asc' } }]
        });

        const semesterResults = await db.semesterResult.findMany({
            where: { studentId },
            orderBy: { semesterNumber: 'asc' }
        });

        const backlogs = await db.studentBacklog.findMany({
            where: { studentId, status: 'ACTIVE' },
            include: { subject: { select: { name: true, code: true } } }
        });

        const user = await db.user.findUnique({
            where: { id: studentId },
            select: { cgpa: true, currentSemester: true, status: true }
        });

        res.json({ results, semesterResults, backlogs, cgpa: user?.cgpa, studentStatus: user?.status });
    } catch (error) {
        console.error('Get Student Results Error:', error);
        res.status(500).json({ error: 'Failed to retrieve results.' });
    }
};
