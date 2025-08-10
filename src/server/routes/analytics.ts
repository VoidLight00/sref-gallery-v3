import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/database/config';
import { asyncHandler, sendSuccess, ApiError } from '../middleware/errorHandler';
import { optionalAuthenticate, authenticate, requireAdmin } from '../middleware/auth';
import { cache } from '../../lib/database/config';

const router = Router();

const trackEventSchema = z.object({
  event: z.enum(['page_view', 'sref_view', 'search', 'download', 'share']),
  data: z.object({
    page: z.string().optional(),
    srefCode: z.string().optional(),
    searchQuery: z.string().optional(),
    referrer: z.string().optional()
  }).optional()
});

// POST /api/analytics/track
router.post('/track', optionalAuthenticate, asyncHandler(async (req, res) => {
  const { event, data } = trackEventSchema.parse(req.body);
  const userId = req.user?.id;

  // Track different types of events
  if (event === 'sref_view' && data?.srefCode) {
    const sref = await prisma.srefCode.findUnique({
      where: { code: data.srefCode },
      select: { id: true }
    });

    if (sref) {
      await prisma.srefAnalytic.create({
        data: {
          srefId: sref.id,
          eventType: 'VIEW',
          userId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          referrer: data.referrer
        }
      });
    }
  } else if (event === 'page_view' && data?.page) {
    await prisma.pageAnalytic.create({
      data: {
        pagePath: data.page,
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: data.referrer
      }
    });
  }

  sendSuccess(res, { message: 'Event tracked' });
}));

// GET /api/analytics/dashboard - Admin dashboard stats
router.get('/dashboard', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:dashboard';
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return sendSuccess(res, JSON.parse(cached));
  }

  const [
    totalUsers,
    totalSrefs,
    totalViews,
    activeUsers,
    popularSrefs,
    recentActivity,
    categoryStats,
    dailyStats
  ] = await Promise.all([
    // Total users
    prisma.user.count({ where: { deletedAt: null } }),
    
    // Total SREFs
    prisma.srefCode.count({ where: { status: 'ACTIVE' } }),
    
    // Total views
    prisma.srefAnalytic.count({ where: { eventType: 'VIEW' } }),
    
    // Active users (last 30 days)
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        deletedAt: null
      }
    }),
    
    // Most popular SREFs (last 30 days)
    prisma.srefCode.findMany({
      where: {
        analytics: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      },
      select: {
        id: true,
        code: true,
        title: true,
        views: true,
        likes: true,
        _count: {
          select: {
            analytics: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }
      },
      orderBy: {
        analytics: {
          _count: 'desc'
        }
      },
      take: 10
    }),
    
    // Recent activity
    prisma.srefAnalytic.findMany({
      include: {
        sref: {
          select: { code: true, title: true }
        },
        user: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    
    // Category statistics
    prisma.category.findMany({
      select: {
        name: true,
        slug: true,
        srefCount: true,
        _count: {
          select: {
            srefs: {
              where: {
                sref: { status: 'ACTIVE' }
              }
            }
          }
        }
      },
      orderBy: { srefCount: 'desc' }
    }),
    
    // Daily stats for last 30 days
    prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT user_id) as unique_users
      FROM sref_analytics 
      WHERE created_at >= NOW() - INTERVAL 30 DAY
        AND event_type = 'VIEW'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    ` as any[]
  ]);

  const dashboardData = {
    overview: {
      totalUsers,
      totalSrefs,
      totalViews,
      activeUsers
    },
    popularSrefs: popularSrefs.map(sref => ({
      ...sref,
      recentViews: sref._count.analytics
    })),
    recentActivity: recentActivity.map(activity => ({
      id: activity.id,
      event: activity.eventType,
      sref: activity.sref,
      user: activity.user?.username || 'Anonymous',
      timestamp: activity.createdAt
    })),
    categoryStats,
    dailyStats: dailyStats.map(stat => ({
      date: stat.date,
      views: Number(stat.views),
      uniqueUsers: Number(stat.unique_users)
    }))
  };

  // Cache for 5 minutes
  await cache.setex(cacheKey, 300, JSON.stringify(dashboardData));
  
  sendSuccess(res, dashboardData);
}));

// GET /api/analytics/popular - Popular SREFs with time filtering
router.get('/popular', asyncHandler(async (req, res) => {
  const timeframe = (req.query.timeframe as string) || '30d';
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  
  let startDate: Date;
  switch (timeframe) {
    case '24h':
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const cacheKey = `analytics:popular:${timeframe}:${limit}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return sendSuccess(res, JSON.parse(cached));
  }

  const popularSrefs = await prisma.srefCode.findMany({
    where: {
      status: 'ACTIVE',
      analytics: {
        some: {
          createdAt: { gte: startDate }
        }
      }
    },
    select: {
      id: true,
      code: true,
      title: true,
      slug: true,
      views: true,
      likes: true,
      favorites: true,
      categories: {
        include: {
          category: {
            select: { name: true, slug: true }
          }
        }
      },
      images: {
        where: { imageOrder: 1 },
        select: { thumbnailUrl: true, blurHash: true },
        take: 1
      },
      _count: {
        select: {
          analytics: {
            where: {
              createdAt: { gte: startDate }
            }
          }
        }
      }
    },
    orderBy: [
      {
        analytics: {
          _count: 'desc'
        }
      },
      { views: 'desc' }
    ],
    take: limit
  });

  const result = popularSrefs.map(sref => ({
    ...sref,
    categories: sref.categories.map(c => c.category),
    recentViews: sref._count.analytics
  }));

  // Cache for 10 minutes
  await cache.setex(cacheKey, 600, JSON.stringify(result));
  
  sendSuccess(res, result);
}));

