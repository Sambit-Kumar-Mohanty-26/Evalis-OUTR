// ─── ADMIN MOCK DATA ─────────────────────────────────────────────────────────

export const adminMockData = {
    passFailPie: [
        { name: "Pass", value: 78, fill: "#3D8528" },
        { name: "Fail", value: 22, fill: "#EF4444" },
    ],
    sgpaDistribution: [
        { range: "0–4", count: 42, fill: "#EF4444" },
        { range: "4–6", count: 128, fill: "#F59E0B" },
        { range: "6–8", count: 385, fill: "#3B82F6" },
        { range: "8–10", count: 245, fill: "#3D8528" },
    ],
    cgpaTrend: [
        { semester: "Sem 1", cgpa: 7.2 },
        { semester: "Sem 2", cgpa: 7.5 },
        { semester: "Sem 3", cgpa: 7.1 },
        { semester: "Sem 4", cgpa: 7.8 },
        { semester: "Sem 5", cgpa: 8.0 },
        { semester: "Sem 6", cgpa: 8.2 },
        { semester: "Sem 7", cgpa: 7.9 },
        { semester: "Sem 8", cgpa: 8.4 },
    ],
    branchComparison: [
        { branch: "CSE", passRate: 85, color: "#3D8528" },
        { branch: "IT", passRate: 78, color: "#3B82F6" },
        { branch: "ME", passRate: 72, color: "#8B5CF6" },
        { branch: "EE", passRate: 69, color: "#F59E0B" },
        { branch: "CE", passRate: 74, color: "#EC4899" },
    ],
    subjectDifficulty: [
        { subject: "Mathematics-III", failRate: 42, semester: 3 },
        { subject: "Data Structures", failRate: 35, semester: 3 },
        { subject: "Thermodynamics", failRate: 38, semester: 4 },
        { subject: "Digital Electronics", failRate: 28, semester: 4 },
        { subject: "Database Systems", failRate: 22, semester: 5 },
        { subject: "Signals & Systems", failRate: 31, semester: 5 },
        { subject: "Operating Systems", failRate: 18, semester: 5 },
        { subject: "Machine Learning", failRate: 25, semester: 6 },
    ],
    backlogDistribution: [
        { semester: "Sem 1", zero: 180, one: 40, twoPlus: 15 },
        { semester: "Sem 2", zero: 165, one: 52, twoPlus: 18 },
        { semester: "Sem 3", zero: 140, one: 65, twoPlus: 30 },
        { semester: "Sem 4", zero: 155, one: 55, twoPlus: 25 },
        { semester: "Sem 5", zero: 170, one: 42, twoPlus: 12 },
        { semester: "Sem 6", zero: 175, one: 38, twoPlus: 10 },
    ],
    topPerformers: [
        { rank: 1, name: "Aditya Sharma", roll: "CSE2023001", branch: "CSE", cgpa: 9.82 },
        { rank: 2, name: "Priya Patel", roll: "IT2023015", branch: "IT", cgpa: 9.71 },
        { rank: 3, name: "Rahul Kumar", roll: "CSE2023008", branch: "CSE", cgpa: 9.65 },
        { rank: 4, name: "Sneha Reddy", roll: "EE2023003", branch: "EE", cgpa: 9.58 },
        { rank: 5, name: "Vikram Singh", roll: "ME2023012", branch: "ME", cgpa: 9.52 },
    ],
    worstSegments: [
        { segment: "ME — Sem 3", passRate: 58, students: 45, issue: "Thermodynamics: 42% failure" },
        { segment: "EE — Sem 4", passRate: 62, students: 38, issue: "Signals & Systems: 38% failure" },
        { segment: "CE — Sem 5", passRate: 65, students: 32, issue: "Fluid Mechanics: 35% failure" },
    ],
    marksEntry: [
        { name: "Submitted", value: 80, fill: "#3D8528" },
        { name: "Pending", value: 20, fill: "#F59E0B" },
    ],
    resultPublishing: [
        { exam: "Mid Sem Oct 2024", status: "Published", date: "2024-11-15" },
        { exam: "End Sem Dec 2024", status: "Processing", date: "—" },
        { exam: "Back Paper Feb 2025", status: "Pending", date: "—" },
    ],
    teacherActivity: [
        { teacher: "Dr. Smith", marksEntered: 100 },
        { teacher: "Prof. Johnson", marksEntered: 85 },
        { teacher: "Dr. Lee", marksEntered: 40 },
        { teacher: "Prof. Singh", marksEntered: 65 },
        { teacher: "Dr. Das", marksEntered: 45 },
    ],
    insights: [
        "Mathematics-III has the highest failure rate at 42% — concentrated in Semester 3",
        "CSE branch leads with 85% pass rate — 7% above institutional average",
        "12 students flagged as at-risk with CGPA below 4.5",
        "Marks entry is 80% complete — 20% pending from 3 faculty members",
        "Overall CGPA trend shows consistent improvement over the last 4 semesters",
    ],
};

// ─── HOS MOCK DATA ───────────────────────────────────────────────────────────

