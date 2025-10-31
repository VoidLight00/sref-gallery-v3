// API Route: /api/sref/[id] - Single SREF operations with Supabase
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer, incrementViewCount } from '@/lib/supabase-server';
import { z } from 'zod';

const updateSrefSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  promptExamples: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
  premium: z.boolean().optional(),
  featured: z.boolean().optional(),
});

// GET /api/sref/[id] - Get single SREF with view count increment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get SREF with all relations
    const { data: sref, error } = await supabaseServer
      .from('sref_codes')
      .select(`
        *,
        categories:sref_categories(
          category:categories(*)
        ),
        tags:sref_tags(
          tag:tags(*)
        ),
        images:sref_images(*)
        .order(image_order),
        submitted_by:users(
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq('id', id)
      .eq('status', 'ACTIVE')
      .is('deleted_at', null)
      .single();

    if (error || !sref) {
      return NextResponse.json(
        { error: 'SREF not found' },
        { status: 404 }
      );
    }

    // Increment view count asynchronously
    incrementViewCount(id).catch(console.error);

    // Transform response
    const transformedSref = {
      ...sref,
      categories: sref.categories?.map((sc: any) => sc.category) || [],
      tags: sref.tags?.map((st: any) => st.tag) || [],
      images: sref.images || [],
      submittedBy: sref.submitted_by,
    };

    return NextResponse.json({
      success: true,
      data: transformedSref,
    });
  } catch (error) {
    console.error('Error fetching SREF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/sref/[id] - Update SREF (owner only)
export async function PUT(
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

    const { id } = params;
    const body = await request.json();
    const validatedData = updateSrefSchema.parse(body);

    // Check if SREF exists and user is owner
    const { data: existingSref, error: fetchError } = await supabaseServer
      .from('sref_codes')
      .select('submitted_by_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingSref) {
      return NextResponse.json(
        { error: 'SREF not found' },
        { status: 404 }
      );
    }

    if (existingSref.submitted_by_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only edit your own SREFs' },
        { status: 403 }
      );
    }

    // Update SREF in transaction
    const { data: updatedSref, error: updateError } = await supabaseServer
      .from('sref_codes')
      .update({
        title: validatedData.title,
        description: validatedData.description,
        prompt_examples: validatedData.promptExamples,
        premium: validatedData.premium,
        featured: validatedData.featured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Update categories if provided
    if (validatedData.categoryIds) {
      // Delete existing categories
      await supabaseServer
        .from('sref_categories')
        .delete()
        .eq('sref_id', id);

      // Insert new categories
      if (validatedData.categoryIds.length > 0) {
        const { error: categoriesError } = await supabaseServer
          .from('sref_categories')
          .insert(
            validatedData.categoryIds.map((categoryId) => ({
              sref_id: id,
              category_id: categoryId,
            }))
          );

        if (categoriesError) throw categoriesError;
      }
    }

    // Update tags if provided
    if (validatedData.tagIds) {
      // Delete existing tags
      await supabaseServer
        .from('sref_tags')
        .delete()
        .eq('sref_id', id);

      // Insert new tags
      if (validatedData.tagIds.length > 0) {
        const { error: tagsError } = await supabaseServer
          .from('sref_tags')
          .insert(
            validatedData.tagIds.map((tagId) => ({
              sref_id: id,
              tag_id: tagId,
            }))
          );

        if (tagsError) throw tagsError;
      }
    }

    // Update images if provided
    if (validatedData.imageUrls) {
      // Delete existing images
      await supabaseServer
        .from('sref_images')
        .delete()
        .eq('sref_id', id);

      // Insert new images
      if (validatedData.imageUrls.length > 0) {
        const { error: imagesError } = await supabaseServer
          .from('sref_images')
          .insert(
            validatedData.imageUrls.map((imageUrl, index) => ({
              sref_id: id,
              image_url: imageUrl,
              image_order: index + 1,
              alt_text: `${validatedData.title || 'Image'} - ${index + 1}`,
            }))
          );

        if (imagesError) throw imagesError;
      }
    }

    // Fetch updated SREF with all relations
    const { data: fullSref } = await supabaseServer
      .from('sref_codes')
      .select(`
        *,
        categories:sref_categories(
          category:categories(*)
        ),
        tags:sref_tags(
          tag:tags(*)
        ),
        images:sref_images(*).order(image_order),
        submitted_by:users(
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    // Transform response
    const transformedSref = {
      ...fullSref,
      categories: fullSref?.categories?.map((sc: any) => sc.category) || [],
      tags: fullSref?.tags?.map((st: any) => st.tag) || [],
      images: fullSref?.images || [],
      submittedBy: fullSref?.submitted_by,
    };

    return NextResponse.json({
      success: true,
      data: transformedSref,
      message: 'SREF updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating SREF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sref/[id] - Soft delete SREF (owner only)
export async function DELETE(
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

    const { id } = params;

    // Check if SREF exists and user is owner
    const { data: existingSref, error: fetchError } = await supabaseServer
      .from('sref_codes')
      .select('submitted_by_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingSref) {
      return NextResponse.json(
        { error: 'SREF not found' },
        { status: 404 }
      );
    }

    if (existingSref.submitted_by_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own SREFs' },
        { status: 403 }
      );
    }

    // Soft delete by setting status and deleted_at
    const { error: deleteError } = await supabaseServer
      .from('sref_codes')
      .update({
        status: 'DELETED',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'SREF deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting SREF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
