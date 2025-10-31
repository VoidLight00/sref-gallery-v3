// API Route: /api/sref/[id]/favorite - Favorite/Unfavorite SREF with Supabase
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { toggleFavorite } from '@/lib/supabase-server';

// POST /api/sref/[id]/favorite - Toggle favorite for SREF
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: srefId } = params;
    const userId = session.user.id;

    // Toggle favorite using server utility
    const result = await toggleFavorite(userId, srefId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to toggle favorite' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        favorited: result.favorited,
        favoriteCount: result.favoriteCount,
      },
      message: result.favorited
        ? 'SREF added to favorites successfully'
        : 'SREF removed from favorites successfully',
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/sref/[id]/favorite - Check if user has favorited SREF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: true, data: { favorited: false } }
      );
    }

    const { id: srefId } = params;
    const userId = session.user.id;

    // Check favorite status
    const { supabaseServer } = await import('@/lib/supabase-server');
    const { data: favorite, error } = await supabaseServer
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('sref_code_id', srefId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error - it's expected
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        favorited: !!favorite,
      },
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
