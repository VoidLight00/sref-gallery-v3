import { Router } from 'express';
import { z } from 'zod';
import { prisma, cache } from '../../lib/database/config';
import { asyncHandler, sendSuccess } from '../middleware/errorHandler';

const router = Router();

const tagsQuerySchema = z.object({
  popular: z.coerce.boolean().default(false),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

// GET /api/tags
router.get('/', asyncHandler(async (req, res) => {
  const { popular, search, limit } = tagsQuerySchema.parse(req.query);
  
  const cacheKey = `tags:${popular}:${search || 'all'}:${limit}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return sendSuccess(res, cached);
  }

  const where: any = {};
  
  if (popular) {
    where.usageCount = { gt: 0 };
  }
  
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const tags = await prisma.tag.findMany({
    where,
    orderBy: popular 
      ? [{ usageCount: 'desc' }, { name: 'asc' }]
      : [{ name: 'asc' }],
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
      usageCount: true,
      featured: true
    }
  });

  await cache.set(cacheKey, tags, 15 * 60); // 15 minutes
  sendSuccess(res, tags);
}));

export { router as tagRoutes };