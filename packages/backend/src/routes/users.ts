import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { userService } from '../services/user.service';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(255),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await userService.register(req.body.email, req.body.displayName, req.body.password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await userService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await userService.getById(req.userId!);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
