import { Router } from 'express';
import {
    getBatches,
    getBatchById,
    createBatch,
    updateBatch,
    updateTimeline,
    toggleBatchLock,
    getPromotionLogs,
} from '../controllers/batch/batchController';
import { promoteBatchSemester } from '../services/promotionService';
import { protect, authorize } from '../middleware/authMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';
import { Response } from 'express';

const router = Router();

router.use(protect);
router.use(authorize('ADMIN'));

// Core CRUD
router.get('/', getBatches);
router.get('/:id', getBatchById);
router.post('/', createBatch);
router.put('/:id', updateBatch);

// Timeline
router.put('/:id/timeline', updateTimeline);

// Lock / Unlock
router.post('/:id/lock', toggleBatchLock);

// Promotion
router.post('/:id/promote', async (req: AuthRequest, res: Response) => {
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
