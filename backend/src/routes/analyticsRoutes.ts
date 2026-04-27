import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
    getAnalyticsFilters,
    getAdminOverview, getAdminDeepInsights, getAdminSystemHealth,
    getHosSchoolOverview, getHosTeachingQuality,
    getAdvisorStudentHealth, getAdvisorSubjectImpact,
    getTeacherClassPerformance, getTeacherComponentAnalysis,
    getStudentPersonal, getStudentComparison, getStudentBacklogAnalytics,
} from '../controllers/analytics/analyticsController';

const router = Router();
router.use(protect);

// ─── FILTERS ─────────────────────────────────────────────────────────────────
router.get('/filters', getAnalyticsFilters);

// ─── ADMIN ───────────────────────────────────────────────────────────────────
router.get('/admin/overview', authorize('ADMIN'), getAdminOverview);
router.get('/admin/deep-insights', authorize('ADMIN'), getAdminDeepInsights);
router.get('/admin/system-health', authorize('ADMIN'), getAdminSystemHealth);

// ─── HEAD OF SCHOOL ──────────────────────────────────────────────────────────
router.get('/hos/school-overview', authorize('HEAD_OF_SCHOOL', 'ADMIN'), getHosSchoolOverview);
router.get('/hos/teaching-quality', authorize('HEAD_OF_SCHOOL', 'ADMIN'), getHosTeachingQuality);

// ─── ADVISOR ─────────────────────────────────────────────────────────────────
router.get('/advisor/student-health', authorize('ADVISOR', 'ADMIN'), getAdvisorStudentHealth);
router.get('/advisor/subject-impact', authorize('ADVISOR', 'ADMIN'), getAdvisorSubjectImpact);

// ─── TEACHER ─────────────────────────────────────────────────────────────────
router.get('/teacher/class-performance', authorize('TEACHER', 'ADMIN'), getTeacherClassPerformance);
router.get('/teacher/components', authorize('TEACHER', 'ADMIN'), getTeacherComponentAnalysis);

// ─── STUDENT ─────────────────────────────────────────────────────────────────
router.get('/student/personal', authorize('STUDENT'), getStudentPersonal);
router.get('/student/comparison', authorize('STUDENT'), getStudentComparison);
router.get('/student/backlogs', authorize('STUDENT'), getStudentBacklogAnalytics);

export default router;
