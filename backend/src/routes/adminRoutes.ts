import { Router } from 'express';
import { getAuditLogs } from '../controllers/admin/auditController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/audit-logs', getAuditLogs);

export default router;
