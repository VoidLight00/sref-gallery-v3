import { Router } from 'express';
import { prisma } from '../../lib/database/config';
import { asyncHandler, sendSuccess } from '../middleware/errorHandler';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require admin authentication
router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get('/stats', asyncHandler(async (req, res) => {
  const [
    totalSrefs,
    totalUsers,
    totalViews,
    totalLikes,
    recentUsers,
    recentSrefs
  ] = await Promise.all([
    prisma.srefCode.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.srefCode.aggregate({
      _sum: { views: true },
      where: { status: 'ACTIVE' }
    }),
    prisma.srefCode.aggregate({
      _sum: { likes: true },
      where: { status: 'ACTIVE' }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    }),
    prisma.srefCode.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
  ]);

  sendSuccess(res, {
    totalSrefs,
    totalUsers,
    totalViews: totalViews._sum.views || 0,
    totalLikes: totalLikes._sum.likes || 0,
    recentUsers,
    recentSrefs,
    timestamp: new Date()
  });
}));

export { router as adminRoutes };