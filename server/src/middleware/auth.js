import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) console.warn('[auth] JWT_SECRET not set, tokens will be unsignable');

export function signToken(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: '30d' });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }
  try {
    const payload = jwt.verify(header.slice(7), SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.userId = jwt.verify(header.slice(7), SECRET).sub;
    } catch { /* ignore */ }
  }
  next();
}
