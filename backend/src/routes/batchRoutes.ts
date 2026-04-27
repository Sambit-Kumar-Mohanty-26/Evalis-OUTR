import { Router } from 'express';
import {
    getBatches,
    getBatchById,
    createBatch,
    updateBatch,
    updateTimeline,
    toggleBatchLock,
    getPromotionLogs,
    updateCohortTimeline,
} from '../controllers/batch/batchController';
import { promoteBatchSemester } from '../services/promotionService';
import { protect, authorize } from '../middleware/authMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';
import { Response } from 'express';

const router = Router();

router.use(protect);
// Core CRUD
router.get('/', authorize('ADMIN', 'HEAD_OF_SCHOOL', 'ADVISOR', 'TEACHER'), getBatches);
router.get('/:id', authorize('ADMIN', 'HEAD_OF_SCHOOL', 'ADVISOR', 'TEACHER'), getBatchById);
router.post('/', authorize('ADMIN', 'HEAD_OF_SCHOOL'), createBatch);
router.put('/:id', authorize('ADMIN', 'HEAD_OF_SCHOOL'), updateBatch);

// Timeline
router.put('/:id/timeline', authorize('ADMIN', 'HEAD_OF_SCHOOL'), updateTimeline);
router.post('/cohort-timeline', authorize('ADMIN', 'HEAD_OF_SCHOOL'), updateCohortTimeline);

// Lock / Unlock
router.post('/:id/lock', authorize('ADMIN', 'HEAD_OF_SCHOOL'), toggleBatchLock);

// Promotion
router.post('/:id/promote', authorize('ADMIN', 'HEAD_OF_SCHOOL'), async (req: AuthRequest, res: Response) => {

    try {
        const id = req.params.id as string;
        const adminUserId = req.user!.userId;
        const result = await promoteBatchSemester(id, adminUserId);
        res.json(result);
    } catch (error: any) {
        console.error('Promotion Error:', error);
        res.status(500).json({ error: error.message || 'Promotion failed.' });
    }
});

// Promotion Logs
router.get('/:id/promotion-logs', getPromotionLogs);

export default router;