export const hosMockData = {
    branchPerformance: [
        { branch: "CSE", passRate: 85, avgCGPA: 8.2, students: 240 },
        { branch: "IT", passRate: 78, avgCGPA: 7.8, students: 180 },
        { branch: "ME", passRate: 72, avgCGPA: 7.4, students: 160 },
    ],
    passTrend: [
        { semester: "Sem 1", passRate: 82 },
        { semester: "Sem 2", passRate: 79 },
        { semester: "Sem 3", passRate: 74 },
        { semester: "Sem 4", passRate: 78 },
        { semester: "Sem 5", passRate: 81 },
        { semester: "Sem 6", passRate: 85 },
    ],
    backlogHeatmap: [
        { semester: "Sem 1", subject: "Mathematics I", failRate: 15 },
        { semester: "Sem 1", subject: "Physics", failRate: 8 },
        { semester: "Sem 2", subject: "Mathematics II", failRate: 22 },
        { semester: "Sem 2", subject: "Chemistry", failRate: 12 },
        { semester: "Sem 3", subject: "Mathematics III", failRate: 42 },
        { semester: "Sem 3", subject: "Data Structures", failRate: 35 },
        { semester: "Sem 4", subject: "Digital Electronics", failRate: 28 },
        { semester: "Sem 4", subject: "Thermodynamics", failRate: 38 },
        { semester: "Sem 5", subject: "Database Systems", failRate: 22 },
        { semester: "Sem 5", subject: "Operating Systems", failRate: 18 },
        { semester: "Sem 6", subject: "Machine Learning", failRate: 25 },
        { semester: "Sem 6", subject: "Networks", failRate: 14 },
    ],
    teacherResults: [
        { teacher: "Dr. Mishra", avgMarks: 72, deviation: 12, passRate: 88 },
        { teacher: "Prof. Gupta", avgMarks: 65, deviation: 18, passRate: 75 },
        { teacher: "Dr. Nair", avgMarks: 58, deviation: 22, passRate: 68 },
        { teacher: "Prof. Singh", avgMarks: 70, deviation: 14, passRate: 82 },
    ],
    subjectFailureRate: [
        { subject: "Mathematics III", failRate: 42 },
        { subject: "Thermodynamics", failRate: 38 },
        { subject: "Data Structures", failRate: 35 },
        { subject: "Signals & Systems", failRate: 31 },
        { subject: "Digital Electronics", failRate: 28 },
    ],
    topStudents: [
        { name: "Aditya Sharma", roll: "CSE2023001", cgpa: 9.82, branch: "CSE" },
        { name: "Sneha Reddy", roll: "CSE2023003", cgpa: 9.65, branch: "CSE" },
        { name: "Priya Patel", roll: "IT2023015", cgpa: 9.71, branch: "IT" },
    ],
    bottomStudents: [
        { name: "Raj Kumar", roll: "ME2023042", cgpa: 3.8, branch: "ME" },
        { name: "Amit Singh", roll: "ME2023038", cgpa: 4.1, branch: "ME" },
        { name: "Sita Devi", roll: "IT2023029", cgpa: 4.3, branch: "IT" },
    ],
    atRiskCount: 18,
    insights: [
        "Mathematics III has 42% failure — highest in School of Engineering",
        "CSE branch leads with 85% pass rate across all semesters",
        "Dr. Nair's subjects show highest deviation (22) — may need curriculum review",
        "18 students currently flagged as at-risk (CGPA < 4.5)",
    ],
};

// ─── ADVISOR MOCK DATA ───────────────────────────────────────────────────────

export const advisorMockData = {
    atRiskStudents: [
        { name: "Raj Kumar", roll: "CSE2023042", cgpa: 3.8, backlogs: 4, status: "CRITICAL" },
        { name: "Amit Singh", roll: "CSE2023038", cgpa: 4.1, backlogs: 3, status: "WARNING" },
        { name: "Deepak Jha", roll: "CSE2023025", cgpa: 4.4, backlogs: 2, status: "WARNING" },
    ],
    backlogCounts: [
        { backlogs: "0", students: 150 },
        { backlogs: "1", students: 45 },
        { backlogs: "2", students: 22 },
        { backlogs: "3+", students: 12 },
    ],
    promotionStatus: [
        { status: "Promoted", count: 180, fill: "#3D8528" },
        { status: "Promoted w/ Backlog", count: 35, fill: "#F59E0B" },
        { status: "Year Back", count: 8, fill: "#EF4444" },
    ],
    subjectFailureRate: [
        { subject: "Mathematics III", failRate: 42 },
        { subject: "Data Structures", failRate: 35 },
        { subject: "Digital Electronics", failRate: 28 },
        { subject: "Physics Lab", failRate: 15 },
        { subject: "English", failRate: 8 },
    ],
    internalVsExternal: [
        { subject: "Mathematics III", internal: 32, external: 18 },
        { subject: "Data Structures", internal: 35, external: 22 },
        { subject: "Digital Electronics", internal: 30, external: 25 },
        { subject: "Physics Lab", internal: 38, external: 42 },
        { subject: "English", internal: 36, external: 40 },
    ],
    sgpaTrends: [
        {
            student: "Raj Kumar",
            semesters: [
                { sem: "Sem 1", sgpa: 6.2 },
                { sem: "Sem 2", sgpa: 5.8 },
                { sem: "Sem 3", sgpa: 4.5 },
                { sem: "Sem 4", sgpa: 3.8 },
            ],
        },
        {
            student: "Aditya Sharma",
            semesters: [
                { sem: "Sem 1", sgpa: 9.4 },
                { sem: "Sem 2", sgpa: 9.6 },
                { sem: "Sem 3", sgpa: 9.8 },
                { sem: "Sem 4", sgpa: 9.9 },
            ],
        },
    ],
    insights: [
        "3 students flagged as at-risk with declining SGPA trend",
        "Internal vs External gap widest in Mathematics III — potential teaching issue",
        "8 students received year-back status this cycle",
        "Raj Kumar shows consistent SGPA decline — intervention recommended",
    ],
};

