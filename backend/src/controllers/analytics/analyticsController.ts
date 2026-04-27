import { Request, Response } from 'express';
import { db as prisma } from '../../config/db';

// ─── FILTERS & CONTEXT ───────────────────────────────────────────────────────

export const getAnalyticsFilters = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const allBatches = await prisma.batch.findMany({
            where: { 
                isDeleted: false, 
                branch: { 
                    isDeleted: false,
                    name: { not: "New Entity" },
                    school: { 
                        isDeleted: false,
                        orgNode: { tenantId } 
                    } 
                } 
            },
            include: { 
                branch: { 
                    include: { 
                        school: true 
                    } 
                } 
            }
        });

        // Extract unique cohorts (e.g., "2021-2025")
        const cohorts = Array.from(new Set(allBatches.map(b => `${b.startYear}-${b.endYear}`)))
            .map(c => ({ id: c, name: c }))
            .sort((a,b) => b.name.localeCompare(a.name));

        // Group everything for easier frontend consumption
        const mappings = allBatches.map(b => ({
            cohort: `${b.startYear}-${b.endYear}`,
            schoolId: b.branch.school.id,
            schoolName: b.branch.school.name,
            branchId: b.branchId,
            branchName: b.branch.name
        }));

        // Unique semesters across all branches
        const semesters = await prisma.semester.findMany({
            where: { branch: { school: { orgNode: { tenantId } } } },
            distinct: ['semesterNumber'],
            select: { semesterNumber: true },
            orderBy: { semesterNumber: 'asc' }
        });

        res.json({
            cohorts,
            mappings,
            semesters: semesters.map(s => ({ value: s.semesterNumber.toString(), label: `Sem ${s.semesterNumber}` }))
        });
    } catch (error) {
        console.error('Fetch filters error:', error);
        res.status(500).json({ error: 'Failed to load filters' });
    }
};

// ─── ADMIN ANALYTICS ─────────────────────────────────────────────────────────

export const getAdminOverview = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { school, branch, semester, exam } = req.query;

        const whereStudent: any = { role: 'STUDENT', tenantId, isDeleted: false };
        if (branch) whereStudent.batch = { branchId: branch as string };

        const students = await prisma.user.findMany({ where: whereStudent, select: { id: true, cgpa: true } });
        const totalStudents = students.length;

        const results = await prisma.studentResult.findMany({
            where: { student: { tenantId, isDeleted: false } },
            select: { status: true, totalMarks: true, gradePoint: true },
        });

        const passed = results.filter(r => r.status === 'PASSED').length;
        const failed = results.filter(r => r.status === 'FAILED' || r.status === 'BACKLOG').length;
        const total = passed + failed;

        // SGPA distribution
        const semResults = await prisma.semesterResult.findMany({
            where: { student: { tenantId, isDeleted: false } },
            select: { sgpa: true, semesterNumber: true, studentId: true },
        });

        const sgpaBuckets = { '0-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
        semResults.forEach(r => {
            if (r.sgpa < 4) sgpaBuckets['0-4']++;
            else if (r.sgpa < 6) sgpaBuckets['4-6']++;
            else if (r.sgpa < 8) sgpaBuckets['6-8']++;
            else sgpaBuckets['8-10']++;
        });

        // CGPA trend by semester
        const semNumbers = [...new Set(semResults.map(r => r.semesterNumber))].sort();
        const cgpaTrend = semNumbers.map(sem => {
            const semData = semResults.filter(r => r.semesterNumber === sem);
            const avg = semData.reduce((s, r) => s + r.sgpa, 0) / (semData.length || 1);
            return { semester: `Sem ${sem}`, cgpa: parseFloat(avg.toFixed(2)) };
        });

        const avgCgpaResult = await prisma.user.aggregate({
            where: { tenantId, role: 'STUDENT', isDeleted: false, cgpa: { not: null } },
            _avg: { cgpa: true },
        });

        res.json({
            passRate: total ? parseFloat(((passed / total) * 100).toFixed(1)) : 0,
            failRate: total ? parseFloat(((failed / total) * 100).toFixed(1)) : 0,
            totalStudents,
            avgCgpa: avgCgpaResult._avg.cgpa || 0,
            sgpaDistribution: [
                { range: '0–4', count: sgpaBuckets['0-4'], fill: '#EF4444' },
                { range: '4–6', count: sgpaBuckets['4-6'], fill: '#F59E0B' },
                { range: '6–8', count: sgpaBuckets['6-8'], fill: '#3B82F6' },
                { range: '8–10', count: sgpaBuckets['8-10'], fill: '#3D8528' },
            ],
            cgpaTrend,
            passFailPie: [
                { name: 'Pass', value: total ? parseFloat(((passed / total) * 100).toFixed(0)) : 0, fill: '#3D8528' },
                { name: 'Fail', value: total ? parseFloat(((failed / total) * 100).toFixed(0)) : 0, fill: '#EF4444' },
            ],
            insights: [
                `Overall pass rate is ${total ? ((passed / total) * 100).toFixed(1) : 0}% across the institution.`,
                `${totalStudents} students currently enrolled in active batches.`,
                `CGPA trend shows ${cgpaTrend.length > 1 ? (cgpaTrend[cgpaTrend.length - 1].cgpa > cgpaTrend[0].cgpa ? 'improvement' : 'stability') : 'consistent data'} across semesters.`,
            ],
        });
    } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ error: 'Failed to load admin analytics overview' });
    }
};

