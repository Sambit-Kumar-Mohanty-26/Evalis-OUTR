import { Response } from 'express';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';
import { BatchSyncService } from '../../services/batchSyncService';

const p = (v: string | string[] | undefined): string => Array.isArray(v) ? v[0] : (v || '');


// ─── GET ALL BATCHES ─────────────────────────────────────────────────────────
export const getBatches = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;

        // Automatically sync batches with academic structure
        try {
            await BatchSyncService.syncAllBatches(tenantId);
        } catch (e) {
            console.warn('Batch Auto-sync failed:', e);
        }

        const batches = await db.batch.findMany({

            where: {
                isDeleted: false,
                academicYear: { tenantId }
            },
            include: {
                branch: {
                    include: {
                        school: {
                            include: { program: true }
                        }
                    }
                },
                semesterTimelines: {
                    orderBy: { semesterNumber: 'asc' }
                },
                _count: {
                    select: { students: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ batches });
    } catch (error) {
        console.error('Get Batches Error:', error);
        res.status(500).json({ error: 'Failed to retrieve batches.' });
    }
};

// ─── GET SINGLE BATCH ────────────────────────────────────────────────────────
export const getBatchById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);

        const batch = await db.batch.findUnique({
            where: { id },
            include: {
                branch: {
                    include: {
                        school: { include: { program: true } }
                    }
                },
                semesterTimelines: {
                    orderBy: { semesterNumber: 'asc' }
                },
                students: {
                    where: { isDeleted: false },
                    select: {
                        id: true, fullName: true, rollNumber: true,
                        currentSemester: true, cgpa: true, status: true
                    }
                },
                examInstances: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: 'desc' }
                },
                _count: { select: { students: true } }
            }
        });

        if (!batch) {
            res.status(404).json({ error: 'Batch not found.' });
            return;
        }

        res.json(batch);
    } catch (error) {
        console.error('Get Batch Error:', error);
        res.status(500).json({ error: 'Failed to retrieve batch.' });
    }
};

// ─── CREATE BATCH ────────────────────────────────────────────────────────────
export const createBatch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;
        const adminUserId = req.user!.userId;
        const { branchId, startYear } = req.body;

        if (!branchId || !startYear) {
            res.status(400).json({ error: 'branchId and startYear are required.' });
            return;
        }

        // Fetch branch → school → program to get durationYears
        const branch = await db.branch.findUnique({
            where: { id: branchId },
            include: { school: { include: { program: true } } }
        });

        if (!branch || !branch.school?.program) {
            res.status(404).json({ error: 'Branch or parent program not found.' });
            return;
        }

        const program = branch.school.program;
        const durationYears = program.durationYears;
        const endYear = startYear + durationYears;
        const totalSemesters = durationYears * 2;
        const batchName = `${startYear}-${endYear}`;

        // Get or create AcademicYear
        let acYear = await db.academicYear.findFirst({
            where: { tenantId, isCurrent: true }
        });
        if (!acYear) {
            acYear = await db.academicYear.create({
                data: {
                    name: `${startYear}-${startYear + 1}`,
                    startDate: new Date(`${startYear}-08-01`),
                    endDate: new Date(`${startYear + 1}-05-31`),
                    isCurrent: true,
                    tenantId
                }
            });
        }

        // Create batch
        const batch = await db.batch.create({
            data: {
                name: batchName,
                startYear,
                endYear,
                totalSemesters,
                currentSemester: 1,
                branchId,
                academicYearId: acYear.id,
            }
        });

        // Auto-generate semester timeline slots (evenly distributed)
        const semesterTimelines = [];
        for (let i = 1; i <= totalSemesters; i++) {
            const yearOffset = Math.floor((i - 1) / 2);
            const isOddSem = i % 2 === 1;
            const semStart = isOddSem
                ? new Date(`${startYear + yearOffset}-08-01`)
                : new Date(`${startYear + yearOffset + (isOddSem ? 0 : 0)}-01-01`);
            const semEnd = isOddSem
                ? new Date(`${startYear + yearOffset}-12-31`)
                : new Date(`${startYear + yearOffset}-05-31`);

            semesterTimelines.push({
                semesterNumber: i,
                startDate: semStart,
                endDate: semEnd,
                batchId: batch.id,
            });
        }

        await db.batchSemester.createMany({ data: semesterTimelines });

        // Audit
        await db.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'CREATE',
                entity: 'Batch',
                entityId: batch.id,
                metadata: { batchName, startYear, endYear, totalSemesters } as any
            }
        });

        // Return full batch with timelines
        const fullBatch = await db.batch.findUnique({
            where: { id: batch.id },
            include: {
                branch: { include: { school: { include: { program: true } } } },
                semesterTimelines: { orderBy: { semesterNumber: 'asc' } },
                _count: { select: { students: true } }
            }
        });

        res.status(201).json(fullBatch);
    } catch (error) {
        console.error('Create Batch Error:', error);
        res.status(500).json({ error: 'Failed to create batch.' });
    }
};