// ─── TEACHER MOCK DATA ───────────────────────────────────────────────────────

export const teacherMockData = {
    avgScore: 67.5,
    passFailPie: [
        { name: "Pass", value: 82, fill: "#3D8528" },
        { name: "Fail", value: 18, fill: "#EF4444" },
    ],
    marksDistribution: [
        { range: "0–20", count: 5, fill: "#EF4444" },
        { range: "20–40", count: 12, fill: "#F59E0B" },
        { range: "40–60", count: 35, fill: "#3B82F6" },
        { range: "60–80", count: 42, fill: "#3D8528" },
        { range: "80–100", count: 18, fill: "#10B981" },
    ],
    internalVsExternal: {
        internalAvg: 35,
        externalAvg: 20,
        internalMax: 40,
        externalMax: 60,
    },
    componentWise: [
        { component: "Attendance", avg: 8.5, max: 10 },
        { component: "Assignment", avg: 7.2, max: 10 },
        { component: "Mid Sem", avg: 14.5, max: 20 },
        { component: "End Sem", avg: 32.8, max: 60 },
    ],
    topStudents: [
        { rank: 1, name: "Aditya Sharma", roll: "CSE2023001", total: 94 },
        { rank: 2, name: "Priya Patel", roll: "CSE2023015", total: 91 },
        { rank: 3, name: "Rahul Kumar", roll: "CSE2023008", total: 88 },
    ],
    weakStudents: [
        { name: "Raj Kumar", roll: "CSE2023042", total: 28, status: "FAIL" },
        { name: "Amit Singh", roll: "CSE2023038", total: 32, status: "FAIL" },
        { name: "Deepak Jha", roll: "CSE2023025", total: 34, status: "AT-RISK" },
    ],
    insights: [
        "External exam average is 20/60 — significantly below expected range",
        "82% pass rate — 4% below department average",
        "Top 3 students scored above 88% — consistent high achievers",
        "Assignment completion rate at 72% — consider follow-up enforcement",
    ],
};

// ─── STUDENT MOCK DATA ───────────────────────────────────────────────────────

export const studentMockData = {
    sgpaTrend: [
        { semester: "Sem 1", sgpa: 8.2 },
        { semester: "Sem 2", sgpa: 7.8 },
        { semester: "Sem 3", sgpa: 8.5 },
        { semester: "Sem 4", sgpa: 8.9 },
        { semester: "Sem 5", sgpa: 9.1 },
    ],
    cgpaProgress: [
        { semester: "Sem 1", cgpa: 8.2 },
        { semester: "Sem 2", cgpa: 8.0 },
        { semester: "Sem 3", cgpa: 8.17 },
        { semester: "Sem 4", cgpa: 8.35 },
        { semester: "Sem 5", cgpa: 8.5 },
    ],
    subjectPerformance: [
        { subject: "Data Structures", marks: 88, max: 100 },
        { subject: "Mathematics III", marks: 72, max: 100 },
        { subject: "Digital Electronics", marks: 78, max: 100 },
        { subject: "English", marks: 92, max: 100 },
        { subject: "Physics Lab", marks: 85, max: 100 },
    ],
    rank: 12,
    totalStudents: 180,
    percentile: 93.3,
    classAvgComparison: [
        { subject: "Data Structures", myMarks: 88, classAvg: 65 },
        { subject: "Mathematics III", myMarks: 72, classAvg: 58 },
        { subject: "Digital Electronics", myMarks: 78, classAvg: 62 },
        { subject: "English", myMarks: 92, classAvg: 75 },
        { subject: "Physics Lab", myMarks: 85, classAvg: 70 },
    ],
    backlogs: {
        active: 0,
        cleared: 1,
        history: [
            { subject: "Mathematics II", status: "CLEARED", attempts: 2, clearedAt: "2024-08-15" },
        ],
    },
    insights: [
        "Your SGPA trend shows consistent improvement — up 0.9 over 5 semesters",
        "You rank 12th out of 180 students (93.3 percentile)",
        "Your scores are above class average in all 5 subjects",
        "1 backlog cleared successfully in Mathematics II",
    ],
};
