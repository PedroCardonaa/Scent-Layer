import rateLimit from 'express-rate-limit';

/**
 * AI endpoints are the expensive ones (every request hits Anthropic).
 * Cap at 30 requests per 10 minutes per IP. A genuine browsing user
 * won't trip this; a script abusing the endpoints will be cut off
 * before burning the Anthropic budget.
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Try again in a few minutes.' },
});

/**
 * Email/persistence endpoints (sample orders, source requests, waitlist).
 * Cap at 10 per minute per IP, enough for a real user, throttles spam.
 */
export const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many submissions. Slow down a moment.' },
});

/**
 * Auth endpoints. Cap at 8 attempts per 15 min per IP, frustrates
 * credential stuffing without hurting genuine retries.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Try again in 15 minutes.' },
});
