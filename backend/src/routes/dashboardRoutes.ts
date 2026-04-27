import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware';

// HOS
import {
    getHosOverview, getHosBranchPerformance,
    getHosSubjectAnalysis, getHosAlerts, getHosBacklogHeatmap,
    getHosBranchStudents, getHosStudentDetails,
    getSchoolTeachers, assignBranchAdvisor, revokeBranchAdvisor
} from '../controllers/dashboard/hosDashboardController';


// Advisor
import {
    getAdvisorOverview, getAdvisorStudents,
    getAdvisorStudentProfile, getAdvisorAtRisk,
    getAdvisorSubjectPerformance
} from '../controllers/dashboard/advisorDashboardController';

// Teacher
import {
    getTeacherSubjects, getTeacherSubjectStudents,
    getTeacherSubjectStats, getTeacherSubmissionStatus, getTeacherOverview
} from '../controllers/dashboard/teacherDashboardController';

// Student
import {
    getStudentOverview, getStudentMarks,
    getStudentBacklogs, getStudentHistory
} from '../controllers/dashboard/studentDashboardController';

const router = Router();
router.use(protect);

// ─── HEAD OF SCHOOL ──────────────────────────────────────────────────────────
router.get('/hos/overview', authorize('HEAD_OF_SCHOOL', 'ADMIN'), getHosOverview);
router.get('/hos/branches', authorize('HEAD_OF_SCHOOL', 'ADMIN'), getHosBranchPerformance);
router.get('/hos/subjects', authorize('HEAD_OF_SCHOOL', 'ADMIN'), getHosSubjectAnalysis);
router.get('/hos/alerts', authorize('HEAD_OF_SCHOOL', 'ADMIN'), getHosAlerts);
router.get('/hos/backlog-heatmap', authorize('HEAD_OF_SCHOOL', 'ADMIN'), getHosBacklogHeatmap);
router.get('/hos/branches/:branchId/students', authorize('HEAD_OF_SCHOOL', 'ADMIN'), getHosBranchStudents);
router.get('/hos/students/:studentId', authorize('HEAD_OF_SCHOOL', 'ADMIN'), getHosStudentDetails);
router.get('/hos/teachers', authorize('HEAD_OF_SCHOOL', 'ADMIN'), getSchoolTeachers);
router.post('/hos/assign-advisor', authorize('HEAD_OF_SCHOOL', 'ADMIN'), assignBranchAdvisor);
router.post('/hos/branches/:branchId/revoke-advisor', authorize('HEAD_OF_SCHOOL', 'ADMIN'), revokeBranchAdvisor);


// ─── ADVISOR ─────────────────────────────────────────────────────────────────
router.get('/advisor/overview', authorize('ADVISOR', 'ADMIN'), getAdvisorOverview);
router.get('/advisor/students', authorize('ADVISOR', 'ADMIN'), getAdvisorStudents);
router.get('/advisor/students/:id', authorize('ADVISOR', 'ADMIN'), getAdvisorStudentProfile);
router.get('/advisor/at-risk', authorize('ADVISOR', 'ADMIN'), getAdvisorAtRisk);
router.get('/advisor/subjects', authorize('ADVISOR', 'ADMIN'), getAdvisorSubjectPerformance);

// ─── TEACHER ─────────────────────────────────────────────────────────────────
router.get('/teacher/overview', authorize('TEACHER', 'ADMIN'), getTeacherOverview);
router.get('/teacher/subjects', authorize('TEACHER', 'ADVISOR', 'HEAD_OF_SCHOOL', 'ADMIN'), getTeacherSubjects);
router.get('/teacher/subjects/:id/students', authorize('TEACHER', 'ADVISOR', 'HEAD_OF_SCHOOL', 'ADMIN'), getTeacherSubjectStudents);
router.get('/teacher/subjects/:id/stats', authorize('TEACHER', 'ADVISOR', 'HEAD_OF_SCHOOL', 'ADMIN'), getTeacherSubjectStats);
router.get('/teacher/submission-status', authorize('TEACHER', 'ADMIN'), getTeacherSubmissionStatus);

// ─── STUDENT ─────────────────────────────────────────────────────────────────
router.get('/student/overview', authorize('STUDENT'), getStudentOverview);
router.get('/student/marks', authorize('STUDENT'), getStudentMarks);
router.get('/student/backlogs', authorize('STUDENT'), getStudentBacklogs);
router.get('/student/history', authorize('STUDENT'), getStudentHistory);

export default router;
