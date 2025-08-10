import { Router } from 'express';
import { z } from 'zod';
import { prisma, cache } from '../../lib/database/config';
import { 
  asyncHandler, 
  sendSuccess, 
  ValidationError, 
  UnauthorizedError,
  ConflictError 
} from '../middleware/errorHandler';
import { jwtUtils, passwordUtils, authenticate, optionalAuthenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email().max(255),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  remember: z.boolean().optional()
});

const refreshTokenSchema = z.object({
  refreshToken: z.string()
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(128)
});

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  // Check if user registration is enabled
  if (process.env.FEATURE_USER_REGISTRATION !== 'true') {
    throw new ValidationError('User registration is currently disabled');
  }

  const validatedData = registerSchema.parse(req.body);

  // Validate password strength
  const passwordValidation = passwordUtils.validate(validatedData.password);
  if (!passwordValidation.valid) {
    throw new ValidationError('Password does not meet requirements', {
      requirements: passwordValidation.errors
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: validatedData.email },
        { username: validatedData.username }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.email === validatedData.email) {
      throw new ConflictError('Email address already registered');
    } else {
      throw new ConflictError('Username already taken');
    }
  }

  // Hash password
  const passwordHash = await passwordUtils.hash(validatedData.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: validatedData.email,
      username: validatedData.username,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      loginCount: 1,
      lastLogin: new Date()
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      premium: true,
      admin: true,
      emailVerified: true,
      createdAt: true
    }
  });

  // Generate tokens
  const accessToken = jwtUtils.generateAccessToken(user);
  const refreshToken = jwtUtils.generateRefreshToken(user);

  // Store refresh token in cache (for token blacklisting)
  await cache.set(
    `refresh_token:${user.id}`,
    refreshToken,
    7 * 24 * 60 * 60 // 7 days
  );

  logger.info('User registered', {
    userId: user.id,
    email: user.email,
    username: user.username
  });

  sendSuccess(res, {
    message: 'Registration successful',
    user,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour in seconds
    }
  }, 201);
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const validatedData = loginSchema.parse(req.body);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: validatedData.email }
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Account is not active');
  }

  // Verify password
  const validPassword = await passwordUtils.verify(validatedData.password, user.passwordHash);
  if (!validPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update login statistics
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
      loginCount: { increment: 1 }
    }
  });

  // Generate tokens
  const accessToken = jwtUtils.generateAccessToken(user);
  const refreshToken = jwtUtils.generateRefreshToken(user);

  // Store refresh token in cache
  const refreshTokenTTL = validatedData.remember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
  await cache.set(`refresh_token:${user.id}`, refreshToken, refreshTokenTTL);

  // Prepare user response
  const userResponse = {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    premium: user.premium,
    admin: user.admin,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt
  };

  logger.info('User logged in', {
    userId: user.id,
    email: user.email,
    remember: validatedData.remember
  });

  sendSuccess(res, {
    message: 'Login successful',
    user: userResponse,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour in seconds
    }
  });
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req, res) => {
  const validatedData = refreshTokenSchema.parse(req.body);

  // Verify refresh token
  const decoded = jwtUtils.verifyRefreshToken(validatedData.refreshToken);

  // Check if refresh token exists in cache
  const cachedToken = await cache.get(`refresh_token:${decoded.id}`);
  if (!cachedToken || cachedToken !== validatedData.refreshToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: decoded.id }
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new UnauthorizedError('User not found or inactive');
  }

  // Generate new access token
  const accessToken = jwtUtils.generateAccessToken(user);

  logger.info('Token refreshed', {
    userId: user.id,
    email: user.email
  });

  sendSuccess(res, {
    message: 'Token refreshed successfully',
    tokens: {
      accessToken,
      refreshToken: validatedData.refreshToken, // Keep the same refresh token
      expiresIn: 3600
    }
  });
}));

// POST /api/auth/logout
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  // Remove refresh token from cache
  await cache.del(`refresh_token:${userId}`);

  logger.info('User logged out', {
    userId,
    email: req.user!.email
  });

  sendSuccess(res, {
    message: 'Logout successful'
  });
}));

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      premium: true,
      admin: true,
      emailVerified: true,
      emailVerifiedAt: true,
      createdAt: true,
      lastLogin: true,
      loginCount: true,
      status: true
    }
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  sendSuccess(res, user);
}));

// POST /api/auth/forgot-password
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const validatedData = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: validatedData.email }
  });

  // Always return success to prevent email enumeration
  if (!user) {
    logger.warn('Password reset requested for non-existent email', {
      email: validatedData.email,
      ip: req.ip
    });
  } else {
    // Generate reset token (in production, this would send an email)
    const resetToken = jwtUtils.generateAccessToken({
      ...user,
      type: 'password_reset'
    });

    // Store reset token in cache (15 minutes)
    await cache.set(`password_reset:${user.id}`, resetToken, 15 * 60);

    logger.info('Password reset requested', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    // In production, send email with reset link here
    if (process.env.NODE_ENV === 'development') {
      logger.info('Password reset token (DEV ONLY):', { token: resetToken });
    }
  }

  sendSuccess(res, {
    message: 'If an account with this email exists, a password reset link has been sent'
  });
}));

// POST /api/auth/reset-password
router.post('/reset-password', asyncHandler(async (req, res) => {
  const validatedData = resetPasswordSchema.parse(req.body);

  // Validate new password
  const passwordValidation = passwordUtils.validate(validatedData.password);
  if (!passwordValidation.valid) {
    throw new ValidationError('Password does not meet requirements', {
      requirements: passwordValidation.errors
    });
  }

  // Verify reset token
  let decoded;
  try {
    decoded = jwtUtils.verifyAccessToken(validatedData.token);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }

  // Check if reset token exists in cache
  const cachedToken = await cache.get(`password_reset:${decoded.id}`);
  if (!cachedToken || cachedToken !== validatedData.token) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }

  // Hash new password
  const passwordHash = await passwordUtils.hash(validatedData.password);

  // Update user password
  await prisma.user.update({
    where: { id: decoded.id },
    data: {
      passwordHash,
      updatedAt: new Date()
    }
  });

  // Remove reset token from cache
  await cache.del(`password_reset:${decoded.id}`);

  // Invalidate all refresh tokens for this user
  await cache.del(`refresh_token:${decoded.id}`);

  logger.info('Password reset completed', {
    userId: decoded.id,
    email: decoded.email
  });

  sendSuccess(res, {
    message: 'Password reset successful'
  });
}));

// GET /api/auth/check-username/:username
router.get('/check-username/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username || username.length < 3) {
    throw new ValidationError('Username must be at least 3 characters');
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true }
  });

  sendSuccess(res, {
    available: !existingUser
  });
}));

// GET /api/auth/check-email/:email
router.get('/check-email/:email', asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email || !z.string().email().safeParse(email).success) {
    throw new ValidationError('Invalid email format');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  sendSuccess(res, {
    available: !existingUser
  });
}));

export { router as authRoutes };