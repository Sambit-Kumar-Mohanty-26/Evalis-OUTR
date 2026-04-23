import { Router } from 'express';
import {
    getExamSchemas,
    createExamSchema,
    updateExamSchema,
    deleteExamSchema,
    mapSchemaToSubjects,
} from '../controllers/exam/examSchemaController';
import {
    getExamInstances,
    createExamInstance,
    updateExamStatus,
    publishResults,
} from '../controllers/exam/examInstanceController';
import {
    enterMarks,
    getMarks,
    calculateResults,
    getStudentResults,
} from '../controllers/exam/marksController';
import {
    getBacklogs,
    createBackPaperExam,
    enterBackPaperMarks,
    clearBacklog,
} from '../controllers/exam/backlogController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

// ─── EXAM SCHEMAS (Admin only) ───────────────────────────────────────────────
router.get('/schemas', getExamSchemas);
router.post('/schemas', authorize('ADMIN'), createExamSchema);
router.put('/schemas/:id', authorize('ADMIN'), updateExamSchema);
router.delete('/schemas/:id', authorize('ADMIN'), deleteExamSchema);
router.post('/schemas/:id/map', authorize('ADMIN'), mapSchemaToSubjects);

// ─── EXAM INSTANCES ──────────────────────────────────────────────────────────
router.get('/instances', getExamInstances);
router.post('/instances', authorize('ADMIN'), createExamInstance);
router.put('/instances/:id/status', authorize('ADMIN'), updateExamStatus);
router.post('/instances/:id/publish', authorize('ADMIN'), publishResults);

// ─── MARKS ENTRY (Teacher + Admin) ───────────────────────────────────────────
router.post('/marks', enterMarks);
router.get('/marks/:subjectId', getMarks);

// ─── RESULTS ─────────────────────────────────────────────────────────────────
router.post('/results/calculate', authorize('ADMIN'), calculateResults);
router.get('/results/:studentId', getStudentResults);

// ─── BACKLOGS ────────────────────────────────────────────────────────────────
router.get('/backlogs', getBacklogs);
router.post('/back-paper', authorize('ADMIN'), createBackPaperExam);
router.post('/back-paper/:id/marks', enterBackPaperMarks);
router.post('/back-paper/:id/clear', authorize('ADMIN'), clearBacklog);

export default router;
