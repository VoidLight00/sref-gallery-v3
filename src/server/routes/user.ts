import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/database/config';
import { asyncHandler, sendSuccess, ApiError } from '../middleware/errorHandler';
import { authenticate, passwordUtils } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().max(200).optional(),
  twitter: z.string().max(50).optional(),
  instagram: z.string().max(50).optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().max(10).optional()
});

// GET /api/user/profile
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      bio: true,
      website: true,
      twitter: true,
      instagram: true,
      profileImage: true,
      premium: true,
      admin: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      settings: {
        select: {
          emailNotifications: true,
          marketingEmails: true,
          theme: true,
          language: true
        }
      }
    }
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  sendSuccess(res, user);
}));

// PUT /api/user/profile
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const validatedData = updateProfileSchema.parse(req.body);
  const userId = req.user!.id;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: validatedData,
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      bio: true,
      website: true,
      twitter: true,
      instagram: true,
      profileImage: true,
      premium: true,
      admin: true
    }
  });

  logger.info(`User ${userId} updated profile`, { userId, fields: Object.keys(validatedData) });
  sendSuccess(res, updatedUser);
}));

// PUT /api/user/password
router.put('/password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const userId = req.user!.id;

  // Get current password hash
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true }
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Verify current password
  const isValid = await passwordUtils.verify(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new ApiError('Current password is incorrect', 400, 'INVALID_PASSWORD');
  }

  // Hash new password
  const passwordHash = await passwordUtils.hash(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      passwordChangedAt: new Date()
    }
  });

  logger.info(`User ${userId} changed password`);
  sendSuccess(res, { message: 'Password updated successfully' });
}));

// GET /api/user/settings
router.get('/settings', authenticate, asyncHandler(async (req, res) => {
  const settings = await prisma.userSettings.findUnique({
    where: { userId: req.user!.id }
  });

  sendSuccess(res, settings || {
    emailNotifications: true,
    marketingEmails: false,
    theme: 'light',
    language: 'en'
  });
}));

// PUT /api/user/settings
router.put('/settings', authenticate, asyncHandler(async (req, res) => {
  const validatedData = updateSettingsSchema.parse(req.body);
  const userId = req.user!.id;

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: validatedData,
    create: {
      userId,
      ...validatedData
    }
  });

  logger.info(`User ${userId} updated settings`, { userId, settings: Object.keys(validatedData) });
  sendSuccess(res, settings);
}));

// GET /api/user/stats
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const [favoritesCount, likesCount, submissionsCount] = await Promise.all([
    prisma.userFavorite.count({ where: { userId } }),
    prisma.userLike.count({ where: { userId } }),
    prisma.srefCode.count({ where: { submittedById: userId } })
  ]);

  sendSuccess(res, {
    favorites: favoritesCount,
    likes: likesCount,
    submissions: submissionsCount
  });
}));

// GET /api/user/activity
router.get('/activity', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  // Get recent user activities
  const activities = await prisma.srefAnalytic.findMany({
    where: { userId },
    include: {
      sref: {
        select: {
          id: true,
          code: true,
          title: true,
          slug: true,
          images: {
            where: { imageOrder: 1 },
            select: { thumbnailUrl: true, blurHash: true },
            take: 1
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  });

  const total = await prisma.srefAnalytic.count({
    where: { userId }
  });

  sendSuccess(res, {
    activities: activities.map(activity => ({
      id: activity.id,
      type: activity.eventType.toLowerCase(),
      sref: activity.sref,
      timestamp: activity.createdAt
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// DELETE /api/user/account
router.delete('/account', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { password } = req.body;

  if (!password) {
    throw new ApiError('Password is required to delete account', 400);
  }

  // Verify password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, email: true }
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const isValid = await passwordUtils.verify(password, user.passwordHash);
  if (!isValid) {
    throw new ApiError('Invalid password', 400, 'INVALID_PASSWORD');
  }

  // Soft delete user (mark as deleted)
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${Date.now()}_${user.email}`,
      username: `deleted_${Date.now()}_${userId.substring(0, 8)}`,
      firstName: 'Deleted',
      lastName: 'User',
      bio: null,
      website: null,
      twitter: null,
      instagram: null,
      profileImage: null,
      deletedAt: new Date()
    }
  });

  logger.info(`User ${userId} deleted their account`);
  sendSuccess(res, { message: 'Account deleted successfully' });
}));

// GET /api/user/favorites
router.get('/favorites', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  const favorites = await prisma.userFavorite.findMany({
    where: { userId },
    include: {
      sref: {
        include: {
          categories: {
            include: {
              category: {
                select: { name: true, slug: true, icon: true }
              }
            }
          },
          images: {
            where: { imageOrder: 1 },
            select: { imageUrl: true, thumbnailUrl: true, blurHash: true },
            take: 1
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  sendSuccess(res, favorites.map(f => ({
    ...f.sref,
    categories: f.sref.categories.map(c => c.category),
    favoritedAt: f.createdAt
  })));
}));

// POST /api/user/favorites/:srefId
router.post('/favorites/:srefId', authenticate, asyncHandler(async (req, res) => {
  const { srefId } = req.params;
  const userId = req.user!.id;

  await prisma.userFavorite.upsert({
    where: {
      userId_srefId: { userId, srefId }
    },
    update: {},
    create: { userId, srefId }
  });

  // Update SREF favorites count
  await prisma.srefCode.update({
    where: { id: srefId },
    data: { favorites: { increment: 1 } }
  });

  sendSuccess(res, { message: 'Added to favorites' });
}));

// DELETE /api/user/favorites/:srefId
router.delete('/favorites/:srefId', authenticate, asyncHandler(async (req, res) => {
  const { srefId } = req.params;
  const userId = req.user!.id;

  await prisma.userFavorite.delete({
    where: {
      userId_srefId: { userId, srefId }
    }
  });

  // Update SREF favorites count
  await prisma.srefCode.update({
    where: { id: srefId },
    data: { favorites: { decrement: 1 } }
  });

  sendSuccess(res, { message: 'Removed from favorites' });
}));

export { router as userRoutes };