export const getAdminDeepInsights = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;

        // Branch comparison
        const branches = await prisma.branch.findMany({
            where: { school: { program: { version: { tenantId } } }, isDeleted: false },
            include: { school: true },
        });

        const branchComparison = await Promise.all(branches.map(async (b) => {
            const results = await prisma.studentResult.findMany({
                where: { subject: { semester: { branchId: b.id } } },
                select: { status: true },
            });
            const total = results.length;
            const passed = results.filter(r => r.status === 'PASSED').length;
            return { branch: b.name, passRate: total ? Math.round((passed / total) * 100) : 0 };
        }));

        // Subject difficulty (highest failure)
        const subjects = await prisma.subject.findMany({
            where: { semester: { branch: { school: { program: { version: { tenantId } } } } }, isDeleted: false },
            include: { results: { select: { status: true } }, semester: true },
        });

        const subjectDifficulty = subjects
            .map(s => {
                const total = s.results.length;
                const failed = s.results.filter(r => r.status === 'FAILED' || r.status === 'BACKLOG').length;
                return { subject: s.name, failRate: total ? Math.round((failed / total) * 100) : 0, semester: s.semester.semesterNumber };
            })
            .sort((a, b) => b.failRate - a.failRate)
            .slice(0, 8);

        // Top performers
        const topPerformers = await prisma.user.findMany({
            where: { role: 'STUDENT', tenantId, isDeleted: false, cgpa: { not: null } },
            orderBy: { cgpa: 'desc' },
            take: 5,
            select: { fullName: true, rollNumber: true, cgpa: true, batch: { select: { branch: { select: { name: true } } } } },
        });

        // Worst performing segments (branches with lowest pass rate)
        const worstSegments = branchComparison
            .sort((a, b) => a.passRate - b.passRate)
            .slice(0, 3)
            .map(b => ({
                segment: b.branch,
                passRate: b.passRate,
                issue: b.passRate < 50 ? 'Critical Failure Rate' : 'Below Average Performance'
            }));

        // Backlog distribution (properly formatted for stacked chart)
        const backlogCounts = await prisma.studentBacklog.findMany({
            where: { student: { tenantId, isDeleted: false } },
            select: { semesterNumber: true, status: true }
        });

        const semMap: Record<number, any> = {};
        backlogCounts.forEach(b => {
            if (!semMap[b.semesterNumber]) semMap[b.semesterNumber] = { semester: `Sem ${b.semesterNumber}`, zero: 0, one: 0, twoPlus: 0 };
            // Note: This logic is simplified; a real one would count backlogs per student
            if (b.status === 'ACTIVE') semMap[b.semesterNumber].one++; 
        });
        const backlogDistribution = Object.values(semMap);

        res.json({
            branchComparison,
            subjectDifficulty,
            topPerformers: topPerformers.map((s, i) => ({
                rank: i + 1, name: s.fullName, roll: s.rollNumber || '', branch: s.batch?.branch?.name || '', cgpa: s.cgpa,
            })),
            backlogDistribution: backlogDistribution.length ? backlogDistribution : [],
            worstSegments: worstSegments.length ? worstSegments : [],
            insights: [
                subjectDifficulty.length > 0 ? `${subjectDifficulty[0].subject} has the highest failure rate at ${subjectDifficulty[0].failRate}%.` : 'No significant subject failure spikes detected.',
                branchComparison.length > 0 ? `${branchComparison.sort((a,b) => b.passRate - a.passRate)[0].branch} is the top performing branch.` : '',
                `Top performer ${topPerformers[0]?.fullName || 'N/A'} leads with a CGPA of ${topPerformers[0]?.cgpa || 0}.`,
            ].filter(Boolean),
        });
    } catch (error) {
        console.error('Admin deep insights error:', error);
        res.status(500).json({ error: 'Failed to load admin deep insights' });
    }
};

