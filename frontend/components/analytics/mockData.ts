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

// ─── STUDENT INTERNAL ANALYTICS MOCK DATA ────────────────────────────────────

export const studentInternalMockData = {
    internalScore: 76.4,
    classAvg: 62.1,
    rank: 12,
    totalStudents: 180,
    attendance: 87.5,
    status: "Good",

    subjectInternalPerformance: [
        { subject: "Data Structures", internal: 82, classAvg: 65, max: 100 },
        { subject: "Maths III", internal: 68, classAvg: 58, max: 100 },
        { subject: "Dig Electronics", internal: 74, classAvg: 62, max: 100 },
        { subject: "English", internal: 91, classAvg: 75, max: 100 },
        { subject: "Physics Lab", internal: 79, classAvg: 70, max: 100 },
        { subject: "OS Concepts", internal: 71, classAvg: 61, max: 100 },
    ],

    componentBreakdown: [
        { subject: "Data Str", quiz: 18, assignment: 9, mid: 46, attendance: 9 },
        { subject: "Maths III", quiz: 12, assignment: 7, mid: 40, attendance: 9 },
        { subject: "Dig Elec", quiz: 15, assignment: 8, mid: 42, attendance: 9 },
        { subject: "English", quiz: 19, assignment: 9, mid: 54, attendance: 9 },
        { subject: "Phy Lab", quiz: 16, assignment: 8, mid: 46, attendance: 9 },
        { subject: "OS", quiz: 14, assignment: 7, mid: 41, attendance: 9 },
    ],

    coAttainment: [
        { co: "CO1", attainment: 82, classAvg: 68 },
        { co: "CO2", attainment: 68, classAvg: 60 },
        { co: "CO3", attainment: 74, classAvg: 64 },
        { co: "CO4", attainment: 90, classAvg: 72 },
        { co: "CO5", attainment: 71, classAvg: 62 },
    ],

    coContribution: [
        { co: "CO1", quiz: 28, assignment: 22, mid: 32 },
        { co: "CO2", quiz: 22, assignment: 18, mid: 28 },
        { co: "CO3", quiz: 25, assignment: 20, mid: 29 },
        { co: "CO4", quiz: 32, assignment: 28, mid: 30 },
        { co: "CO5", quiz: 24, assignment: 19, mid: 28 },
    ],

    classComparison: [
        { category: "You", value: 76.4, fill: "#3D8528" },
        { category: "Class Avg", value: 62.1, fill: "#3B82F6" },
        { category: "Topper", value: 94.2, fill: "#8B5CF6" },
    ],

    subjectRanks: [
        { subject: "Data Structures", rank: 8, total: 180, score: 82 },
        { subject: "Mathematics III", rank: 22, total: 180, score: 68 },
        { subject: "Digital Electronics", rank: 15, total: 180, score: 74 },
        { subject: "English", rank: 4, total: 180, score: 91 },
        { subject: "Physics Lab", rank: 11, total: 180, score: 79 },
        { subject: "OS Concepts", rank: 18, total: 180, score: 71 },
    ],

    internalTrend: [
        { event: "Quiz 1", score: 72, classAvg: 58 },
        { event: "Quiz 2", score: 78, classAvg: 62 },
        { event: "Mid Sem", score: 76, classAvg: 61 },
    ],

    attendanceData: [
        { subject: "Data Structures", attendance: 92, marks: 82 },
        { subject: "Mathematics III", attendance: 78, marks: 68 },
        { subject: "Digital Electronics", attendance: 85, marks: 74 },
        { subject: "English", attendance: 96, marks: 91 },
        { subject: "Physics Lab", attendance: 88, marks: 79 },
        { subject: "OS Concepts", attendance: 82, marks: 71 },
    ],

    performanceDistribution: [
        { range: "0–40", count: 8, fill: "#EF4444" },
        { range: "40–50", count: 15, fill: "#F59E0B" },
        { range: "50–60", count: 32, fill: "#3B82F6" },
        { range: "60–70", count: 48, fill: "#8B5CF6" },
        { range: "70–80", count: 42, fill: "#3D8528" },
        { range: "80–90", count: 25, fill: "#10B981" },
        { range: "90+", count: 10, fill: "#06B6D4" },
    ],

    insights: [
        "English is your strongest subject — 91% internal, 16% above class average",
        "Mathematics III is below class average — CO2 attainment at 68% needs focus",
        "Your attendance (87.5%) correlates positively with your performance",
        "CO4 attainment is excellent at 90% — strongest across all outcomes",
        "Internal trend shows improvement from Quiz 1 (72%) to Quiz 2 (78%)",
    ],

    predictedGrade: "A",
    predictedSGPA: 8.6,
};

