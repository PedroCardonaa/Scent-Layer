import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import fragranceRoutes from './routes/fragrances.js';
import wishlistRoutes from './routes/wishlist.js';
import waitlistRoutes from './routes/waitlist.js';
import sourceRoutes from './routes/source.js';
import aiRoutes from './routes/ai.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',').map(s => s.trim()) ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/fragrances', fragranceRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/source', sourceRoutes);
app.use('/api/ai', aiRoutes);

app.use((err, _req, res, _next) => {
  if (err?.issues) {
    return res.status(400).json({ error: 'validation', issues: err.issues });
  }
  console.error('[server]', err);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Server error' });
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => {
  console.log(`Scent Layer API listening on http://localhost:${port}`);
});