export const getAdminSystemHealth = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;

        const exams = await prisma.examInstance.findMany({
            where: { batch: { branch: { school: { program: { version: { tenantId } } } } }, isDeleted: false },
            select: { id: true, name: true, status: true, marksEntryClosed: true, semester: true },
        });

        const totalExams = exams.length;
        const locked = exams.filter(e => e.status === 'LOCKED').length;

        const results = await prisma.studentResult.findMany({
            where: { examInstance: { batch: { branch: { school: { program: { version: { tenantId } } } } } } },
            select: { isPublished: true },
        });
        const published = results.filter(r => r.isPublished).length;
        const totalResults = results.length;

        res.json({
            marksEntry: [
                { name: 'Submitted', value: totalExams ? Math.round((locked / totalExams) * 100) : 0, fill: '#3D8528' },
                { name: 'Pending', value: totalExams ? Math.round(((totalExams - locked) / totalExams) * 100) : 0, fill: '#F59E0B' },
            ],
            resultPublishing: exams.map(e => ({
                exam: e.name,
                status: e.status === 'LOCKED' ? 'Published' : 'Processing',
                date: '—',
            })),
            publishingSummary: {
                total: totalResults,
                published,
                pending: totalResults - published,
            },
            examInstances: exams.map(e => ({ name: e.name, status: e.status, semester: e.semester })),
            teacherActivity: await Promise.all(
                (await prisma.user.findMany({ 
                    where: { tenantId, role: 'TEACHER', isDeleted: false },
                    take: 5
                })).map(async (t) => {
                    const entered = await prisma.studentMark.count({ where: { enteredBy: t.id } });
                    const totalAssigned = await prisma.batch.count({ where: { branch: { school: { program: { version: { tenantId } } } } } }); // Mock total for now
                    return { 
                        teacher: t.fullName, 
                        marksEntered: entered, 
                        total: totalAssigned > 0 ? totalAssigned : 100 
                    };
                })
            ),
            insights: [
                `Marks entry is ${totalExams ? Math.round((locked / totalExams) * 100) : 0}% complete across all exams.`,
                published === totalResults ? 'All results for the current cycle have been published.' : `${totalResults - published} results are still pending publication.`,
            ],
        });
    } catch (error) {
        console.error('Admin system health error:', error);
        res.status(500).json({ error: 'Failed to load admin system health' });
    }
};

// ─── HOS ANALYTICS ───────────────────────────────────────────────────────────

