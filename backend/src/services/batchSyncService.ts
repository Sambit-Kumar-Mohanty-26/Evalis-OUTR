import { db } from '../config/db';

export class BatchSyncService {
    static async syncAllBatches(tenantId: string) {
        try {
            console.log(`[BatchSync] Starting sync for tenant: ${tenantId}`);

            // 1. Get current active version(s)
            const versions = await db.academicVersion.findMany({
                where: { tenantId, isCurrent: true, isDeleted: false },
                include: {
                    programs: {
                        where: { isDeleted: false },
                        include: {
                            schools: {
                                where: { isDeleted: false },
                                include: {
                                    branches: {
                                        where: { isDeleted: false }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (versions.length === 0) {
                console.log(`[BatchSync] No active versions found for tenant: ${tenantId}`);
                return { synced: 0, created: 0 };
            }

            let createdCount = 0;
            let syncedCount = 0;

            for (const version of versions) {
                // Parse startYear from name (e.g., "B.Tech(2023-2027)")
                const match = version.name.match(/(\d{4})/);
                if (!match) continue;
                
                const startYear = parseInt(match[1]);

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

                for (const program of version.programs) {
                    const durationYears = program.durationYears;
                    const endYear = startYear + durationYears;
                    const totalSemesters = durationYears * 2;
                    const batchName = `${startYear}-${endYear}`;

                    for (const school of program.schools) {
                        for (const branch of school.branches) {
                            const existingBatch = await db.batch.findFirst({
                                where: { 
                                    branchId: branch.id, 
                                    startYear,
                                    isDeleted: false
                                }
                            });

                            if (!existingBatch) {
                                const batch = await db.batch.create({
                                    data: {
                                        name: batchName,
                                        startYear,
                                        endYear,
                                        totalSemesters,
                                        currentSemester: 1,
                                        branchId: branch.id,
                                        academicYearId: acYear.id
                                    }
                                });

                                // Auto-generate semester timelines
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
                                createdCount++;
                            }
                            syncedCount++;
                        }
                    }
                }
            }

            console.log(`[BatchSync] Sync complete. Created: ${createdCount}, Synced: ${syncedCount}`);
            return { created: createdCount, synced: syncedCount };
        } catch (error) {
            console.error('[BatchSync] Error during sync:', error);
            throw error;
        }
    }
}
