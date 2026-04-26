import { db } from '../config/db';

// ─── PASS / FAIL PERCENTAGE ─────────────────────────────────────────────────
export const getPassPercent = (results: { status: string }[]): number => {
    if (results.length === 0) return 0;
    const passed = results.filter(r => r.status === 'PASSED').length;
    return parseFloat(((passed / results.length) * 100).toFixed(1));
};

export const getFailPercent = (results: { status: string }[]): number => {
    return parseFloat((100 - getPassPercent(results)).toFixed(1));
};

// ─── AVERAGE CGPA ────────────────────────────────────────────────────────────
export const getAvgCGPA = (students: { cgpa: number | null }[]): number => {
    const valid = students.filter(s => s.cgpa !== null && s.cgpa > 0);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, s) => acc + (s.cgpa || 0), 0);
    return parseFloat((sum / valid.length).toFixed(2));
};

// ─── BACKLOG % ────────────────────────────────────────────────────────────────
export const getBacklogPercent = (totalStudents: number, studentsWithBacklog: number): number => {
    if (totalStudents === 0) return 0;
    return parseFloat(((studentsWithBacklog / totalStudents) * 100).toFixed(1));
};

// ─── SUBJECT FAIL RATE ────────────────────────────────────────────────────────
export const getSubjectFailRate = async (subjectId: string): Promise<number> => {
    const results = await db.studentResult.findMany({
        where: { subjectId, isPublished: true },
        select: { status: true }
    });
    return getFailPercent(results);
};

// ─── BRANCH OVERVIEW STATS ───────────────────────────────────────────────────
export const getBranchStats = async (branchId: string) => {
    const [students, backlogs, results] = await Promise.all([
        db.user.findMany({
            where: { batch: { branchId }, role: 'STUDENT', isDeleted: false },
            select: { id: true, cgpa: true, currentSemester: true }
        }),
        db.studentBacklog.findMany({
            where: { student: { batch: { branchId } }, status: 'ACTIVE' },
            select: { studentId: true }
        }),
        db.studentResult.findMany({
            where: { student: { batch: { branchId } }, isPublished: true },
            select: { status: true }
        })
    ]);

    const uniqueStudentsWithBacklog = new Set(backlogs.map(b => b.studentId)).size;

    // Semester distribution
    const semDist: Record<number, number> = {};
    students.forEach(s => {
        const sem = s.currentSemester || 1;
        semDist[sem] = (semDist[sem] || 0) + 1;
    });

    const branch = await db.branch.findUnique({
        where: { id: branchId },
        include: { school: true }
    });

    return {
        branchName: branch?.name || 'N/A',
        schoolName: branch?.school?.name || 'N/A',
        totalStudents: students.length,
        avgCGPA: getAvgCGPA(students),
        passPercent: getPassPercent(results),
        backlogPercent: getBacklogPercent(students.length, uniqueStudentsWithBacklog),
        semesterDistribution: semDist,
    };
};

// ─── SCHOOL STATS ────────────────────────────────────────────────────────────
export const getSchoolStats = async (schoolOrgNodeId: string, tenantId: string) => {
    // Get school from orgNode
    const school = await db.academicSchool.findFirst({
        where: { orgNodeId: schoolOrgNodeId, isDeleted: false },
        include: { branches: { where: { isDeleted: false } } }
    });

    if (!school) return null;

    const branchIds = school.branches.map(b => b.id);

    const [students, backlogs, results] = await Promise.all([
        db.user.findMany({
            where: { batch: { branchId: { in: branchIds } }, role: 'STUDENT', isDeleted: false, tenantId },
            select: { id: true, cgpa: true }
        }),
        db.studentBacklog.findMany({
            where: { student: { batch: { branchId: { in: branchIds } } }, status: 'ACTIVE' },
            select: { studentId: true }
        }),
        db.studentResult.findMany({
            where: { student: { batch: { branchId: { in: branchIds } } }, isPublished: true },
            select: { status: true }
        })
    ]);

    const uniqueBacklogStudents = new Set(backlogs.map(b => b.studentId)).size;

    return {
        schoolName: school.name,
        totalBranches: school.branches.length,
        totalStudents: students.length,
        avgCGPA: getAvgCGPA(students),
        passPercent: getPassPercent(results),
        backlogPercent: getBacklogPercent(students.length, uniqueBacklogStudents),
        branchIds
    };
};