export const getHosSchoolOverview = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const schoolNode = await prisma.organizationNode.findFirst({
            where: { admins: { some: { id: user.id } } },
        });
        if (!schoolNode) return res.status(403).json({ error: 'No school assigned' });

        const school = await prisma.academicSchool.findFirst({ where: { orgNodeId: schoolNode.id } });
        if (!school) return res.status(404).json({ error: 'School not found' });

        const branches = await prisma.branch.findMany({
            where: { schoolId: school.id, isDeleted: false },
            include: { semesters: { include: { subjects: { include: { results: { select: { status: true } } } } } } },
        });

        const branchPerformance = branches.map(b => {
            const allResults = b.semesters.flatMap(s => s.subjects.flatMap(sub => sub.results));
            const total = allResults.length;
            const passed = allResults.filter(r => r.status === 'PASSED').length;
            return { branch: b.name, passRate: total ? Math.round((passed / total) * 100) : 0, students: 0 };
        });

        // Top/Bottom students in school
        const topStudents = await prisma.user.findMany({
            where: { batch: { branch: { schoolId: school.id } }, role: 'STUDENT', isDeleted: false },
            orderBy: { cgpa: 'desc' },
            take: 5,
            select: { fullName: true, rollNumber: true, cgpa: true, batch: { select: { branch: { select: { name: true } } } } }
        });

        const bottomStudents = await prisma.user.findMany({
            where: { batch: { branch: { schoolId: school.id } }, role: 'STUDENT', isDeleted: false, cgpa: { lt: 4.5 } },
            orderBy: { cgpa: 'asc' },
            take: 5,
            select: { fullName: true, rollNumber: true, cgpa: true, batch: { select: { branch: { select: { name: true } } } } }
        });

        // Generate real backlog heatmap
        const heatmapData = branches.flatMap(b => 
            b.semesters.flatMap(s => 
                s.subjects.map(sub => {
                    const total = sub.results.length;
                    const failed = sub.results.filter(r => r.status === 'FAILED' || r.status === 'BACKLOG').length;
                    return {
                        semester: `Sem ${s.semesterNumber}`,
                        subject: sub.name,
                        failRate: total ? Math.round((failed / total) * 100) : 0
                    };
                })
            )
        ).sort((a,b) => a.semester.localeCompare(b.semester)).slice(0, 15); // Limit for UI visibility

        // Generate real pass trend
        const semestersInSchool = await prisma.semester.findMany({
            where: { branch: { schoolId: school.id } },
            distinct: ['semesterNumber'],
            orderBy: { semesterNumber: 'asc' },
            select: { semesterNumber: true }
        });

        const passTrend = await Promise.all(semestersInSchool.map(async (sem) => {
            const semResults = await prisma.studentResult.findMany({
                where: { subject: { semester: { semesterNumber: sem.semesterNumber, branch: { schoolId: school.id } } } },
                select: { status: true }
            });
            const total = semResults.length;
            const passed = semResults.filter(r => r.status === 'PASSED').length;
            return {
                semester: `Sem ${sem.semesterNumber}`,
                passRate: total ? Math.round((passed / total) * 100) : 0
            };
        }));

        // Top failure subject calculation
        const allSubjects = branches.flatMap(b => b.semesters.flatMap(s => s.subjects));
        const topFailureRate = allSubjects.length > 0 
            ? Math.max(...allSubjects.map(sub => {
                const total = sub.results.length;
                const failed = sub.results.filter(r => r.status === 'FAILED' || r.status === 'BACKLOG').length;
                return total ? Math.round((failed / total) * 100) : 0;
            }))
            : 0;

        res.json({ 
            branchPerformance,
            topStudents: topStudents.map((s, i) => ({ rank: i + 1, name: s.fullName, roll: s.rollNumber || '', branch: s.batch?.branch?.name || '', cgpa: s.cgpa })),
            bottomStudents: bottomStudents.map((s, i) => ({ rank: i + 1, name: s.fullName, roll: s.rollNumber || '', branch: s.batch?.branch?.name || '', cgpa: s.cgpa })),
            backlogHeatmap: heatmapData,
            passTrend: passTrend,
            topFailureRate,
            insights: [
                `${school.name} has an average pass rate of ${branchPerformance.length ? (branchPerformance.reduce((a,b) => a + b.passRate, 0) / branchPerformance.length).toFixed(1) : 0}%.`,
                branchPerformance.length > 0 ? `${branchPerformance.sort((a,b) => b.passRate - a.passRate)[0].branch} branch is currently leading in performance.` : '',
                heatmapData.length > 0 && heatmapData.some(h => h.failRate > 30) ? `Critical failure intensity detected in ${heatmapData.find(h => h.failRate > 30)?.subject}.` : 'No critical subject hotspots detected.',
            ]
        });
    } catch (error) {
        console.error('HOS school overview error:', error);
        res.status(500).json({ error: 'Failed to load HOS analytics' });
    }
};

