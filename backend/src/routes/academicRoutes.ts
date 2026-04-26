import { Router } from 'express';
import { 
    createVersion, 
    getVersions, 
    deleteVersion,
    syncVersion
} from '../controllers/academic/versionController';
import { 
    createProgram, 
    createSchool,
    createBranch, 
    createSemester, 
    createSubject,
    getSubjects
} from '../controllers/academic/programController';
import { getAcademicStructure } from '../controllers/academic/structureController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Blueprint Management
router.get('/versions', protect, getVersions);
router.post('/versions', protect, authorize('ADMIN'), createVersion);
router.post('/versions/:id/sync', protect, authorize('ADMIN'), syncVersion);
router.delete('/versions/:id', protect, authorize('ADMIN'), deleteVersion);

// Deep Structure Fetch
router.get('/structure', protect, getAcademicStructure);

// Programmatic DNA Creators
router.post('/programs', protect, authorize('ADMIN'), createProgram);
router.post('/branches', protect, authorize('ADMIN'), createBranch);
router.post('/semesters', protect, authorize('ADMIN'), createSemester);
router.post('/subjects', protect, authorize('ADMIN'), createSubject);
router.get('/subjects', protect, getSubjects);

export default router;
