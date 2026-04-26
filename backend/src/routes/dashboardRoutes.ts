import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware';

// HOS
import {
    getHosOverview, getHosBranchPerformance,
    getHosSubjectAnalysis, getHosAlerts, getHosBacklogHeatmap
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
