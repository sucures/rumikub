import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as Record<string, unknown>;
    req.userId = decoded.userId as string;
    req.user = decoded;
    // Step Security.10 Phase 2: bind session to device
    const headerDeviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'].trim() : '';
    if (headerDeviceId && !decoded.deviceId) {
      req.user.deviceId = headerDeviceId;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    next();
  };
};

/** Requires user to have premium. Use after authenticate. */
export const requirePremium = (checkPremium: (userId: string) => Promise<boolean>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const isPremium = await checkPremium(userId);
    if (!isPremium) {
      return res.status(403).json({ success: false, error: 'Premium required to create tournaments' });
    }
    next();
  };
};
