import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  sort: z.enum(['newest', 'popular', 'likes']).default('newest'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const { page, limit, sort } = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
    });

    // Convert page/limit to skip/take
    const skip = (page - 1) * limit;
    const take = limit;

    // Get category by slug
    const category = await prisma.category.findUnique({
      where: { slug: slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        color: true,
        _count: {
          select: { srefCodes: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build orderBy based on sort parameter
    let orderBy: any = { createdAt: 'desc' }; // default: newest
    
    if (sort === 'popular') {
      orderBy = [
        { likeCount: 'desc' },
        { favoriteCount: 'desc' },
        { createdAt: 'desc' }
      ];
    } else if (sort === 'likes') {
      orderBy = { likeCount: 'desc' };
    }

    // Get SREFs for this category through junction table
    const srefCodes = await prisma.srefCode.findMany({
      where: {
        categories: {
          some: {
            category: {
              id: category.id
            }
          }
        },
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
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
                name: true
              }
            }
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true
          },
          take: 1,
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy,
      skip,
      take
    });

    // Transform the data to match expected format
    const transformedSREFs = srefCodes.map(sref => ({
      id: sref.id,
      code: sref.code,
      title: sref.title,
      description: sref.description || '',
      imageUrl: sref.images[0]?.url || `/images/sref/${sref.code}.webp`,
      images: sref.images?.length > 0 
        ? sref.images.map(img => img.url) 
        : [
            `/images/sref/${sref.code}-1.webp`,
            `/images/sref/${sref.code}-2.webp`,
            `/images/sref/${sref.code}-3.webp`,
            `/images/sref/${sref.code}-4.webp`
          ],
      promptExamples: sref.promptExamples ? JSON.parse(sref.promptExamples) : [],
      featured: sref.featured,
      premium: sref.premium,
      likes: sref.likeCount,
      views: sref.viewCount,
      favorites: sref.favoriteCount,
      category: sref.categories[0]?.category?.name || 'Uncategorized',
      categories: sref.categories.map(catRel => ({
        id: catRel.category.id,
        name: catRel.category.name,
        slug: catRel.category.slug,
        color: catRel.category.color
      })),
      tags: sref.tags?.map(tagRel => tagRel.tag.name) || [],
      createdAt: sref.createdAt.toISOString(),
      user: sref.user ? {
        id: sref.user.id,
        name: sref.user.name || 'Anonymous',
        avatar: sref.user.image || '/avatars/default.jpg'
      } : undefined
    }));

    const response = {
      success: true,
      data: transformedSREFs,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        color: category.color,
        count: category._count.srefCodes
      },
      pagination: {
        page,
        limit,
        total: category._count.srefCodes,
        hasMore: skip + take < category._count.srefCodes,
        totalPages: Math.ceil(category._count.srefCodes / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Category API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}