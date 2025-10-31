import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(6).optional(),
});

// GET /api/user/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        premium: true,
        admin: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
        loginCount: true,
        status: true,
        _count: {
          select: {
            submittedSrefs: true,
            favorites: true,
            likes: true,
            downloads: true,
            collections: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's recent activity
    const [recentFavorites, recentLikes, recentSubmissions] = await Promise.all([
      prisma.userFavorite.findMany({
        where: { userId: user.id },
        include: {
          sref: {
            select: {
              id: true,
              code: true,
              title: true,
              images: {
                take: 1,
                orderBy: { imageOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.userLike.findMany({
        where: { userId: user.id },
        include: {
          sref: {
            select: {
              id: true,
              code: true,
              title: true,
              images: {
                take: 1,
                orderBy: { imageOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.srefCode.findMany({
        where: { submittedById: user.id },
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          views: true,
          likes: true,
          favorites: true,
          downloads: true,
          createdAt: true,
          images: {
            take: 1,
            orderBy: { imageOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const profile = {
      ...user,
      stats: user._count,
      recentActivity: {
        favorites: recentFavorites.map(f => f.sref),
        likes: recentLikes.map(l => l.sref),
        submissions: recentSubmissions,
      },
    };

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if username is already taken
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          NOT: { id: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        );
      }
    }

    // Handle password change
    let hashedNewPassword: string | undefined;
    if (validatedData.currentPassword && validatedData.newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);
    }

    // Update user profile
    const updateData: any = {};
    
    if (validatedData.username) updateData.username = validatedData.username;
    if (validatedData.firstName !== undefined) updateData.firstName = validatedData.firstName;
    if (validatedData.lastName !== undefined) updateData.lastName = validatedData.lastName;
    if (validatedData.avatarUrl) updateData.avatarUrl = validatedData.avatarUrl;
    if (hashedNewPassword) updateData.passwordHash = hashedNewPassword;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        premium: true,
        admin: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
        loginCount: true,
        status: true,
      },
    });

    return NextResponse.json({
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/profile - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const confirmDelete = searchParams.get('confirm') === 'true';

    if (!confirmDelete) {
      return NextResponse.json(
        { error: 'Account deletion must be confirmed with ?confirm=true' },
        { status: 400 }
      );
    }

    // Soft delete: Set status to DELETED instead of actual deletion
    // This preserves data integrity for submitted SREFs
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        status: 'DELETED',
        email: `deleted_${session.user.id}@deleted.com`, // Anonymize email
        username: `deleted_${session.user.id}`,
        firstName: null,
        lastName: null,
        avatarUrl: null,
      },
    });

    return NextResponse.json({
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}