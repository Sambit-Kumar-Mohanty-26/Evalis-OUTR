import { db } from '../config/db';

// ─── GRADING SYSTEM ──────────────────────────────────────────────────────────
// ≥91 → O → 10  |  81–90 → A → 9  |  71–80 → B → 8
// 61–70 → C → 7 |  51–60 → D → 6  |  35–50 → P → 5  |  <35 → F → 2

export function calculateGrade(percentage: number): { grade: string; gradePoint: number } {
    if (percentage >= 91) return { grade: 'O', gradePoint: 10 };
    if (percentage >= 81) return { grade: 'A', gradePoint: 9 };
    if (percentage >= 71) return { grade: 'B', gradePoint: 8 };
    if (percentage >= 61) return { grade: 'C', gradePoint: 7 };
    if (percentage >= 51) return { grade: 'D', gradePoint: 6 };
    if (percentage >= 35) return { grade: 'P', gradePoint: 5 };
    return { grade: 'F', gradePoint: 2 };
}

// ─── PROMOTION CGPA THRESHOLDS ───────────────────────────────────────────────
// 1st → 2nd Year: CGPA ≥ 4.5
// 2nd → 3rd Year: CGPA ≥ 5.0
// 3rd → 4th Year: CGPA ≥ 5.5
// Final:          CGPA ≥ 6.0
// Applied at even-semester boundaries only (Sem 2, 4, 6, 8…)
function getPromotionThreshold(fromYear: number): number {
    switch (fromYear) {
        case 1: return 4.5;
        case 2: return 5.0;
        case 3: return 5.5;
        default: return 6.0;
    }
}

// ─── FIND OR CREATE NEXT YEAR'S BATCH ────────────────────────────────────────
async function findOrCreateNextYearBatch(
    currentBatch: {
        branchId: string;
        startYear: number;
        branch: {
            school: {
                program: {
                    durationYears: number;
                    version: { tenantId: string } | null;
                };
            };
        };
    }
): Promise<{ id: string }> {
    const nextStartYear = currentBatch.startYear + 1;

    // Try to find an existing non-deleted batch for same branch + next start year
    const existing = await db.batch.findFirst({
        where: { branchId: currentBatch.branchId, startYear: nextStartYear, isDeleted: false },
        select: { id: true }
    });

    if (existing) return existing;

    // Create the next year's batch
    const { durationYears } = currentBatch.branch.school.program;
    const tenantId = currentBatch.branch.school.program.version?.tenantId;

    if (!tenantId) throw new Error('Cannot resolve tenant for next-year batch creation.');

    const endYear = nextStartYear + durationYears;
    const totalSemesters = durationYears * 2;
    const batchName = `${nextStartYear}-${endYear}`;

    // Get or create an AcademicYear record for this tenant
    let acYear = await db.academicYear.findFirst({
        where: { tenantId, isCurrent: true }
    });
    if (!acYear) {
        acYear = await db.academicYear.create({
            data: {
                name: `${nextStartYear}-${nextStartYear + 1}`,
                startDate: new Date(`${nextStartYear}-08-01`),
                endDate: new Date(`${nextStartYear + 1}-05-31`),
                isCurrent: true,
                tenantId
            }
        });
    }

    const newBatch = await db.batch.create({
        data: {
            name: batchName,
            startYear: nextStartYear,
            endYear,
            totalSemesters,
            currentSemester: 1,
            branchId: currentBatch.branchId,
            academicYearId: acYear.id,
        }
    });

    // Auto-generate semester timeline slots
    const semTimelines = [];
    for (let i = 1; i <= totalSemesters; i++) {
        const yearOffset = Math.floor((i - 1) / 2);
        const isOddSem = i % 2 === 1;
        semTimelines.push({
            semesterNumber: i,
            startDate: isOddSem
                ? new Date(`${nextStartYear + yearOffset}-08-01`)
                : new Date(`${nextStartYear + yearOffset + 1}-01-01`),
            endDate: isOddSem
                ? new Date(`${nextStartYear + yearOffset}-12-31`)
                : new Date(`${nextStartYear + yearOffset + 1}-05-31`),
            batchId: newBatch.id,
        });
    }
    await db.batchSemester.createMany({ data: semTimelines });

    return newBatch;
}

