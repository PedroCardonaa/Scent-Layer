import 'dotenv/config';

// Sentry must be imported and initialized BEFORE anything else so it can
// instrument http, express, and async stacks. Silent no-op if SENTRY_DSN
// is unset — useful for local dev where you don't want to ship errors out.
import * as Sentry from '@sentry/node';
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
  });
}

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import fragranceRoutes from './routes/fragrances.js';
import wishlistRoutes from './routes/wishlist.js';
import waitlistRoutes from './routes/waitlist.js';
import sourceRoutes from './routes/source.js';
import aiRoutes from './routes/ai.js';
import wardrobeRoutes from './routes/wardrobe.js';
import reviewRoutes from './routes/reviews.js';
import blendRoutes from './routes/blends.js';
import setRoutes from './routes/sets.js';
import { submitLimiter } from './middleware/rate-limit.js';

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
// Waitlist signups are persistence + low cost; throttle to discourage scripts
app.use('/api/waitlist', submitLimiter, waitlistRoutes);
app.use('/api/source', sourceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blends', blendRoutes);
app.use('/api/sets', setRoutes);

// Sentry's express error handler must come BEFORE our own handler so it
// captures errors before we mask them as 500s.
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

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
