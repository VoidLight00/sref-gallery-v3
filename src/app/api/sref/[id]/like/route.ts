// API Route: /api/sref/[id]/like - Like/Unlike SREF with Supabase
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { toggleLike } from '@/lib/supabase-server';

// POST /api/sref/[id]/like - Toggle like for SREF
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

    // Toggle like using server utility
    const result = await toggleLike(userId, srefId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to toggle like' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        liked: result.liked,
        likeCount: result.likeCount,
      },
      message: result.liked ? 'SREF liked successfully' : 'Like removed successfully',
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/sref/[id]/like - Check if user has liked SREF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: true, data: { liked: false } }
      );
    }

    const { id: srefId } = params;
    const userId = session.user.id;

    // Check like status
    const { supabaseServer } = await import('@/lib/supabase-server');
    const { data: like, error } = await supabaseServer
      .from('likes')
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
        liked: !!like,
      },
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