// ─── UPDATE SEMESTER TIMELINE ────────────────────────────────────────────────
export const updateTimeline = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);
        const { timelines } = req.body; // Array of { semesterNumber, startDate, endDate }

        // Check batch is not locked
        const batch = await db.batch.findUnique({ where: { id } });
        if (!batch) { res.status(404).json({ error: 'Batch not found.' }); return; }
        if (batch.isLocked) { res.status(403).json({ error: 'Batch timeline is locked.' }); return; }

        // Update each timeline
        for (const t of timelines) {
            await db.batchSemester.update({
                where: {
                    batchId_semesterNumber: {
                        batchId: id,
                        semesterNumber: t.semesterNumber
                    }
                },
                data: {
                    startDate: new Date(t.startDate),
                    endDate: new Date(t.endDate),
                }
            });
        }

        const updated = await db.batchSemester.findMany({
            where: { batchId: id },
            orderBy: { semesterNumber: 'asc' }
        });

        res.json({ message: 'Timeline updated.', timelines: updated });
    } catch (error) {
        console.error('Update Timeline Error:', error);
        res.status(500).json({ error: 'Failed to update timeline.' });
    }
};

// ─── LOCK / UNLOCK BATCH ─────────────────────────────────────────────────────
export const toggleBatchLock = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);
        const batch = await db.batch.findUnique({ where: { id } });
        if (!batch) { res.status(404).json({ error: 'Batch not found.' }); return; }

        const updated = await db.batch.update({
            where: { id },
            data: { isLocked: !batch.isLocked }
        });

        res.json({ message: `Batch ${updated.isLocked ? 'locked' : 'unlocked'}.`, batch: updated });
    } catch (error) {
        console.error('Toggle Lock Error:', error);
        res.status(500).json({ error: 'Failed to toggle batch lock.' });
    }
};

// ─── UPDATE BATCH SETTINGS ───────────────────────────────────────────────────
export const updateBatch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);
        const { autoPromote, name } = req.body;

        const data: any = {};
        if (autoPromote !== undefined) data.autoPromote = autoPromote;
        if (name) data.name = name;

        const updated = await db.batch.update({ where: { id }, data });
        res.json(updated);
    } catch (error) {
        console.error('Update Batch Error:', error);
        res.status(500).json({ error: 'Failed to update batch.' });
    }
};

// ─── GET PROMOTION LOGS ──────────────────────────────────────────────────────
export const getPromotionLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);

        const logs = await db.promotionLog.findMany({
            where: { batchSemester: { batchId: id } },
            include: {
                student: { select: { id: true, fullName: true, rollNumber: true } },
                batchSemester: true
            },
            orderBy: { promotedAt: 'desc' }
        });

        res.json({ logs });
    } catch (error) {
        console.error('Get Promotion Logs Error:', error);
        res.status(500).json({ error: 'Failed to retrieve promotion logs.' });
    }
};

// ─── UPDATE COHORT TIMELINE ──────────────────────────────────────────────────
export const updateCohortTimeline = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;
        const { cohortName, timelines } = req.body; 

        if (!cohortName || !timelines) {
            res.status(400).json({ error: 'cohortName and timelines are required.' });
            return;
        }

        // Find all batches for this cohort and tenant
        const batches = await db.batch.findMany({
            where: {
                name: { contains: cohortName },
                academicYear: { tenantId }
            },
            select: { id: true, isLocked: true }
        });

        if (batches.length === 0) {
            res.status(404).json({ error: `No branches have been created for the ${cohortName} cohort yet. Please create at least one branch batch first.` });
            return;
        }

        // Update all batches in this cohort (even if individual branches are 'locked')
        for (const batch of batches) {
            for (const t of timelines) {
                await db.batchSemester.upsert({
                    where: {
                        batchId_semesterNumber: {
                            batchId: batch.id,
                            semesterNumber: t.semesterNumber
                        }
                    },
                    update: {
                        startDate: new Date(t.startDate),
                        endDate: new Date(t.endDate),
                    },
                    create: {
                        batchId: batch.id,
                        semesterNumber: t.semesterNumber,
                        startDate: new Date(t.startDate),
                        endDate: new Date(t.endDate),
                    }
                });
            }
        }

        res.json({ message: `Timeline updated for all ${batches.length} branches in the cohort.` });
    } catch (error) {
        console.error('Update Cohort Timeline Error:', error);
        res.status(500).json({ error: 'Failed to update cohort timeline.' });
    }
};
