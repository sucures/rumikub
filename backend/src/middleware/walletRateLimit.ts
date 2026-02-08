import rateLimit from 'express-rate-limit';
import { walletRateLimitMaxPerMinute } from '../config/wallet.js';
import type { AuthRequest } from './auth.js';

const windowMs = 60 * 1000; // 1 minute

/**
 * Per-user rate limit for wallet write endpoints (spend, transfer, simulate-payment).
 * Use after authenticate so req.userId is set. Returns 429 with standard body when exceeded.
 */
export const walletRateLimit = rateLimit({
  windowMs,
  limit: walletRateLimitMaxPerMinute,
  message: { error: 'Too many wallet operations', code: 'RATE_LIMIT_EXCEEDED' },
  statusCode: 429,
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).userId;
    if (userId) return `wallet:${userId}`;
    return `wallet:ip:${req.ip ?? req.socket?.remoteAddress ?? 'unknown'}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many wallet operations',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});
