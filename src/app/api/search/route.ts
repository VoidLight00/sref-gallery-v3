import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/search - Search SREFs, categories, and tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Search parameters
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'all', 'srefs', 'categories', 'tags'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    // Filters
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const featured = searchParams.get('featured') === 'true';
    const premium = searchParams.get('premium') === 'true';
    const sortBy = searchParams.get('sort') || 'relevance';
    const sortOrder = searchParams.get('order') || 'desc';

    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    // Record search analytics
    if (session?.user || request.ip) {
      await prisma.searchAnalytic.create({
        data: {
          query,
          filters: {
            type,
            category,
            tag,
            featured,
            premium,
            sortBy,
            sortOrder,
          },
          userId: session?.user?.id,
          ipAddress: request.ip || request.headers.get('x-forwarded-for'),
        },
      });
    }

    let results: any = {};

    if (type === 'all' || type === 'srefs') {
      // Search SREFs
      const srefWhere: any = {
        status: 'ACTIVE',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { promptExamples: { has: query } },
        ],
      };

      if (featured) srefWhere.featured = true;
      if (premium) srefWhere.premium = true;

      if (category) {
        srefWhere.categories = {
          some: {
            category: {
              slug: category,
            },
          },
        };
      }

      if (tag) {
        srefWhere.tags = {
          some: {
            tag: {
              slug: tag,
            },
          },
        };
      }

      // Determine ordering
      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'popularity') {
        orderBy = { popularityScore: 'desc' };
      } else if (sortBy === 'views') {
        orderBy = { views: 'desc' };
      } else if (sortBy === 'likes') {
        orderBy = { likes: 'desc' };
      } else if (sortBy === 'favorites') {
        orderBy = { favorites: 'desc' };
      } else if (sortBy === 'title') {
        orderBy = { title: sortOrder };
      }

      const [srefs, srefTotal] = await Promise.all([
        prisma.srefCode.findMany({
          where: srefWhere,
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
            images: {
              orderBy: { imageOrder: 'asc' },
              take: 1, // Only first image for search results
            },
            submittedBy: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                userLikes: true,
                userFavorites: true,
                userDownloads: true,
              },
            },
          },
          orderBy,
          skip: offset,
          take: limit,
        }),
        prisma.srefCode.count({ where: srefWhere }),
      ]);

      results.srefs = {
        data: srefs.map((sref) => ({
          ...sref,
          categories: sref.categories.map((sc) => sc.category),
          tags: sref.tags.map((st) => st.tag),
          stats: {
            likes: sref._count.userLikes,
            favorites: sref._count.userFavorites,
            downloads: sref._count.userDownloads,
          },
        })),
        pagination: {
          page,
          limit,
          total: srefTotal,
          totalPages: Math.ceil(srefTotal / limit),
          hasNext: page < Math.ceil(srefTotal / limit),
          hasPrev: page > 1,
        },
      };
    }

    if (type === 'all' || type === 'categories') {
      // Search Categories
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          _count: {
            select: {
              srefCodes: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: type === 'categories' ? limit : 10,
      });

      results.categories = {
        data: categories.map((cat) => ({
          ...cat,
          srefCount: cat._count.srefCodes,
        })),
        total: categories.length,
      };
    }

    if (type === 'all' || type === 'tags') {
      // Search Tags
      const tags = await prisma.tag.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { usageCount: 'desc' },
        take: type === 'tags' ? limit : 10,
      });

      results.tags = {
        data: tags,
        total: tags.length,
      };
    }

    // Update search analytics with results count
    const totalResults = 
      (results.srefs?.pagination?.total || 0) +
      (results.categories?.total || 0) +
      (results.tags?.total || 0);

    // Add related suggestions if results are limited
    if (type === 'all' && totalResults < 10) {
      const suggestions = await getSearchSuggestions(query);
      results.suggestions = suggestions;
    }

    return NextResponse.json({
      query,
      type,
      results,
      totalResults,
    });
  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/search - Advanced search with complex filters
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      query = '',
      categories = [],
      tags = [],
      dateRange,
      popularityRange,
      viewsRange,
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      includeUserData = false,
    } = body;

    const offset = (page - 1) * Math.min(limit, 100);

    // Build complex where clause
    const where: any = {
      status: 'ACTIVE',
    };

    if (query.trim()) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
        { promptExamples: { has: query } },
      ];
    }

    if (categories.length > 0) {
      where.categories = {
        some: {
          category: {
            slug: { in: categories },
          },
        },
      };
    }

    if (tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            slug: { in: tags },
          },
        },
      };
    }

    if (dateRange) {
      where.createdAt = {};
      if (dateRange.from) where.createdAt.gte = new Date(dateRange.from);
      if (dateRange.to) where.createdAt.lte = new Date(dateRange.to);
    }

    if (popularityRange) {
      where.popularityScore = {};
      if (popularityRange.min) where.popularityScore.gte = popularityRange.min;
      if (popularityRange.max) where.popularityScore.lte = popularityRange.max;
    }

    if (viewsRange) {
      where.views = {};
      if (viewsRange.min) where.views.gte = viewsRange.min;
      if (viewsRange.max) where.views.lte = viewsRange.max;
    }

    // Determine ordering
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'popularity') {
      orderBy = { popularityScore: 'desc' };
    } else if (sortBy === 'views') {
      orderBy = { views: 'desc' };
    } else if (sortBy === 'likes') {
      orderBy = { likes: 'desc' };
    } else if (sortBy === 'favorites') {
      orderBy = { favorites: 'desc' };
    } else if (sortBy === 'title') {
      orderBy = { title: sortOrder };
    }

    const [srefs, total] = await Promise.all([
      prisma.srefCode.findMany({
        where,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          images: {
            orderBy: { imageOrder: 'asc' },
          },
          submittedBy: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              userLikes: true,
              userFavorites: true,
              userDownloads: true,
            },
          },
          // Include user interaction data if requested and user is authenticated
          ...(includeUserData && session?.user ? {
            userLikes: {
              where: { userId: session.user.id },
              select: { createdAt: true },
            },
            userFavorites: {
              where: { userId: session.user.id },
              select: { createdAt: true },
            },
          } : {}),
        },
        orderBy,
        skip: offset,
        take: Math.min(limit, 100),
      }),
      prisma.srefCode.count({ where }),
    ]);

    // Transform results
    const transformedSrefs = srefs.map((sref: any) => ({
      ...sref,
      categories: sref.categories.map((sc: any) => sc.category),
      tags: sref.tags.map((st: any) => st.tag),
      stats: {
        likes: sref._count.userLikes,
        favorites: sref._count.userFavorites,
        downloads: sref._count.userDownloads,
      },
      userInteractions: includeUserData && session?.user ? {
        liked: sref.userLikes?.length > 0,
        favorited: sref.userFavorites?.length > 0,
      } : undefined,
    }));

    // Record search analytics
    if (session?.user || request.ip) {
      await prisma.searchAnalytic.create({
        data: {
          query,
          filters: body,
          resultsCount: total,
          userId: session?.user?.id,
          ipAddress: request.ip || request.headers.get('x-forwarded-for'),
        },
      });
    }

    return NextResponse.json({
      data: transformedSrefs,
      pagination: {
        page,
        limit: Math.min(limit, 100),
        total,
        totalPages: Math.ceil(total / Math.min(limit, 100)),
        hasNext: page < Math.ceil(total / Math.min(limit, 100)),
        hasPrev: page > 1,
      },
      filters: {
        query,
        categories,
        tags,
        dateRange,
        popularityRange,
        viewsRange,
      },
    });
  } catch (error) {
    console.error('Error performing advanced search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get search suggestions
async function getSearchSuggestions(query: string) {
  try {
    // Get popular SREFs that might be related
    const popularSrefs = await prisma.srefCode.findMany({
      where: {
        status: 'ACTIVE',
        popularityScore: { gt: 0 },
      },
      select: {
        code: true,
        title: true,
        popularityScore: true,
      },
      orderBy: { popularityScore: 'desc' },
      take: 5,
    });

    // Get popular categories
    const popularCategories = await prisma.category.findMany({
      where: {
        srefCount: { gt: 0 },
      },
      select: {
        name: true,
        slug: true,
        srefCount: true,
      },
      orderBy: { srefCount: 'desc' },
      take: 5,
    });

    // Get popular tags
    const popularTags = await prisma.tag.findMany({
      where: {
        usageCount: { gt: 0 },
      },
      select: {
        name: true,
        slug: true,
        usageCount: true,
      },
      orderBy: { usageCount: 'desc' },
      take: 5,
    });

    return {
      popular: popularSrefs,
      categories: popularCategories,
      tags: popularTags,
    };
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return {};
  }
}