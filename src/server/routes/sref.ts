import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma, cache } from '../../lib/database/config';
import { 
  asyncHandler, 
  sendSuccess, 
  sendPaginatedResponse,
  ValidationError,
  NotFoundError,
  ConflictError
} from '../middleware/errorHandler';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const srefListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).or(z.string().transform(s => s.split(','))).optional(),
  featured: z.coerce.boolean().optional(),
  premium: z.coerce.boolean().optional(),
  sort: z.enum(['popularity', 'newest', 'views', 'likes', 'trending']).default('popularity'),
  timeRange: z.enum(['24h', '7d', '30d', 'all']).default('all')
});

const createSrefSchema = z.object({
  code: z.string().regex(/^\d{8,12}$/, 'SREF code must be 8-12 digits'),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  promptExamples: z.array(z.string()).max(10).optional(),
  categoryIds: z.array(z.string().uuid()),
  tags: z.array(z.string().min(1).max(50)).max(20),
  featured: z.boolean().default(false),
  premium: z.boolean().default(false),
  verified: z.boolean().default(false)
});

const updateSrefSchema = createSrefSchema.partial().omit({ code: true });

const srefInteractionSchema = z.object({
  type: z.enum(['view', 'like', 'unlike', 'favorite', 'unfavorite', 'download', 'share', 'copy']).optional()
});

// Helper function to build search filters
function buildSrefFilters(query: any, userId?: string) {
  const filters: Prisma.SrefCodeWhereInput = {
    status: 'ACTIVE'
  };

  // Search in title and description
  if (query.search) {
    filters.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { 
        tags: {
          some: {
            tag: {
              name: { contains: query.search, mode: 'insensitive' }
            }
          }
        }
      }
    ];
  }

  // Category filter
  if (query.category) {
    filters.categories = {
      some: {
        category: {
          slug: query.category
        }
      }
    };
  }

  // Tags filter
  if (query.tags && query.tags.length > 0) {
    filters.tags = {
      some: {
        tag: {
          name: { in: query.tags }
        }
      }
    };
  }

  // Featured filter
  if (query.featured !== undefined) {
    filters.featured = query.featured;
  }

  // Premium filter
  if (query.premium !== undefined) {
    if (!query.premium) {
      filters.premium = false;
    } else if (userId) {
      // Only show premium content to premium/admin users
      // This would need user check in the route handler
    } else {
      // Anonymous users can't see premium content
      filters.premium = false;
    }
  }

  return filters;
}

// Helper function to build sort order
function buildSortOrder(sort: string, timeRange: string): Prisma.SrefCodeOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ createdAt: 'desc' }];
    case 'views':
      return [{ views: 'desc' }, { createdAt: 'desc' }];
    case 'likes':
      return [{ likes: 'desc' }, { createdAt: 'desc' }];
    case 'trending':
      // For trending, we'd typically calculate based on recent activity
      // For now, use a combination of recent popularity
      return [
        { featuredAt: 'desc' },
        { popularityScore: 'desc' },
        { views: 'desc' }
      ];
    case 'popularity':
    default:
      return [{ popularityScore: 'desc' }, { views: 'desc' }];
  }
}

