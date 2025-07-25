import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { getAllUsers, getProfile, updateProfile, deleteProfile } from '../controllers/userController';

const router = Router();

// User profile routes (put specific routes BEFORE general ones)
router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);
router.delete('/me', authMiddleware, deleteProfile);

// Admin only routes (put this AFTER specific routes to avoid conflicts)
router.get('/', authMiddleware, requireRole(['admin']), getAllUsers);

export default router;