// ─── STUDENT OVERALL ANALYTICS MOCK DATA ─────────────────────────────────────

export const studentOverallMockData = {
    sgpa: 9.1,
    cgpa: 8.5,
    rank: 12,
    totalStudents: 180,
    passStatus: "PASS",
    backlogs: { active: 0, cleared: 1 },

    sgpaTrend: [
        { semester: "Sem 1", sgpa: 8.2, classAvg: 7.1 },
        { semester: "Sem 2", sgpa: 7.8, classAvg: 6.9 },
        { semester: "Sem 3", sgpa: 8.5, classAvg: 7.2 },
        { semester: "Sem 4", sgpa: 8.9, classAvg: 7.4 },
        { semester: "Sem 5", sgpa: 9.1, classAvg: 7.6 },
    ],

    subjectPerformance: [
        { subject: "Data Str", marks: 88, maxMarks: 100, grade: "O" },
        { subject: "Maths III", marks: 72, maxMarks: 100, grade: "B" },
        { subject: "Dig Elec", marks: 78, maxMarks: 100, grade: "A" },
        { subject: "English", marks: 92, maxMarks: 100, grade: "O" },
        { subject: "Phy Lab", marks: 85, maxMarks: 100, grade: "A" },
        { subject: "OS Concepts", marks: 75, maxMarks: 100, grade: "A" },
    ],

    internalVsExternal: [
        { subject: "Data Str", internal: 42, external: 46 },
        { subject: "Maths III", internal: 36, external: 36 },
        { subject: "Dig Elec", internal: 38, external: 40 },
        { subject: "English", internal: 46, external: 46 },
        { subject: "Phy Lab", internal: 42, external: 43 },
        { subject: "OS", internal: 37, external: 38 },
    ],

    coFinalAttainment: [
        { co: "CO1", student: 85, classAvg: 70 },
        { co: "CO2", student: 72, classAvg: 65 },
        { co: "CO3", student: 78, classAvg: 68 },
        { co: "CO4", student: 91, classAvg: 72 },
        { co: "CO5", student: 74, classAvg: 66 },
    ],

    gradeDistribution: [
        { grade: "O (≥90%)", count: 2, fill: "#10B981" },
        { grade: "A+ (85%)", count: 1, fill: "#3D8528" },
        { grade: "A (75%)", count: 2, fill: "#3B82F6" },
        { grade: "B+ (65%)", count: 1, fill: "#8B5CF6" },
        { grade: "B (55%)", count: 0, fill: "#F59E0B" },
        { grade: "F (<50%)", count: 0, fill: "#EF4444" },
    ],

    backlogHistory: [
        { subject: "Mathematics II", status: "CLEARED", attempts: 2, clearedAt: "2024-08-15", semester: "Sem 2" },
    ],

    percentile: 93.3,

    yearWiseCGPA: [
        { year: "Year 1", cgpa: 8.0, avgCGPA: 7.0 },
        { year: "Year 2", cgpa: 8.17, avgCGPA: 7.15 },
        { year: "Year 3", cgpa: 8.5, avgCGPA: 7.35 },
    ],

    peerComparison: [
        { semester: "Sem 1", you: 8.2, classAvg: 7.1, topper: 9.4 },
        { semester: "Sem 2", you: 7.8, classAvg: 6.9, topper: 9.6 },
        { semester: "Sem 3", you: 8.5, classAvg: 7.2, topper: 9.8 },
        { semester: "Sem 4", you: 8.9, classAvg: 7.4, topper: 9.9 },
        { semester: "Sem 5", you: 9.1, classAvg: 7.6, topper: 10.0 },
    ],

    performanceHeatmap: [
        { subject: "Mathematics", sem1: 79, sem2: 72, sem3: 72, sem4: null, sem5: null },
        { subject: "Data Structures", sem1: null, sem2: null, sem3: 88, sem4: null, sem5: null },
        { subject: "Digital Elec", sem1: null, sem2: null, sem3: 78, sem4: null, sem5: null },
        { subject: "English", sem1: 90, sem2: 92, sem3: null, sem4: null, sem5: null },
        { subject: "Physics", sem1: 85, sem2: 82, sem3: null, sem4: null, sem5: null },
        { subject: "OS Concepts", sem1: null, sem2: null, sem3: null, sem4: 75, sem5: null },
    ],

    riskIndex: 12,
    riskLevel: "Low",

    insights: [
        "SGPA trend shows consistent improvement — up 0.9 over 5 semesters",
        "CO4 has the highest final attainment at 91% — 19% above class average",
        "Internal performance is stronger than external — keep the external prep up",
        "You rank 12th out of 180 students — top 7% percentile of your class",
        "1 backlog cleared successfully — currently zero active backlogs",
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
