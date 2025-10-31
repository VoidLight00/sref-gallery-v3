import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tags - Get all tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const featured = searchParams.get('featured') === 'true';
    const popular = searchParams.get('popular') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    const where: any = {};
    
    if (featured) {
      where.featured = true;
    }
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    let orderBy: any = { name: 'asc' };
    
    if (popular) {
      orderBy = { usageCount: 'desc' };
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: [
        ...(featured ? [{ featured: 'desc' }] : []),
        orderBy,
      ],
      take: Math.min(limit, 200),
    });

    return NextResponse.json({
      data: tags,
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}