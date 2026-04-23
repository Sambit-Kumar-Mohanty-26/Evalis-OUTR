import { db } from '../config/db';

// ─── CORRECT GRADING SYSTEM ─────────────────────────────────────────────────
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

function getPromotionThreshold(fromYear: number): number {
    switch (fromYear) {
        case 1: return 4.5;
        case 2: return 5.0;
        case 3: return 5.5;
        default: return 6.0;
    }
}

// ─── PROMOTE BATCH SEMESTER ──────────────────────────────────────────────────
export async function promoteBatchSemester(batchId: string, adminUserId: string): Promise<{
    promoted: number;
    promotedWithBacklog: number;
    notPromoted: number;
    graduated: number;
    errors: string[];
    details: any[];
}> {
    const errors: string[] = [];
    const details: any[] = [];
    let promoted = 0;
    let promotedWithBacklog = 0;
    let notPromoted = 0;
    let graduated = 0;

    // 1. Get batch with students
    const batch = await db.batch.findUnique({
        where: { id: batchId },
        include: {
            students: {
                where: { isDeleted: false, role: 'STUDENT' },
                select: { id: true, fullName: true, rollNumber: true, currentSemester: true, cgpa: true }
            },
            semesterTimelines: { orderBy: { semesterNumber: 'asc' } }
        }
    });

    if (!batch) throw new Error('Batch not found.');

    const currentSem = batch.currentSemester;
    const isYearEnd = currentSem % 2 === 0; // Year transitions happen at even semesters
    const currentYear = Math.ceil(currentSem / 2);
    const isFinalSemester = currentSem >= batch.totalSemesters;

    // 2. Check that results are published for current semester
    const unpublished = await db.studentResult.count({
        where: {
            examInstance: { batchId, semester: currentSem },
            isPublished: false
        }
    });

    if (unpublished > 0) {
        errors.push(`Cannot promote: ${unpublished} results are still unpublished for Semester ${currentSem}.`);
        return { promoted, promotedWithBacklog, notPromoted, graduated, errors, details };
    }

    // 3. Get the current BatchSemester for logging
    const batchSemester = await db.batchSemester.findUnique({
        where: { batchId_semesterNumber: { batchId, semesterNumber: currentSem } }
    });

    if (!batchSemester) {
        errors.push('BatchSemester timeline entry not found.');
        return { promoted, promotedWithBacklog, notPromoted, graduated, errors, details };
    }

    // 4. Process each student
    for (const student of batch.students) {
        // Get student's active backlogs
        const activeBacklogs = await db.studentBacklog.count({
            where: { studentId: student.id, status: 'ACTIVE' }
        });

        // Get CGPA (already stored on user)
        const cgpa = student.cgpa || 0;
        const threshold = getPromotionThreshold(currentYear);

        let outcome: 'P' | 'XP' | 'X';
        let remarks = '';

        if (isFinalSemester) {
            // Final semester — check graduation eligibility
            if (cgpa >= threshold && activeBacklogs === 0) {
                outcome = 'P';
                remarks = `Graduated with CGPA ${cgpa.toFixed(2)}`;
                graduated++;
                // Mark student as graduated
                await db.user.update({
                    where: { id: student.id },
                    data: { status: 'GRADUATED' }
                });
            } else if (activeBacklogs > 0) {
                outcome = 'X';
                remarks = `${activeBacklogs} active backlog(s) — cannot graduate`;
                notPromoted++;
            } else {
                outcome = 'X';
                remarks = `CGPA ${cgpa.toFixed(2)} below threshold ${threshold}`;
                notPromoted++;
            }
        } else if (isYearEnd) {
            // Year-end transition — apply strict CGPA rules
            if (cgpa >= threshold && activeBacklogs === 0) {
                outcome = 'P';
                remarks = `Passed. CGPA ${cgpa.toFixed(2)} ≥ ${threshold}`;
                promoted++;
            } else if (cgpa >= threshold && activeBacklogs > 0) {
                outcome = 'XP';
                remarks = `Promoted with ${activeBacklogs} backlog(s). CGPA ${cgpa.toFixed(2)}`;
                promotedWithBacklog++;
            } else {
                outcome = 'X';
                remarks = `Year back. CGPA ${cgpa.toFixed(2)} < ${threshold}`;
                notPromoted++;
            }
        } else {
            // Mid-year (odd → even sem) — simple promotion
            if (activeBacklogs === 0) {
                outcome = 'P';
                remarks = `Promoted to Sem ${currentSem + 1}`;
                promoted++;
            } else {
                outcome = 'XP';
                remarks = `Promoted with ${activeBacklogs} backlog(s) to Sem ${currentSem + 1}`;
                promotedWithBacklog++;
            }
        }

        // Update student semester (only if promoted)
        if (outcome === 'P' || outcome === 'XP') {
            if (!isFinalSemester) {
                await db.user.update({
                    where: { id: student.id },
                    data: { currentSemester: currentSem + 1 }
                });
            }
        }

        // Create promotion log
        await db.promotionLog.create({
            data: {
                studentId: student.id,
                batchSemesterId: batchSemester.id,
                fromSemester: currentSem,
                toSemester: (outcome === 'P' || outcome === 'XP') && !isFinalSemester ? currentSem + 1 : null,
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
            remarks
        });
    }

    // 5. Update batch semester status & advance batch
    await db.batchSemester.update({
        where: { id: batchSemester.id },
        data: { status: 'COMPLETED' }
    });

    if (!isFinalSemester && (promoted > 0 || promotedWithBacklog > 0)) {
        await db.batch.update({
            where: { id: batchId },
            data: { currentSemester: currentSem + 1 }
        });

        // Mark next semester as ONGOING
        const nextSem = await db.batchSemester.findUnique({
            where: { batchId_semesterNumber: { batchId, semesterNumber: currentSem + 1 } }
        });
        if (nextSem) {
            await db.batchSemester.update({
                where: { id: nextSem.id },
                data: { status: 'ONGOING' }
            });
        }
    } else if (isFinalSemester && graduated > 0) {
        await db.batch.update({
            where: { id: batchId },
            data: { status: 'PASSED' }
        });
    }

    return { promoted, promotedWithBacklog, notPromoted, graduated, errors, details };
}
