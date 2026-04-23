import { Router } from 'express';
import multer from 'multer';
import {
    getUsers,
    getUserById,
    getUserMetadata,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    assignAdmin,
    removeAdmin,
    bulkUploadUsers
} from '../controllers/user/userController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// CSV upload config (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// All routes require authentication + ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

// Core CRUD
router.get('/', getUsers);
router.get('/metadata', getUserMetadata);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Specialized Actions
router.post('/:id/reset-password', resetPassword);
router.post('/:id/assign-admin', assignAdmin);
router.delete('/:id/admin/:nodeId', removeAdmin);

// Bulk Upload
router.post('/bulk', upload.single('file'), bulkUploadUsers);

export default router;
