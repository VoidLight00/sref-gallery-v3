import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for server-side operations with full access
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to get user from session
export async function getUser(accessToken: string) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// Helper function for file uploads
export async function uploadImage(file: File, bucket: string = 'sref-images') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}