import { Router } from 'express';
import { z } from 'zod';
import { prisma, cache } from '../../lib/database/config';
import { asyncHandler, sendSuccess } from '../middleware/errorHandler';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

const categoryQuerySchema = z.object({
  featured: z.coerce.boolean().optional(),
  includeCount: z.coerce.boolean().default(true)
});

const srefByCategorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['popularity', 'newest', 'views', 'likes']).default('popularity')
});

// GET /api/categories
router.get('/', asyncHandler(async (req, res) => {
  const { featured, includeCount } = categoryQuerySchema.parse(req.query);
  
  const cacheKey = `categories:${featured || 'all'}:${includeCount}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return sendSuccess(res, cached);
  }

  const categories = await prisma.category.findMany({
    where: featured !== undefined ? { featured } : undefined,
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      color: true,
      featured: true,
      srefCount: includeCount
    }
  });

  const response = {
    categories,
    featured: categories.filter(c => c.featured)
  };

  await cache.set(cacheKey, response, 30 * 60); // 30 minutes
  sendSuccess(res, response);
}));

// GET /api/categories/:slug/sref
router.get('/:slug/sref', optionalAuthenticate, asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { page, limit, sort } = srefByCategorySchema.parse(req.query);
  
  const category = await prisma.category.findUnique({
    where: { slug }
  });

  if (!category) {
    return sendSuccess(res, { results: [], category: null, pagination: { page, limit, total: 0, totalPages: 0 } });
  }

  // Use existing SREF filtering logic
  const filters = {
    status: 'ACTIVE' as const,
    premium: req.user ? undefined : false,
    categories: {
      some: { categoryId: category.id }
    }
  };

  const total = await prisma.srefCode.count({ where: filters });
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  let orderBy;
  switch (sort) {
    case 'newest': orderBy = [{ createdAt: 'desc' }]; break;
    case 'views': orderBy = [{ views: 'desc' }]; break;
    case 'likes': orderBy = [{ likes: 'desc' }]; break;
    default: orderBy = [{ popularityScore: 'desc' }];
  }

  const srefs = await prisma.srefCode.findMany({
    where: filters,
    orderBy,
    skip,
    take: limit,
    include: {
      categories: {
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true, color: true }
          }
        }
      },
      tags: {
        include: {
          tag: {
            select: { id: true, name: true, slug: true, color: true }
          }
        }
      },
      images: {
        where: { imageOrder: 1 },
        select: {
          imageUrl: true,
          thumbnailUrl: true,
          blurHash: true,
          width: true,
          height: true
        },
        take: 1
      }
    }
  });

  sendSuccess(res, {
    results: srefs.map(sref => ({
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
      categories: sref.categories.map(sc => sc.category),
      tags: sref.tags.map(st => st.tag),
      images: sref.images
    })),
    category,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
}));

export { router as categoryRoutes };