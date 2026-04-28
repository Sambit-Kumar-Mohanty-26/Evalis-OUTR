import { Response } from 'express';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';
// trigger nodemon restart

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
        const tenantId = req.user!.tenantId;
        const { name, type, evaluationType, batchId, cohortName, semester, scheduledDate, marksDeadline } = req.body;

        if (!name || (!batchId && !cohortName) || !semester) {
            res.status(400).json({ error: 'name, batchId or cohortName, and semester are required.' });
            return;
        }

        let batchesToProcess: any[] = [];

        if (batchId) {
            // Check if it is an actual batchId (length ~ 25 cuid) or cohort name
            if (batchId.length > 10) {
                const existingBatch = await db.batch.findUnique({ where: { id: batchId } });
                if (existingBatch) batchesToProcess.push(existingBatch);
            }
            
            if (batchesToProcess.length === 0) {
                // Assume it's a cohort name
                const matchingBatches = await db.batch.findMany({
                    where: { name: { contains: batchId }, isDeleted: false, academicYear: { tenantId } }
                });
                batchesToProcess = matchingBatches;
            }
        } else if (cohortName) {
            const matchingBatches = await db.batch.findMany({
                where: { name: { contains: cohortName }, isDeleted: false, academicYear: { tenantId } }
            });
            batchesToProcess = matchingBatches;
        }

        if (batchesToProcess.length === 0) {
            res.status(404).json({ error: 'No matching batches found for this cohort selection.' });
            return;
        }

        const createdInstances = [];
        for (const b of batchesToProcess) {
            const instance = await db.examInstance.create({
                data: {
                    name,
                    type: type || 'REGULAR',
                    // @ts-ignore
                    evaluationType: evaluationType || 'INTERNAL',
                    batchId: b.id,
                    semester: parseInt(semester),
                    scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                    marksDeadline: marksDeadline ? new Date(marksDeadline) : null,
                },
                include: {
                    batch: { select: { id: true, name: true } }
                }
            });
            createdInstances.push(instance);

            await db.auditLog.create({
                data: {
                    userId: adminUserId,
                    action: 'CREATE',
                    entity: 'ExamInstance',
                    entityId: instance.id,
                    // @ts-ignore
                    metadata: { name, type: instance.type, evaluationType: instance.evaluationType, batchId: b.id, semester } as any
                }
            });
        }

        res.status(201).json(createdInstances.length === 1 ? createdInstances[0] : { instances: createdInstances });
    } catch (error) {
        console.error('Create Exam Instance Error:', error);
        res.status(500).json({ error: 'Failed to create exam instance.' });
    }
};

// ─── UPDATE EXAM STATUS (DRAFT → ACTIVE → LOCKED) ───────────────────────────
export const updateExamStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);
        const { status, marksEntryClosed, marksDeadline } = req.body;
        const adminUserId = req.user!.userId;

        const validTransitions: Record<string, string[]> = {
            'DRAFT': ['ACTIVE'],
            'ACTIVE': ['LOCKED'],
            'LOCKED': [] // Terminal state
        };

        const instance = await db.examInstance.findUnique({ where: { id } });
        if (!instance) { res.status(404).json({ error: 'Exam instance not found.' }); return; }

        const data: any = {};
        if (status) {
            if (!validTransitions[instance.status]?.includes(status)) {
                res.status(400).json({ error: `Cannot transition from ${instance.status} to ${status}.` });
                return;
            }
            data.status = status;
            if (status === 'LOCKED') {
                data.lockedAt = new Date();
                data.lockedBy = adminUserId;
                data.marksEntryClosed = true;
            }
        }

        if (marksEntryClosed !== undefined) data.marksEntryClosed = marksEntryClosed;
        if (marksDeadline !== undefined) data.marksDeadline = marksDeadline ? new Date(marksDeadline) : null;

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

// ─── DELETE EXAM INSTANCE ────────────────────────────────────────────────────
export const deleteExamInstance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);
        const adminUserId = req.user!.userId;

        const marksCount = await db.studentMark.count({ where: { examInstanceId: id } });
        if (marksCount > 0) {
            res.status(400).json({ error: 'Cannot delete exam instance because marks have already been recorded.' });
            return;
        }

        await db.studentResult.deleteMany({ where: { examInstanceId: id } });
        await db.studentSubMark.deleteMany({ where: { examInstanceId: id } });

        await db.examInstance.delete({
            where: { id }
        });

        await db.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'DELETE',
                entity: 'ExamInstance',
                entityId: id,
                metadata: { note: 'Hard deleted by admin' } as any
            }
        });

        res.json({ message: 'Exam instance deleted successfully.' });
    } catch (error) {
        console.error('Delete Exam Instance Error:', error);
        res.status(500).json({ error: 'Failed to delete exam instance.' });
    }
};