// GET /api/sref
router.get('/', optionalAuthenticate, asyncHandler(async (req, res) => {
  const query = srefListSchema.parse(req.query);
  const userId = req.user?.id;

  // Check cache first for popular queries
  const cacheKey = `sref_list:${JSON.stringify(query)}:${userId || 'anonymous'}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return sendPaginatedResponse(res, cached.data, cached.pagination);
  }

  const filters = buildSrefFilters(query, userId);
  const orderBy = buildSortOrder(query.sort, query.timeRange);

  // Premium content filtering for non-premium users
  if (query.premium && userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { premium: true, admin: true }
    });
    if (!user?.premium && !user?.admin) {
      filters.premium = false;
    }
  } else if (!userId) {
    filters.premium = false;
  }

  // Get total count
  const total = await prisma.srefCode.count({ where: filters });

  // Calculate pagination
  const totalPages = Math.ceil(total / query.limit);
  const skip = (query.page - 1) * query.limit;

  // Fetch SREFs with related data
  const srefs = await prisma.srefCode.findMany({
    where: filters,
    orderBy,
    skip,
    take: query.limit,
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true
            }
          }
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        }
      },
      images: {
        orderBy: { imageOrder: 'asc' },
        select: {
          id: true,
          imageUrl: true,
          thumbnailUrl: true,
          imageOrder: true,
          altText: true,
          width: true,
          height: true,
          blurHash: true
        }
      },
      _count: {
        select: {
          userLikes: true,
          userFavorites: true,
          userDownloads: true
        }
      },
      ...(userId && {
        userLikes: {
          where: { userId },
          select: { userId: true }
        },
        userFavorites: {
          where: { userId },
          select: { userId: true }
        }
      })
    }
  });

  // Transform data for response
  const transformedSrefs = srefs.map(sref => ({
    id: sref.id,
    code: sref.code,
    title: sref.title,
    description: sref.description,
    slug: sref.slug,
    featured: sref.featured,
    premium: sref.premium,
    verified: sref.verified,
    popularityScore: sref.popularityScore,
    views: sref.views,
    likes: sref.likes,
    favorites: sref.favorites,
    downloads: sref.downloads,
    createdAt: sref.createdAt,
    updatedAt: sref.updatedAt,
    categories: sref.categories.map(sc => sc.category),
    tags: sref.tags.map(st => st.tag),
    images: sref.images,
    stats: {
      totalLikes: sref._count.userLikes,
      totalFavorites: sref._count.userFavorites,
      totalDownloads: sref._count.userDownloads
    },
    userInteractions: userId ? {
      liked: sref.userLikes?.length > 0,
      favorited: sref.userFavorites?.length > 0
    } : null
  }));

  const pagination = {
    page: query.page,
    limit: query.limit,
    total,
    totalPages
  };

  // Cache popular queries for 5 minutes
  if (query.sort === 'popularity' && !query.search) {
    await cache.set(cacheKey, { data: transformedSrefs, pagination }, 5 * 60);
  }

  sendPaginatedResponse(res, transformedSrefs, pagination);
}));

// GET /api/sref/:code
router.get('/:code', optionalAuthenticate, asyncHandler(async (req, res) => {
  const { code } = req.params;
  const userId = req.user?.id;

  if (!/^\d{8,12}$/.test(code)) {
    throw new ValidationError('Invalid SREF code format');
  }

  // Check cache first
  const cacheKey = `sref_detail:${code}:${userId || 'anonymous'}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    // Track view asynchronously
    if (userId) {
      prisma.srefAnalytic.create({
        data: {
          srefId: cached.id,
          eventType: 'VIEW',
          userId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      }).catch(() => {}); // Don't fail request if analytics fail
    }
    return sendSuccess(res, cached);
  }

  const sref = await prisma.srefCode.findUnique({
    where: { 
      code,
      status: 'ACTIVE'
    },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              icon: true,
              color: true
            }
          }
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              color: true
            }
          }
        }
      },
      images: {
        orderBy: { imageOrder: 'asc' },
        select: {
          id: true,
          imageUrl: true,
          thumbnailUrl: true,
          imageOrder: true,
          altText: true,
          width: true,
          height: true,
          blurHash: true,
          format: true,
          fileSize: true
        }
      },
      submittedBy: {
        select: {
          id: true,
          username: true,
          premium: true
        }
      },
      _count: {
        select: {
          userLikes: true,
          userFavorites: true,
          userDownloads: true
        }
      },
      ...(userId && {
        userLikes: {
          where: { userId },
          select: { userId: true }
        },
        userFavorites: {
          where: { userId },
          select: { userId: true }
        }
      })
    }
  });

  if (!sref) {
    throw new NotFoundError('SREF code not found');
  }

  // Check premium access
  if (sref.premium && userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { premium: true, admin: true }
    });
    if (!user?.premium && !user?.admin) {
      throw new ValidationError('Premium account required to access this SREF');
    }
  } else if (sref.premium && !userId) {
    throw new ValidationError('Authentication required to access premium content');
  }

  // Get related SREFs (same categories)
  const relatedSrefs = await prisma.srefCode.findMany({
    where: {
      id: { not: sref.id },
      status: 'ACTIVE',
      premium: userId ? undefined : false, // Only show free content to anonymous users
      categories: {
        some: {
          categoryId: {
            in: sref.categories.map(sc => sc.category.id)
          }
        }
      }
    },
    orderBy: { popularityScore: 'desc' },
    take: 8,
    select: {
      id: true,
      code: true,
      title: true,
      slug: true,
      featured: true,
      premium: true,
      popularityScore: true,
      views: true,
      images: {
        where: { imageOrder: 1 },
        select: {
          imageUrl: true,
          thumbnailUrl: true,
          blurHash: true
        },
        take: 1
      }
    }
  });

  // Track view
  await Promise.all([
    // Update view count
    prisma.srefCode.update({
      where: { id: sref.id },
      data: { views: { increment: 1 } }
    }),
    // Track analytics
    userId ? prisma.srefAnalytic.create({
      data: {
        srefId: sref.id,
        eventType: 'VIEW',
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    }) : null
  ].filter(Boolean));

  // Transform response data
  const response = {
    id: sref.id,
    code: sref.code,
    title: sref.title,
    description: sref.description,
    promptExamples: sref.promptExamples,
    slug: sref.slug,
    featured: sref.featured,
    premium: sref.premium,
    verified: sref.verified,
    popularityScore: sref.popularityScore,
    views: sref.views + 1, // Include the new view
    likes: sref.likes,
    favorites: sref.favorites,
    downloads: sref.downloads,
    metaDescription: sref.metaDescription,
    metaKeywords: sref.metaKeywords,
    createdAt: sref.createdAt,
    updatedAt: sref.updatedAt,
    categories: sref.categories.map(sc => sc.category),
    tags: sref.tags.map(st => st.tag),
    images: sref.images,
    submittedBy: sref.submittedBy,
    stats: {
      totalLikes: sref._count.userLikes,
      totalFavorites: sref._count.userFavorites,
      totalDownloads: sref._count.userDownloads
    },
    userInteractions: userId ? {
      liked: sref.userLikes?.length > 0,
      favorited: sref.userFavorites?.length > 0
    } : null,
    related: relatedSrefs
  };

  // Cache for 10 minutes
  await cache.set(cacheKey, response, 10 * 60);

  sendSuccess(res, response);
}));

