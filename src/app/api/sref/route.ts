// API Route: /api/sref - SREF codes management with Supabase
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase-server';
import { createSrefCode, getSrefCodes } from '@/lib/supabase-server';
import { z } from 'zod';

const createSrefSchema = z.object({
  code: z.string().min(1).max(20),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  promptExamples: z.array(z.string()).optional().default([]),
  categoryIds: z.array(z.string()).optional().default([]),
  tagIds: z.array(z.string()).optional().default([]),
  imageUrls: z.array(z.string()).optional().default([]),
  premium: z.boolean().optional().default(false),
});

// GET /api/sref - Get all SREFs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Filters
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const status = searchParams.get('status') || 'ACTIVE';
    const featured = searchParams.get('featured') === 'true';
    const premium = searchParams.get('premium') === 'true';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('order') || 'desc';

    // Build where clause
    const where: any = {
      status,
    };

    if (featured) where.featured = true;
    if (premium) where.premium = true;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag,
          },
        },
      };
    }

    // Get SREFs with related data
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
            orderBy: { id: 'asc' },
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              likes: true,
              favorites: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: offset,
        take: limit,
      }),
      prisma.srefCode.count({ where }),
    ]);

    // Transform data for response
    const transformedSrefs = srefs.map((sref) => ({
      ...sref,
      categories: sref.categories.map((sc) => sc.category),
      tags: sref.tags.map((st) => st.tag),
      stats: {
        likes: sref._count.userLikes,
        favorites: sref._count.userFavorites,
        downloads: sref._count.userDownloads,
      },
    }));

    return NextResponse.json({
      data: transformedSrefs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching SREFs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sref - Create new SREF
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createSrefSchema.parse(body);

    // Check if code already exists
    const existingSref = await prisma.srefCode.findUnique({
      where: { code: validatedData.code },
    });

    if (existingSref) {
      return NextResponse.json(
        { error: 'SREF code already exists' },
        { status: 409 }
      );
    }

    // Create slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists and make it unique
    let uniqueSlug = slug;
    let counter = 1;
    while (await prisma.srefCode.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create SREF in transaction
    const sref = await prisma.$transaction(async (tx) => {
      // Create the main SREF record
      const newSref = await tx.srefCode.create({
        data: {
          code: validatedData.code,
          title: validatedData.title,
          description: validatedData.description,
          promptExamples: validatedData.promptExamples,
          premium: validatedData.premium,
          slug: uniqueSlug,
          submittedById: session.user.id,
          status: 'PENDING', // New SREFs need approval
        },
      });

      // Add categories
      if (validatedData.categoryIds.length > 0) {
        await tx.srefCategory.createMany({
          data: validatedData.categoryIds.map((categoryId) => ({
            srefId: newSref.id,
            categoryId,
          })),
        });
      }

      // Add tags
      if (validatedData.tagIds.length > 0) {
        await tx.srefTag.createMany({
          data: validatedData.tagIds.map((tagId) => ({
            srefId: newSref.id,
            tagId,
          })),
        });
      }

      // Add images
      if (validatedData.imageUrls.length > 0) {
        await tx.srefImage.createMany({
          data: validatedData.imageUrls.map((imageUrl, index) => ({
            srefId: newSref.id,
            imageUrl,
            imageOrder: index + 1,
            altText: `${validatedData.title} - Image ${index + 1}`,
          })),
        });
      }

      return newSref;
    });

    // Fetch the created SREF with all relations
    const fullSref = await prisma.srefCode.findUnique({
      where: { id: sref.id },
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
      },
    });

    // Transform response
    const transformedSref = {
      ...fullSref,
      categories: fullSref!.categories.map((sc) => sc.category),
      tags: fullSref!.tags.map((st) => st.tag),
    };

    return NextResponse.json(
      { data: transformedSref, message: 'SREF created successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating SREF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}