// ─── PROMOTE BATCH SEMESTER ──────────────────────────────────────────────────
export async function promoteBatchSemester(batchId: string, adminUserId: string): Promise<{
    promoted: number;
    promotedWithBacklog: number;
    notPromoted: number;
    movedToNextCohort: number;
    graduated: number;
    errors: string[];
    details: any[];
}> {
    const errors: string[] = [];
    const details: any[] = [];
    let promoted = 0;
    let promotedWithBacklog = 0;
    let notPromoted = 0;
    let movedToNextCohort = 0;
    let graduated = 0;

    // 1. Fetch batch with full branch chain (needed for next-year batch creation)
    const batch = await db.batch.findUnique({
        where: { id: batchId },
        include: {
            branch: {
                include: {
                    school: {
                        include: {
                            program: {
                                include: { version: { select: { tenantId: true } } }
                            }
                        }
                    }
                }
            },
            students: {
                where: { isDeleted: false, role: 'STUDENT' },
                select: { id: true, fullName: true, rollNumber: true, currentSemester: true, cgpa: true }
            },
            semesterTimelines: { orderBy: { semesterNumber: 'asc' } }
        }
    });

    if (!batch) throw new Error('Batch not found.');

    const currentSem = batch.currentSemester;
    const isYearEnd = currentSem % 2 === 0;   // Even semesters mark end of academic year
    const isFinalSemester = currentSem >= batch.totalSemesters;

    // 2. Year-end and final-semester promotions require all results to be published first
    if (isYearEnd || isFinalSemester) {
        const unpublished = await db.studentResult.count({
            where: {
                examInstance: { batchId, semester: currentSem },
                isPublished: false
            }
        });
        if (unpublished > 0) {
            errors.push(`Cannot promote: ${unpublished} result(s) still unpublished for Semester ${currentSem}.`);
            return { promoted, promotedWithBacklog, notPromoted, movedToNextCohort, graduated, errors, details };
        }
    }

    // 3. Fetch current BatchSemester record for logging
    const batchSemester = await db.batchSemester.findUnique({
        where: { batchId_semesterNumber: { batchId, semesterNumber: currentSem } }
    });
    if (!batchSemester) {
        errors.push('Semester timeline record not found.');
        return { promoted, promotedWithBacklog, notPromoted, movedToNextCohort, graduated, errors, details };
    }

    // 4. Lazily resolve next-year batch only once if any student needs it
    let nextYearBatch: { id: string } | null = null;
    const getNextYearBatch = async () => {
        if (!nextYearBatch) {
            nextYearBatch = await findOrCreateNextYearBatch(batch as any);
        }
        return nextYearBatch;
    };

    // 5. Process each student
    for (const student of batch.students) {
        const activeBacklogs = await db.studentBacklog.count({
            where: { studentId: student.id, status: 'ACTIVE' }
        });
        const cgpa = student.cgpa ?? 0;

        // Threshold is derived from which year boundary we are crossing:
        // Sem 2 end → Year 1 (4.5), Sem 4 end → Year 2 (5.0),
        // Sem 6 end → Year 3 (5.5), Sem 8 end / final → Year 4+ (6.0)
        const fromYear = currentSem / 2; // always an integer at even-sem boundaries
        const threshold = getPromotionThreshold(fromYear);

        let outcome: 'P' | 'XP' | 'X';
        let remarks = '';
        let movedBatchId: string | null = null;

        if (isFinalSemester) {
            // ── Graduation check ─────────────────────────────────────────────
            if (cgpa >= threshold && activeBacklogs === 0) {
                outcome = 'P';
                remarks = `Graduated with CGPA ${cgpa.toFixed(2)}`;
                graduated++;
                await db.user.update({ where: { id: student.id }, data: { status: 'GRADUATED' } });
            } else if (activeBacklogs > 0) {
                outcome = 'X';
                remarks = `${activeBacklogs} active backlog(s) — cannot graduate`;
                notPromoted++;
            } else {
                outcome = 'X';
                remarks = `CGPA ${cgpa.toFixed(2)} below ${threshold} — cannot graduate`;
                notPromoted++;
            }

        } else if (isYearEnd) {
            // ── Year-end transition: apply per-year CGPA threshold ────────────
            if (cgpa >= threshold) {
                if (activeBacklogs === 0) {
                    outcome = 'P';
                    remarks = `Promoted to Semester ${currentSem + 1}. CGPA ${cgpa.toFixed(2)} ≥ ${threshold}`;
                    promoted++;
                } else {
                    outcome = 'XP';
                    remarks = `Promoted with ${activeBacklogs} backlog(s) to Semester ${currentSem + 1}. CGPA ${cgpa.toFixed(2)}`;
                    promotedWithBacklog++;
                }
                await db.user.update({ where: { id: student.id }, data: { currentSemester: currentSem + 1 } });
            } else {
                // Year back: move to next cohort's batch (startYear + 1), reset to Semester 1
                outcome = 'X';
                const nextBatch = await getNextYearBatch();
                remarks = `Year back — CGPA ${cgpa.toFixed(2)} < ${threshold}. Moved to ${batch.startYear + 1} cohort.`;
                notPromoted++;
                movedToNextCohort++;
                movedBatchId = nextBatch.id;
                await db.user.update({
                    where: { id: student.id },
                    data: { batchId: nextBatch.id, currentSemester: 1 }
                });
            }

        } else {
            // ── Mid-year (odd → even sem): simple promotion, no CGPA check ───
            if (activeBacklogs === 0) {
                outcome = 'P';
                remarks = `Promoted to Semester ${currentSem + 1}`;
                promoted++;
            } else {
                outcome = 'XP';
                remarks = `Promoted with ${activeBacklogs} backlog(s) to Semester ${currentSem + 1}`;
                promotedWithBacklog++;
            }
            await db.user.update({ where: { id: student.id }, data: { currentSemester: currentSem + 1 } });
        }

        // Create promotion log
        await db.promotionLog.create({
            data: {
                studentId: student.id,
                batchSemesterId: batchSemester.id,
                fromSemester: currentSem,
                toSemester: outcome !== 'X' && !isFinalSemester ? currentSem + 1 : null,
                outcome,
                cgpa,
                remarks,
                promotedBy: adminUserId
            }
        });

        details.push({
            studentId: student.id,
            name: student.fullName,
            rollNumber: student.rollNumber,
            cgpa,
            backlogs: activeBacklogs,
            outcome,
            remarks,
            ...(movedBatchId ? { movedToBatchId: movedBatchId } : {})
        });
    }

    // 6. Mark current semester complete and advance the batch
    await db.batchSemester.update({
        where: { id: batchSemester.id },
        data: { status: 'COMPLETED' }
    });

    if (isFinalSemester && graduated > 0) {
        await db.batch.update({ where: { id: batchId }, data: { status: 'PASSED' } });

    } else if (!isFinalSemester) {
        // Advance the batch to the next semester regardless of outcomes
        await db.batch.update({ where: { id: batchId }, data: { currentSemester: currentSem + 1 } });

        const nextSem = await db.batchSemester.findUnique({
            where: { batchId_semesterNumber: { batchId, semesterNumber: currentSem + 1 } }
        });
        if (nextSem) {
            await db.batchSemester.update({ where: { id: nextSem.id }, data: { status: 'ONGOING' } });
        }
    }

    return { promoted, promotedWithBacklog, notPromoted, movedToNextCohort, graduated, errors, details };
}