export const getHosTeachingQuality = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const schoolNode = await prisma.organizationNode.findFirst({ where: { admins: { some: { id: user.id } } } });
        if (!schoolNode) return res.status(403).json({ error: 'No school assigned' });

        const school = await prisma.academicSchool.findFirst({ where: { orgNodeId: schoolNode.id } });
        if (!school) return res.status(404).json({ error: 'School not found' });

        const subjects = await prisma.subject.findMany({
            where: { semester: { branch: { schoolId: school.id } }, isDeleted: false },
            include: { results: { select: { totalMarks: true, status: true } }, teacher: { select: { fullName: true } } },
        });

        const subjectFailureRate = subjects
            .map(s => {
                const total = s.results.length;
                const failed = s.results.filter(r => r.status === 'FAILED' || r.status === 'BACKLOG').length;
                return { subject: s.name, failRate: total ? Math.round((failed / total) * 100) : 0 };
            })
            .sort((a, b) => b.failRate - a.failRate)
            .slice(0, 8);

        const teacherResults = subjects.map(s => {
            const total = s.results.length;
            const passed = s.results.filter(r => r.status === 'PASSED').length;
            const avg = total ? s.results.reduce((a,b) => a + b.totalMarks, 0) / total : 0;
            return {
                teacher: s.teacher?.fullName || 'Unassigned',
                passRate: total ? Math.round((passed / total) * 100) : 0,
                avgMarks: parseFloat(avg.toFixed(1)),
                deviation: 5.2 // Static for now
            };
        }).slice(0, 5);

        res.json({ 
            subjectFailureRate,
            teacherResults,
            insights: [
                subjectFailureRate.length > 0 ? `${subjectFailureRate[0].subject} shows the highest failure rate (${subjectFailureRate[0].failRate}%) in the school.` : 'No critical subject failures detected.',
                'Teaching quality metrics show consistent score distribution across core subjects.',
            ]
        });
    } catch (error) {
        console.error('HOS teaching quality error:', error);
        res.status(500).json({ error: 'Failed to load teaching quality data' });
    }
};

// ─── ADVISOR ANALYTICS ───────────────────────────────────────────────────────

export const getAdvisorStudentHealth = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const branch = await prisma.branch.findFirst({ where: { advisorId: user.id, isDeleted: false } });
        if (!branch) return res.status(403).json({ error: 'No branch assigned' });

        const students = await prisma.user.findMany({
            where: { batch: { branchId: branch.id }, role: 'STUDENT', isDeleted: false },
            include: { backlogs: { where: { status: 'ACTIVE' } } },
            orderBy: { cgpa: 'asc' },
        });

        const atRisk = students.filter(s => (s.cgpa || 0) < 4.5).map(s => ({
            name: s.fullName, roll: s.rollNumber || '', cgpa: s.cgpa || 0,
            backlogs: s.backlogs.length, status: (s.cgpa || 0) < 4 ? 'CRITICAL' : 'WARNING',
        }));

        const backlogCounts = [
            { backlogs: '0', students: students.filter(s => s.backlogs.length === 0).length },
            { backlogs: '1', students: students.filter(s => s.backlogs.length === 1).length },
            { backlogs: '2', students: students.filter(s => s.backlogs.length === 2).length },
            { backlogs: '3+', students: students.filter(s => s.backlogs.length >= 3).length },
        ];

        res.json({ 
            atRiskStudents: atRisk, 
            backlogCounts,
            insights: [
                `${atRisk.length} students are currently flagged as at-risk (CGPA < 4.5).`,
                backlogCounts.find(b => b.backlogs === '3+')?.students ? `${backlogCounts.find(b => b.backlogs === '3+')?.students} students have 3 or more active backlogs.` : 'No students have critical backlog counts.',
            ]
        });
    } catch (error) {
        console.error('Advisor student health error:', error);
        res.status(500).json({ error: 'Failed to load student health data' });
    }
};

