import { Router } from 'express';
import multer from 'multer';
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
    deleteExamInstance,
} from '../controllers/exam/examInstanceController';
import {
    enterMarks,
    getMarks,
    calculateResults,
    getStudentResults,
    getExamInstanceResults,
    uploadMarksCSV,
} from '../controllers/exam/marksController';
import {
    getBacklogs,
    createBackPaperExam,
    enterBackPaperMarks,
    clearBacklog,
} from '../controllers/exam/backlogController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

// ─── EXAM SCHEMAS (Admin only) ───────────────────────────────────────────────
router.get('/schemas', getExamSchemas);
router.post('/schemas', authorize('ADMIN'), createExamSchema);
router.put('/schemas/:id', authorize('ADMIN'), updateExamSchema);
router.delete('/schemas/:id', authorize('ADMIN'), deleteExamSchema);
router.post('/schemas/:id/map', authorize('ADMIN'), mapSchemaToSubjects);

// ─── EXAM INSTANCES ──────────────────────────────────────────────────────────
router.get('/instances', getExamInstances);
router.post('/instances', authorize('ADMIN', 'HEAD_OF_SCHOOL'), createExamInstance);
router.put('/instances/:id/status', authorize('ADMIN', 'HEAD_OF_SCHOOL'), updateExamStatus);
router.post('/instances/:id/publish', authorize('ADMIN', 'HEAD_OF_SCHOOL'), publishResults);
router.delete('/instances/:id', authorize('ADMIN', 'HEAD_OF_SCHOOL'), deleteExamInstance);

// ─── MARKS ENTRY (Teacher + Advisor + HOS + Admin) ──────────────────────────
router.post('/marks', authorize('TEACHER', 'ADVISOR', 'HEAD_OF_SCHOOL', 'ADMIN'), enterMarks);
router.get('/marks/:subjectId', getMarks);
router.post('/marks/upload', upload.single('file'), authorize('TEACHER', 'ADVISOR', 'HEAD_OF_SCHOOL', 'ADMIN'), uploadMarksCSV);

// ─── RESULTS ─────────────────────────────────────────────────────────────────
router.post('/results/calculate', protect, authorize('ADMIN', 'HEAD_OF_SCHOOL'), calculateResults);
router.get('/instances/:id/results', protect, getExamInstanceResults);
router.get('/student/:studentId', protect, getStudentResults);


// ─── BACKLOGS ────────────────────────────────────────────────────────────────
router.get('/backlogs', getBacklogs);
router.post('/back-paper', authorize('ADMIN'), createBackPaperExam);
router.post('/back-paper/:id/marks', enterBackPaperMarks);
router.post('/back-paper/:id/clear', authorize('ADMIN'), clearBacklog);

export default router;
