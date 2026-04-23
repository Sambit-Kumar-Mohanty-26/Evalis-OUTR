import { Router } from 'express';
import { createNode, getNodes, deleteNode, syncNodes } from '../controllers/org/nodeController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/nodes', createNode);
router.put('/sync', syncNodes);
router.get('/nodes', getNodes);
router.delete('/nodes/:id', deleteNode);

export default router;