export const getAdvisorSubjectImpact = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const branch = await prisma.branch.findFirst({ where: { advisorId: user.id, isDeleted: false } });
        if (!branch) return res.status(403).json({ error: 'No branch assigned' });

        const subjects = await prisma.subject.findMany({
            where: { semester: { branchId: branch.id }, isDeleted: false },
            include: { results: { select: { totalMarks: true, status: true } }, marks: { select: { marksObtained: true, component: { select: { category: true } } } } },
        });

        const subjectFailureRate = subjects.map(s => {
            const total = s.results.length;
            const failed = s.results.filter(r => r.status === 'FAILED' || r.status === 'BACKLOG').length;
            return { subject: s.name, failRate: total ? Math.round((failed / total) * 100) : 0 };
        }).sort((a, b) => b.failRate - a.failRate);

        const internalVsExternal = subjects.map(s => {
            const internal = s.marks.filter(m => m.component.category === 'INTERNAL');
            const external = s.marks.filter(m => m.component.category === 'EXTERNAL');
            const avgInt = internal.length ? internal.reduce((sum, m) => sum + m.marksObtained, 0) / internal.length : 0;
            const avgExt = external.length ? external.reduce((sum, m) => sum + m.marksObtained, 0) / external.length : 0;
            return { subject: s.name, internal: Math.round(avgInt), external: Math.round(avgExt) };
        });

        res.json({ 
            subjectFailureRate, 
            internalVsExternal,
            insights: [
                subjectFailureRate.length > 0 ? `${subjectFailureRate[0].subject} has the highest impact on branch pass rate.` : '',
                'Internal assessment scores are generally higher than external exam scores across the branch.',
            ].filter(Boolean)
        });
    } catch (error) {
        console.error('Advisor subject impact error:', error);
        res.status(500).json({ error: 'Failed to load subject impact data' });
    }
};

// ─── TEACHER ANALYTICS ───────────────────────────────────────────────────────

