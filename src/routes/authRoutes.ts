import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { validate } from '../middlewares/validateMiddleware';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6)
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;