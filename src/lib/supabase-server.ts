// Server-side Supabase utilities with enhanced MCP integration
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server client with service role (full access)
export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create client with user's auth from cookies
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  );
}

// Get authenticated user from session
export async function getAuthUser() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// Upload image to Supabase Storage
export async function uploadSrefImage(
  file: File,
  userId: string,
  srefId?: string
): Promise<{ url: string; path: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${srefId || 'temp'}_${Date.now()}.${fileExt}`;

  const { data, error } = await supabaseServer.storage
    .from('sref-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabaseServer.storage
    .from('sref-images')
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path
  };
}

// Delete image from Supabase Storage
export async function deleteSrefImage(path: string): Promise<void> {
  const { error } = await supabaseServer.storage
    .from('sref-images')
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

// SREF Code operations
export async function createSrefCode(data: {
  code: string;
  title: string;
  description?: string;
  promptExamples?: string[];
  imageUrl?: string;
  premium?: boolean;
  userId: string;
  categoryIds?: string[];
  tagIds?: string[];
}) {
  const { data: srefCode, error } = await supabaseServer
    .from('sref_codes')
    .insert({
      code: data.code,
      title: data.title,
      description: data.description,
      prompt_examples: data.promptExamples,
      image_url: data.imageUrl,
      premium: data.premium || false,
      user_id: data.userId,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (error) throw error;

  // Add categories
  if (data.categoryIds && data.categoryIds.length > 0) {
    await supabaseServer
      .from('category_sref')
      .insert(
        data.categoryIds.map(categoryId => ({
          category_id: categoryId,
          sref_code_id: srefCode.id
        }))
      );
  }

  // Add tags
  if (data.tagIds && data.tagIds.length > 0) {
    await supabaseServer
      .from('tag_sref')
      .insert(
        data.tagIds.map(tagId => ({
          tag_id: tagId,
          sref_code_id: srefCode.id
        }))
      );
  }

  return srefCode;
}

// Get SREF codes with filtering
export async function getSrefCodes(options: {
  page?: number;
  limit?: number;
  categoryId?: string;
  tagId?: string;
  featured?: boolean;
  premium?: boolean;
  userId?: string;
  search?: string;
}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabaseServer
    .from('sref_codes')
    .select(`
      *,
      user:users(id, name, username, avatar),
      categories:category_sref(category:categories(*)),
      tags:tag_sref(tag:tags(*)),
      images:sref_images(*)
    `, { count: 'exact' })
    .eq('status', 'ACTIVE')
    .is('deleted_at', null);

  if (options.categoryId) {
    query = query.contains('categories', [{ category_id: options.categoryId }]);
  }

  if (options.tagId) {
    query = query.contains('tags', [{ tag_id: options.tagId }]);
  }

  if (options.featured !== undefined) {
    query = query.eq('featured', options.featured);
  }

  if (options.premium !== undefined) {
    query = query.eq('premium', options.premium);
  }

  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options.search) {
    query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%,code.ilike.%${options.search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

// Get single SREF code by ID
export async function getSrefCodeById(id: string) {
  const { data, error } = await supabaseServer
    .from('sref_codes')
    .select(`
      *,
      user:users(id, name, username, avatar),
      categories:category_sref(category:categories(*)),
      tags:tag_sref(tag:tags(*)),
      images:sref_images(*),
      _count:sref_analytics(count)
    `)
    .eq('id', id)
    .eq('status', 'ACTIVE')
    .is('deleted_at', null)
    .single();

  if (error) throw error;

  return data;
}

// Increment view count
export async function incrementViewCount(srefId: string) {
  const { error } = await supabaseServer.rpc('increment_view_count', {
    sref_id: srefId
  });

  if (error) throw error;
}

// Like/Unlike SREF
export async function toggleLike(userId: string, srefId: string) {
  // Check if already liked
  const { data: existing } = await supabaseServer
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('sref_code_id', srefId)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabaseServer
      .from('likes')
      .delete()
      .eq('id', existing.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Get updated count
    const { count } = await supabaseServer
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('sref_code_id', srefId);

    return { success: true, liked: false, likeCount: count || 0 };
  } else {
    // Like
    const { error } = await supabaseServer
      .from('likes')
      .insert({
        user_id: userId,
        sref_code_id: srefId
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get updated count
    const { count } = await supabaseServer
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('sref_code_id', srefId);

    return { success: true, liked: true, likeCount: count || 0 };
  }
}

// Add/Remove favorite
export async function toggleFavorite(userId: string, srefId: string) {
  // Check if already favorited
  const { data: existing } = await supabaseServer
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('sref_code_id', srefId)
    .single();

  if (existing) {
    // Remove favorite
    const { error } = await supabaseServer
      .from('favorites')
      .delete()
      .eq('id', existing.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Get updated count
    const { count } = await supabaseServer
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('sref_code_id', srefId);

    return { success: true, favorited: false, favoriteCount: count || 0 };
  } else {
    // Add favorite
    const { error } = await supabaseServer
      .from('favorites')
      .insert({
        user_id: userId,
        sref_code_id: srefId
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get updated count
    const { count } = await supabaseServer
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('sref_code_id', srefId);

    return { success: true, favorited: true, favoriteCount: count || 0 };
  }
}

// Get user's favorites
export async function getUserFavorites(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseServer
    .from('favorites')
    .select(`
      id,
      created_at,
      sref_code:sref_codes(
        *,
        user:users(id, name, username, avatar),
        categories:category_sref(category:categories(*)),
        tags:tag_sref(tag:tags(*))
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

// Search SREF codes with full-text search
export async function searchSrefCodes(
  query: string,
  page = 1,
  limit = 20
) {
  const offset = (page - 1) * limit;

  const { data, error } = await supabaseServer.rpc('search_sref_codes', {
    search_query: query,
    limit_count: limit,
    offset_count: offset
  });

  if (error) throw error;

  return data;
}

// Analytics tracking
export async function trackAnalytics(data: {
  srefCodeId: string;
  eventType: 'VIEW' | 'LIKE' | 'FAVORITE' | 'SHARE' | 'DOWNLOAD' | 'COMMENT';
  userId?: string;
  metadata?: Record<string, any>;
}) {
  const { error } = await supabaseServer
    .from('sref_analytics')
    .insert({
      sref_code_id: data.srefCodeId,
      event_type: data.eventType,
      user_id: data.userId,
      metadata: data.metadata
    });

  if (error) throw error;
}
