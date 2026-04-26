import { Router } from 'express';
import { setupProfile } from '../controllers/user/profileController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/setup', protect, setupProfile);

export default router;
