import { Response } from 'express';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';

const p = (v: string | string[] | undefined): string => Array.isArray(v) ? v[0] : (v || '');

// ─── LIST EXAM INSTANCES ─────────────────────────────────────────────────────
export const getExamInstances = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { batchId, semester } = req.query;

        const where: any = { isDeleted: false };
        if (batchId) where.batchId = batchId;
        if (semester) where.semester = parseInt(semester as string);

        const instances = await db.examInstance.findMany({
            where,
            include: {
                batch: {
                    select: { id: true, name: true, currentSemester: true }
                },
                _count: { select: { marks: true, results: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ instances });
    } catch (error) {
        console.error('Get Exam Instances Error:', error);
        res.status(500).json({ error: 'Failed to retrieve exam instances.' });
    }
};

// ─── CREATE EXAM INSTANCE ────────────────────────────────────────────────────
export const createExamInstance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminUserId = req.user!.userId;
        const { name, type, batchId, semester, scheduledDate } = req.body;

        if (!name || !batchId || !semester) {
            res.status(400).json({ error: 'name, batchId, and semester are required.' });
            return;
        }

        const instance = await db.examInstance.create({
            data: {
                name,
                type: type || 'REGULAR',
                batchId,
                semester: parseInt(semester),
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
            },
            include: {
                batch: { select: { id: true, name: true } }
            }
        });

        await db.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'CREATE',
                entity: 'ExamInstance',
                entityId: instance.id,
                metadata: { name, type: instance.type, batchId, semester } as any
            }
        });

        res.status(201).json(instance);
    } catch (error) {
        console.error('Create Exam Instance Error:', error);
        res.status(500).json({ error: 'Failed to create exam instance.' });
    }
};

// ─── UPDATE EXAM STATUS (DRAFT → ACTIVE → LOCKED) ───────────────────────────
export const updateExamStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);
        const { status } = req.body;
        const adminUserId = req.user!.userId;

        const validTransitions: Record<string, string[]> = {
            'DRAFT': ['ACTIVE'],
            'ACTIVE': ['LOCKED'],
            'LOCKED': [] // Terminal state
        };

        const instance = await db.examInstance.findUnique({ where: { id } });
        if (!instance) { res.status(404).json({ error: 'Exam instance not found.' }); return; }

        if (!validTransitions[instance.status]?.includes(status)) {
            res.status(400).json({ error: `Cannot transition from ${instance.status} to ${status}.` });
            return;
        }

        const data: any = { status };
        if (status === 'LOCKED') {
            data.lockedAt = new Date();
            data.lockedBy = adminUserId;
        }

        const updated = await db.examInstance.update({ where: { id }, data });

        await db.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'UPDATE',
                entity: 'ExamInstance',
                entityId: id,
                metadata: { from: instance.status, to: status } as any
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update Exam Status Error:', error);
        res.status(500).json({ error: 'Failed to update exam status.' });
    }
};

// ─── PUBLISH RESULTS ─────────────────────────────────────────────────────────
export const publishResults = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);
        const adminUserId = req.user!.userId;

        // Verify exam is LOCKED
        const instance = await db.examInstance.findUnique({ where: { id } });
        if (!instance) { res.status(404).json({ error: 'Exam instance not found.' }); return; }
        if (instance.status !== 'LOCKED') {
            res.status(400).json({ error: 'Exam must be LOCKED before publishing results.' });
            return;
        }

        // Publish all results for this instance
        const updated = await db.studentResult.updateMany({
            where: { examInstanceId: id },
            data: { isPublished: true }
        });

        await db.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'UPDATE',
                entity: 'ExamInstance',
                entityId: id,
                metadata: { action: 'PUBLISH_RESULTS', resultCount: updated.count } as any
            }
        });

        res.json({ message: `${updated.count} result(s) published.` });
    } catch (error) {
        console.error('Publish Results Error:', error);
        res.status(500).json({ error: 'Failed to publish results.' });
    }
};
