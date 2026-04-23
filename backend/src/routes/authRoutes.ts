import { Router } from 'express';
import { 
    sendOtp, 
    verifyOtp, 
    onboard, 
    login, 
    refresh, 
    logout 
} from '../controllers/auth/authController';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/onboard', onboard);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