// POST /api/sref (Admin only)
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const validatedData = createSrefSchema.parse(req.body);
  const userId = req.user!.id;

  // Check if SREF code already exists
  const existingSref = await prisma.srefCode.findUnique({
    where: { code: validatedData.code }
  });

  if (existingSref) {
    throw new ConflictError('SREF code already exists');
  }

  // Validate categories exist
  const categories = await prisma.category.findMany({
    where: { id: { in: validatedData.categoryIds } }
  });

  if (categories.length !== validatedData.categoryIds.length) {
    throw new ValidationError('One or more categories not found');
  }

  // Create or find tags
  const tagPromises = validatedData.tags?.map(async (tagName) => {
    return await prisma.tag.upsert({
      where: { name: tagName.toLowerCase() },
      update: {},
      create: {
        name: tagName.toLowerCase(),
        slug: tagName.toLowerCase().replace(/\s+/g, '-')
      }
    });
  }) || [];

  const tags = await Promise.all(tagPromises);

  // Generate slug
  const slug = `${validatedData.code}-${validatedData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)}`;

  // Create SREF
  const sref = await prisma.srefCode.create({
    data: {
      code: validatedData.code,
      title: validatedData.title,
      description: validatedData.description,
      promptExamples: validatedData.promptExamples || [],
      slug,
      featured: validatedData.featured,
      premium: validatedData.premium,
      verified: validatedData.verified,
      submittedById: userId,
      approvedById: userId,
      approvedAt: new Date(),
      categories: {
        create: validatedData.categoryIds.map(categoryId => ({
          categoryId
        }))
      },
      tags: {
        create: tags.map(tag => ({
          tagId: tag.id
        }))
      }
    },
    include: {
      categories: {
        include: { category: true }
      },
      tags: {
        include: { tag: true }
      }
    }
  });

  // Clear relevant caches
  await cache.del('sref_list:*');

  logger.info('SREF created', {
    srefId: sref.id,
    code: sref.code,
    title: sref.title,
    createdBy: userId
  });

  sendSuccess(res, {
    message: 'SREF created successfully',
    sref: {
      id: sref.id,
      code: sref.code,
      title: sref.title,
      description: sref.description,
      slug: sref.slug,
      featured: sref.featured,
      premium: sref.premium,
      verified: sref.verified,
      categories: sref.categories.map(sc => sc.category),
      tags: sref.tags.map(st => st.tag),
      createdAt: sref.createdAt
    }
  }, 201);
}));

export { router as srefRoutes };