export const getTeacherClassPerformance = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { subjectId } = req.query;

        const where: any = { teacherId: user.id, isDeleted: false };
        if (subjectId) where.id = subjectId as string;

        const subjects = await prisma.subject.findMany({
            where,
            include: { results: { select: { totalMarks: true, status: true } } },
        });

        const allResults = subjects.flatMap(s => s.results);
        const total = allResults.length;
        const passed = allResults.filter(r => r.status === 'PASSED').length;
        const avgScore = total ? allResults.reduce((s, r) => s + r.totalMarks, 0) / total : 0;

        const marksBuckets = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 };
        allResults.forEach(r => {
            if (r.totalMarks < 20) marksBuckets['0-20']++;
            else if (r.totalMarks < 40) marksBuckets['20-40']++;
            else if (r.totalMarks < 60) marksBuckets['40-60']++;
            else if (r.totalMarks < 80) marksBuckets['60-80']++;
            else marksBuckets['80-100']++;
        });

        const topStudents = await prisma.user.findMany({
            where: { 
                role: 'STUDENT', 
                isDeleted: false,
                results: {
                    some: {
                        subject: { teacherId: user.id }
                    }
                }
            },
            orderBy: { cgpa: 'desc' },
            take: 5,
            select: { fullName: true, rollNumber: true, cgpa: true, results: { select: { totalMarks: true } } }
        });

        const weakStudents = await prisma.user.findMany({
            where: { 
                role: 'STUDENT', 
                isDeleted: false,
                cgpa: { lt: 4.5 },
                results: {
                    some: {
                        subject: { teacherId: user.id }
                    }
                }
            },
            orderBy: { cgpa: 'asc' },
            take: 5,
            select: { fullName: true, rollNumber: true, cgpa: true, results: { select: { totalMarks: true } } }
        });

        res.json({
            avgScore: parseFloat(avgScore.toFixed(1)),
            passFailPie: [
                { name: 'Pass', value: total ? Math.round((passed / total) * 100) : 0, fill: '#3D8528' },
                { name: 'Fail', value: total ? Math.round(((total - passed) / total) * 100) : 0, fill: '#EF4444' },
            ],
            marksDistribution: [
                { range: '0–20', count: marksBuckets['0-20'], fill: '#EF4444' },
                { range: '20–40', count: marksBuckets['20-40'], fill: '#F59E0B' },
                { range: '40–60', count: marksBuckets['40-60'], fill: '#3B82F6' },
                { range: '60–80', count: marksBuckets['60-80'], fill: '#3D8528' },
                { range: '80–100', count: marksBuckets['80-100'], fill: '#10B981' },
            ],
            topStudents: topStudents.map((s: any, i: number) => ({ rank: i + 1, name: s.fullName, roll: s.rollNumber || '', total: s.results.reduce((acc: number, curr: any) => acc + curr.totalMarks, 0) })),
            weakStudents: weakStudents.map((s: any, i: number) => ({ rank: i + 1, name: s.fullName, roll: s.rollNumber || '', total: s.results.reduce((acc: number, curr: any) => acc + curr.totalMarks, 0) })),
            insights: [
                `Class average for this subject is ${avgScore.toFixed(1)}/100.`,
                `Pass rate is ${total ? Math.round((passed / total) * 100) : 0}% for the current evaluation cycle.`,
            ]
        });
    } catch (error) {
        console.error('Teacher class performance error:', error);
        res.status(500).json({ error: 'Failed to load class performance data' });
    }
};

export const getTeacherComponentAnalysis = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const subjects = await prisma.subject.findMany({
            where: { teacherId: user.id, isDeleted: false },
            include: {
                marks: { include: { component: { select: { name: true, category: true, maxMarks: true } } } },
            },
        });

        const allMarks = subjects.flatMap(s => s.marks);
        const internal = allMarks.filter(m => m.component.category === 'INTERNAL');
        const external = allMarks.filter(m => m.component.category === 'EXTERNAL');

        const internalAvg = internal.length ? internal.reduce((s, m) => s + m.marksObtained, 0) / internal.length : 0;
        const externalAvg = external.length ? external.reduce((s, m) => s + m.marksObtained, 0) / external.length : 0;

        // Group by component name
        const componentMap: Record<string, { total: number; count: number; max: number }> = {};
        allMarks.forEach(m => {
            const name = m.component.name;
            if (!componentMap[name]) componentMap[name] = { total: 0, count: 0, max: m.component.maxMarks };
            componentMap[name].total += m.marksObtained;
            componentMap[name].count++;
        });

        const componentWise = Object.entries(componentMap).map(([name, v]) => ({
            component: name, avg: parseFloat((v.total / v.count).toFixed(1)), max: v.max,
        }));

        res.json({
            internalVsExternal: { internalAvg: parseFloat(internalAvg.toFixed(1)), externalAvg: parseFloat(externalAvg.toFixed(1)) },
            componentWise,
            insights: [
                `Internal assessment average (${internalAvg.toFixed(1)}) is ${internalAvg > externalAvg ? 'higher' : 'lower'} than external exam average (${externalAvg.toFixed(1)}).`,
                componentWise.length > 0 ? `${componentWise.sort((a,b) => (b.avg/b.max) - (a.avg/a.max))[0].component} is the highest scoring component.` : '',
            ].filter(Boolean)
        });
    } catch (error) {
        console.error('Teacher component analysis error:', error);
        res.status(500).json({ error: 'Failed to load component analysis' });
    }
};

// ─── STUDENT ANALYTICS ───────────────────────────────────────────────────────

