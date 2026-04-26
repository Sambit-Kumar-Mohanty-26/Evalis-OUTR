import { Request, Response } from 'express';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';

export const createProgram = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, durationYears, versionId, orgNodeId } = req.body;
        const userId = req.user?.userId;

        const program = await db.program.create({
            data: { 
                name, 
                durationYears: parseInt(durationYears), 
                versionId,
                orgNodeId: orgNodeId || null
            }
        });

        // Audit Log
        if (userId) {
            await db.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE',
                    entity: 'Program',
                    entityId: program.id,
                    metadata: program as any
                }
            });
        }

        res.status(201).json(program);
    } catch (error) {
        console.error('Create Program Error:', error);
        res.status(500).json({ 
            error: 'Failed to define course architecture.',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

export const createSchool = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, programId, orgNodeId } = req.body;
        const userId = req.user?.userId;

        if (!programId) {
            res.status(400).json({ error: 'programId (Course ID) is required.' });
            return;
        }

        const school = await db.academicSchool.create({
            data: {
                name,
                programId,
                orgNodeId: orgNodeId || null
            }
        });

        if (userId) {
            await db.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE',
                    entity: 'AcademicSchool',
                    entityId: school.id,
                    metadata: school as any
                }
            });
        }

        res.status(201).json(school);
    } catch (error) {
        console.error('Create School Error:', error);
        res.status(500).json({ 
            error: 'Failed to establish school.',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

export const createBranch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, schoolId, orgNodeId } = req.body;
        const userId = req.user?.userId;

        console.log('--- BRANCH CREATION DEBUG ---');
        console.log('Payload:', { name, schoolId, orgNodeId });

        if (!schoolId) {
            res.status(400).json({ error: 'Validation Failed: schoolId is required.' });
            return;
        }

        if (!name) {
            res.status(400).json({ error: 'Validation Failed: name is required.' });
            return;
        }

        // Fetch school and parent program to calculate semesters
        const school = await db.academicSchool.findUnique({ 
            where: { id: schoolId },
            include: { program: true }
        });

        if (!school || !school.program) {
            res.status(404).json({ error: 'Parent school or course not found.' });
            return;
        }

        const branch = await db.branch.create({
            data: { 
                name, 
                schoolId, 
                orgNodeId: orgNodeId || null 
            }
        });

        // AUTOMATED SEMESTER GENERATION (2 per year)
        const totalSemesters = school.program.durationYears * 2;
        const semesterData = Array.from({ length: totalSemesters }, (_, i) => ({
            semesterNumber: i + 1,
            branchId: branch.id
        }));

        await db.semester.createMany({
            data: semesterData
        });

        // Audit Log
        if (userId) {
            await db.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE',
                    entity: 'Branch',
                    entityId: branch.id,
                    metadata: { 
                        name: branch.name,
                        schoolId: branch.schoolId,
                        automatedSemesters: totalSemesters 
                    }
                }
            });
        }

        res.status(201).json(branch);
    } catch (error) {
        console.error('CRITICAL: Create Branch Error Details:', error);
        res.status(500).json({ 
            error: 'Failed to architecturalize branch.',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

export const createSubject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, code, creditHours, maxMarks, type, semesterId, examSchemaId } = req.body;
        const userId = req.user?.userId;

        const subject = await db.subject.create({
            data: { 
                name, 
                code, 
                creditHours: parseInt(creditHours), 
                maxMarks: parseInt(maxMarks), 
                type, 
                semesterId,
                examSchemaId: examSchemaId || null
            }
        });

        // Audit Log
        if (userId) {
            await db.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE',
                    entity: 'Subject',
                    entityId: subject.id,
                    metadata: subject as any
                }
            });
        }

        res.status(201).json(subject);
    } catch (error) {
        console.error('Create Subject Error:', error);
        res.status(500).json({ error: 'Failed to synthesize subject.' });
    }
};

export const createSemester = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { semesterNumber, branchId } = req.body;
        const semester = await db.semester.create({
            data: { semesterNumber: parseInt(semesterNumber), branchId }
        });
        res.status(201).json(semester);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add manual semester.' });
    }
};

export const getSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { semesterId, branchId } = req.query;
        const where: any = { isDeleted: false };
        if (semesterId) where.semesterId = semesterId;
        
        // If branchId is provided, find all semesters in that branch
        if (branchId) {
            where.semester = { branchId };
        }

        const subjects = await db.subject.findMany({
            where,
            include: {
                semester: {
                    include: { branch: true }
                },
                examSchema: { select: { id: true, name: true, type: true, totalMarks: true } }
            },
            orderBy: { name: 'asc' }
        });
        res.json({ subjects });
    } catch (error) {
        console.error('Get Subjects Error:', error);
        res.status(500).json({ error: 'Failed to retrieve subjects.' });
    }
};
