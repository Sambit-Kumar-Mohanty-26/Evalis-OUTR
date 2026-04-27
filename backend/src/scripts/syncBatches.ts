import { db } from '../config/db';

async function syncBatches() {
    try {
        console.log('--- BATCH SYNC INITIATED ---');
        const tenantId = 'cmoh1eitd0001pgvgp507jbrk';

        // 1. Find active version with year range
        const version = await db.academicVersion.findFirst({
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

        if (!version) {
            console.log('No active academic version found.');
            return;
        }

        console.log(`Active Version: ${version.name}`);

        // 2. Parse startYear from name (e.g., "B.Tech(2023-2027)")
        const match = version.name.match(/(\d{4})/);
        if (!match) {
            console.log('Could not parse start year from version name.');
            return;
        }
        const startYear = parseInt(match[1]);
        console.log(`Parsed Start Year: ${startYear}`);

        // 3. Get or create AcademicYear for the start year
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
            console.log(`Created Academic Year: ${acYear.name}`);
        }

        // 4. For each program -> school -> branch, ensure a batch exists
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
                        console.log(`Created batch for branch: ${branch.name} (${batchName})`);

                        // Auto-generate semester timeline slots
                        const semesterTimelines = [];
                        for (let i = 1; i <= totalSemesters; i++) {
                            const yearOffset = Math.floor((i - 1) / 2);
                            const isOddSem = i % 2 === 1;
                            const semStart = isOddSem
                                ? new Date(`${startYear + yearOffset}-08-01`)
                                : new Date(`${startYear + yearOffset}-12-31`); // Simplified
                            const semEnd = isOddSem
                                ? new Date(`${startYear + yearOffset}-12-31`)
                                : new Date(`${startYear + yearOffset + 1}-05-31`);

                            semesterTimelines.push({
                                semesterNumber: i,
                                startDate: semStart,
                                endDate: semEnd,
                                batchId: batch.id,
                            });
                        }
                        await db.batchSemester.createMany({ data: semesterTimelines });
                    } else {
                        console.log(`Batch already exists for branch: ${branch.name}`);
                    }
                }
            }
        }

        console.log('--- BATCH SYNC COMPLETE ---');
    } catch (e) {
        console.error('Sync Error:', e);
    } finally {
        process.exit();
    }
}

syncBatches();
