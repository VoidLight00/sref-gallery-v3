import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/database/config';
import { UnauthorizedError, ForbiddenError, ApiError } from './errorHandler';
import { logger } from '../utils/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        premium: boolean;
        admin: boolean;
        status: string;
      };
    }
  }
}

export interface JwtPayload {
  id: string;
  email: string;
  username: string;
  premium: boolean;
  admin: boolean;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// JWT utility functions
export const jwtUtils = {
  generateAccessToken(user: any): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      id: user.id,
      email: user.email,
      username: user.username,
      premium: user.premium,
      admin: user.admin,
      type: 'access'
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      issuer: 'sref-gallery-api',
      audience: 'sref-gallery-frontend'
    });
  },

  generateRefreshToken(user: any): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      id: user.id,
      email: user.email,
      username: user.username,
      premium: user.premium,
      admin: user.admin,
      type: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'sref-gallery-api',
      audience: 'sref-gallery-frontend'
    });
  },

  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
        issuer: 'sref-gallery-api',
        audience: 'sref-gallery-frontend'
      }) as JwtPayload;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid access token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  },

  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
        issuer: 'sref-gallery-api',
        audience: 'sref-gallery-frontend'
      }) as JwtPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }
};

// Password utility functions
export const passwordUtils = {
  async hash(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    return await bcrypt.hash(password, saltRounds);
  },

  async verify(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  },

  validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization token required');
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = jwtUtils.verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        premium: true,
        admin: true,
        status: true,
      }
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is not active');
    }

    // Attach user to request
    req.user = user;

    // Update last login timestamp occasionally (not every request)
    if (Math.random() < 0.1) { // 10% chance
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      }).catch(() => {}); // Don't fail request if this fails
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logger.error('Authentication middleware error:', error);
      next(new UnauthorizedError('Authentication failed'));
    }
  }
};

// Optional authentication (for routes that work with or without auth)
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user
    }

    const token = authHeader.substring(7);
    const decoded = jwtUtils.verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        premium: true,
        admin: true,
        status: true,
      }
    });

    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    logger.debug('Optional authentication failed:', error);
    next();
  }
};

// Admin authorization middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (!req.user.admin) {
    return next(new ForbiddenError('Admin access required'));
  }

  next();
};

// Premium authorization middleware
export const requirePremium = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (!req.user.premium && !req.user.admin) {
    return next(new ForbiddenError('Premium account required'));
  }

  next();
};

// Resource ownership middleware factory
export const requireOwnership = (
  getResourceUserId: (req: Request) => Promise<string | null>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      // Admin can access any resource
      if (req.user.admin) {
        return next();
      }

      const resourceUserId = await getResourceUserId(req);
      
      if (!resourceUserId) {
        return next(new ApiError('Resource not found', 404, 'NOT_FOUND'));
      }

      if (resourceUserId !== req.user.id) {
        return next(new ForbiddenError('Access denied'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};