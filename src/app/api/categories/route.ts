import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const featured = searchParams.get('featured') === 'true';
    const withCounts = searchParams.get('counts') === 'true';
    const parentId = searchParams.get('parent');

    const where: any = {};
    
    if (featured) {
      where.featured = true;
    }
    
    if (parentId) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        ...(withCounts && {
          _count: {
            select: {
              srefCodes: true,
            },
          },
        }),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    const transformedCategories = categories.map((category) => ({
      ...category,
      srefCount: withCounts ? category._count?.srefCodes || 0 : 0,
    }));

    return NextResponse.json({
      data: transformedCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}