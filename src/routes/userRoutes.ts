import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { getAllUsers, getProfile, updateProfile, deleteProfile } from '../controllers/userController';

const router = Router();

// Apenas admins podem listar todos os usuários
router.get('/', authMiddleware, (req: AuthRequest, res, next) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
}, getAllUsers);

// Perfil do usuário logado
router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);
router.delete('/me', authMiddleware, deleteProfile);

export default router;