// GET /api/analytics/trending - Trending SREFs based on growth
router.get('/trending', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const cacheKey = `analytics:trending:${limit}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return sendSuccess(res, JSON.parse(cached));
  }

  // Get SREFs with significant view growth in last 24h vs previous 24h
  const trending = await prisma.$queryRaw`
    SELECT 
      s.id, s.code, s.title, s.slug,
      s.views, s.likes, s.favorites,
      COALESCE(recent.views, 0) as recent_views,
      COALESCE(previous.views, 0) as previous_views,
      CASE 
        WHEN COALESCE(previous.views, 0) = 0 THEN COALESCE(recent.views, 0)
        ELSE (COALESCE(recent.views, 0) - COALESCE(previous.views, 0)) / COALESCE(previous.views, 1)
      END as growth_rate
    FROM sref_codes s
    LEFT JOIN (
      SELECT sref_id, COUNT(*) as views
      FROM sref_analytics 
      WHERE created_at >= NOW() - INTERVAL 24 HOUR
        AND event_type = 'VIEW'
      GROUP BY sref_id
    ) recent ON s.id = recent.sref_id
    LEFT JOIN (
      SELECT sref_id, COUNT(*) as views
      FROM sref_analytics 
      WHERE created_at >= NOW() - INTERVAL 48 HOUR
        AND created_at < NOW() - INTERVAL 24 HOUR
        AND event_type = 'VIEW'
      GROUP BY sref_id
    ) previous ON s.id = previous.sref_id
    WHERE s.status = 'ACTIVE'
      AND COALESCE(recent.views, 0) > 0
    ORDER BY growth_rate DESC, recent_views DESC
    LIMIT ${limit}
  ` as any[];

  // Enrich with additional data
  const trendingSrefs = await Promise.all(
    trending.map(async (sref: any) => {
      const enrichedSref = await prisma.srefCode.findUnique({
        where: { id: sref.id },
        select: {
          categories: {
            include: {
              category: {
                select: { name: true, slug: true }
              }
            }
          },
          images: {
            where: { imageOrder: 1 },
            select: { thumbnailUrl: true, blurHash: true },
            take: 1
          }
        }
      });

      return {
        ...sref,
        views: Number(sref.views),
        likes: Number(sref.likes),
        favorites: Number(sref.favorites),
        recentViews: Number(sref.recent_views),
        previousViews: Number(sref.previous_views),
        growthRate: Number(sref.growth_rate),
        categories: enrichedSref?.categories.map(c => c.category) || [],
        images: enrichedSref?.images || []
      };
    })
  );

  // Cache for 15 minutes
  await cache.setex(cacheKey, 900, JSON.stringify(trendingSrefs));
  
  sendSuccess(res, trendingSrefs);
}));

// GET /api/analytics/stats/:srefId - Detailed stats for a specific SREF
router.get('/stats/:srefId', authenticate, asyncHandler(async (req, res) => {
  const { srefId } = req.params;
  const isAdmin = req.user?.admin;
  
  const sref = await prisma.srefCode.findUnique({
    where: { id: srefId },
    select: {
      id: true,
      code: true,
      title: true,
      submittedById: true
    }
  });

  if (!sref) {
    throw new ApiError('SREF not found', 404);
  }

  // Only admin or owner can see detailed stats
  if (!isAdmin && sref.submittedById !== req.user!.id) {
    throw new ApiError('Insufficient permissions', 403);
  }

  const cacheKey = `analytics:sref:${srefId}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return sendSuccess(res, JSON.parse(cached));
  }

  const [analytics, dailyViews, topReferrers, userActivity] = await Promise.all([
    // Overall analytics
    prisma.srefAnalytic.groupBy({
      by: ['eventType'],
      where: { srefId },
      _count: { id: true }
    }),
    
    // Daily views for last 30 days
    prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT user_id) as unique_users
      FROM sref_analytics 
      WHERE sref_id = ${srefId}
        AND created_at >= NOW() - INTERVAL 30 DAY
        AND event_type = 'VIEW'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    ` as any[],
    
    // Top referrers
    prisma.srefAnalytic.groupBy({
      by: ['referrer'],
      where: { 
        srefId,
        referrer: { not: null },
        eventType: 'VIEW'
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    }),
    
    // User activity breakdown
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN user_id IS NOT NULL THEN 'authenticated'
          ELSE 'anonymous'
        END as user_type,
        COUNT(*) as views
      FROM sref_analytics 
      WHERE sref_id = ${srefId}
        AND event_type = 'VIEW'
      GROUP BY user_type
    ` as any[]
  ]);

  const stats = {
    sref: {
      id: sref.id,
      code: sref.code,
      title: sref.title
    },
    summary: analytics.reduce((acc, curr) => {
      acc[curr.eventType.toLowerCase()] = curr._count.id;
      return acc;
    }, {} as Record<string, number>),
    dailyViews: dailyViews.map(stat => ({
      date: stat.date,
      views: Number(stat.views),
      uniqueUsers: Number(stat.unique_users)
    })),
    topReferrers: topReferrers.map(ref => ({
      referrer: ref.referrer || 'Direct',
      views: ref._count.id
    })),
    userActivity: userActivity.map(activity => ({
      type: activity.user_type,
      views: Number(activity.views)
    }))
  };

  // Cache for 5 minutes
  await cache.setex(cacheKey, 300, JSON.stringify(stats));
  
  sendSuccess(res, stats);
}));

export { router as analyticsRoutes };