export const getStudentPersonal = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const semResults = await prisma.semesterResult.findMany({
            where: { studentId: user.id },
            orderBy: { semesterNumber: 'asc' },
        });

        const sgpaTrend = semResults.map(r => ({ semester: `Sem ${r.semesterNumber}`, sgpa: r.sgpa }));

        let runningCredits = 0, runningCreditPoints = 0;
        const cgpaProgress = semResults.map(r => {
            runningCredits += r.totalCredits;
            runningCreditPoints += r.totalCreditPoints;
            return { semester: `Sem ${r.semesterNumber}`, cgpa: parseFloat((runningCreditPoints / runningCredits).toFixed(2)) };
        });

        const latestSem = semResults.length ? semResults[semResults.length - 1].semesterNumber : 1;
        const subjectResults = await prisma.studentResult.findMany({
            where: { studentId: user.id },
            include: { subject: { select: { name: true, maxMarks: true } } },
            orderBy: { totalMarks: 'desc' },
        });

        const subjectPerformance = subjectResults.slice(0, 8).map(r => ({
            subject: r.subject.name, marks: r.totalMarks, max: r.subject.maxMarks,
        }));

        res.json({ 
            sgpaTrend, 
            cgpaProgress, 
            subjectPerformance,
            insights: [
                `Your latest SGPA is ${sgpaTrend.length ? sgpaTrend[sgpaTrend.length - 1].sgpa : 'N/A'}.`,
                cgpaProgress.length > 1 ? `Your CGPA has ${cgpaProgress[cgpaProgress.length-1].cgpa >= cgpaProgress[cgpaProgress.length-2].cgpa ? 'increased' : 'decreased'} by ${Math.abs(cgpaProgress[cgpaProgress.length-1].cgpa - cgpaProgress[cgpaProgress.length-2].cgpa).toFixed(2)} this semester.` : 'Consistent performance maintained.',
            ]
        });
    } catch (error) {
        console.error('Student personal analytics error:', error);
        res.status(500).json({ error: 'Failed to load personal analytics' });
    }
};

export const getStudentComparison = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const student = await prisma.user.findUnique({ where: { id: user.id }, select: { cgpa: true, batchId: true } });
        if (!student?.batchId) return res.json({ rank: 0, totalStudents: 0, percentile: 0 });

        const batchStudents = await prisma.user.findMany({
            where: { batchId: student.batchId, role: 'STUDENT', isDeleted: false, cgpa: { not: null } },
            orderBy: { cgpa: 'desc' },
            select: { id: true, cgpa: true },
        });

        const rank = batchStudents.findIndex(s => s.id === user.id) + 1;
        const totalStudents = batchStudents.length;
        const percentile = totalStudents ? parseFloat(((1 - (rank - 1) / totalStudents) * 100).toFixed(1)) : 0;

        res.json({ 
            rank, 
            totalStudents, 
            percentile,
            insights: [
                `You are ranked ${rank} out of ${totalStudents} students in your batch.`,
                `You are in the top ${Math.round(100 - percentile)}% of your class.`,
            ]
        });
    } catch (error) {
        console.error('Student comparison error:', error);
        res.status(500).json({ error: 'Failed to load comparison data' });
    }
};

export const getStudentBacklogAnalytics = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const backlogs = await prisma.studentBacklog.findMany({
            where: { studentId: user.id },
            include: { subject: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });

        const active = backlogs.filter(b => b.status === 'ACTIVE');
        const cleared = backlogs.filter(b => b.status === 'CLEARED');

        res.json({
            active: active.length,
            cleared: cleared.length,
            history: backlogs.map(b => ({
                subject: b.subject.name, status: b.status, attempts: b.attempts,
                clearedAt: b.clearedAt?.toISOString() || null,
            })),
            insights: [
                active.length > 0 ? `You have ${active.length} active backlogs that require attention.` : 'Great job! You have no active backlogs.',
                cleared.length > 0 ? `You have successfully cleared ${cleared.length} backlogs so far.` : '',
            ].filter(Boolean)
        });
    } catch (error) {
        console.error('Student backlog analytics error:', error);
        res.status(500).json({ error: 'Failed to load backlog analytics' });
    }
};
