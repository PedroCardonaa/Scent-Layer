import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash },
      select: { id: true, email: true, createdAt: true, quizResult: true },
    });
    res.json({ user, token: signToken(user.id) });
  } catch (err) { next(err); }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({
      user: { id: user.id, email: user.email, createdAt: user.createdAt, quizResult: user.quizResult },
      token: signToken(user.id),
    });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, createdAt: true, quizResult: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

const quizSchema = z.object({
  name: z.string(),
  brand: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  why: z.string().optional(),
}).passthrough();

router.put('/me/quiz', requireAuth, async (req, res, next) => {
  try {
    const result = quizSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { quizResult: result },
      select: { id: true, email: true, createdAt: true, quizResult: true },
    });
    res.json({ user });
  } catch (err) { next(err); }
});

export default router;
