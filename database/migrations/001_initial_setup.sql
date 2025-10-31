-- Initial Supabase Setup Script
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sref_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sref_images ENABLE ROW LEVEL SECURITY;

-- Create Storage Bucket for SREF images
INSERT INTO storage.buckets (id, name, public)
VALUES ('sref-images', 'sref-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sref-images bucket
CREATE POLICY "Public can view SREF images"
ON storage.objects FOR SELECT
USING (bucket_id = 'sref-images');

CREATE POLICY "Authenticated users can upload SREF images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sref-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own SREF images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sref-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own SREF images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sref-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for users table
CREATE POLICY "Public can view active users"
ON users FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id::text);

-- RLS Policies for sref_codes table
CREATE POLICY "Public can view active SREF codes"
ON sref_codes FOR SELECT
USING (
  status = 'ACTIVE'
  AND deleted_at IS NULL
  AND (
    premium = false
    OR auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Authenticated users can create SREF codes"
ON sref_codes FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own SREF codes"
ON sref_codes FOR UPDATE
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own SREF codes"
ON sref_codes FOR DELETE
USING (auth.uid()::text = user_id::text);

-- RLS Policies for likes
CREATE POLICY "Public can view likes"
ON likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create likes"
ON likes FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid()::text = user_id::text);

-- RLS Policies for favorites
CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Authenticated users can create favorites"
ON favorites FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own favorites"
ON favorites FOR DELETE
USING (auth.uid()::text = user_id::text);

-- RLS Policies for comments
CREATE POLICY "Public can view active comments"
ON comments FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (auth.uid()::text = user_id::text);

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Public can view active categories"
ON categories FOR SELECT
USING (is_active = true);

-- RLS Policies for tags (public read, admin write)
CREATE POLICY "Public can view tags"
ON tags FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sref_codes_featured ON sref_codes(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_sref_codes_premium ON sref_codes(premium) WHERE premium = true;
CREATE INDEX IF NOT EXISTS idx_sref_codes_created ON sref_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sref_codes_status ON sref_codes(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_sref ON comments(sref_code_id);

-- Create function to update view count
CREATE OR REPLACE FUNCTION increment_view_count(sref_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE sref_codes
  SET view_count = view_count + 1
  WHERE id = sref_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update like count
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sref_codes
    SET like_count = like_count + 1
    WHERE id = NEW.sref_code_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sref_codes
    SET like_count = like_count - 1
    WHERE id = OLD.sref_code_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for like count
CREATE TRIGGER update_sref_like_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_like_count();

-- Create function to update favorite count
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sref_codes
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.sref_code_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sref_codes
    SET favorite_count = favorite_count - 1
    WHERE id = OLD.sref_code_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for favorite count
CREATE TRIGGER update_sref_favorite_count
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW
EXECUTE FUNCTION update_favorite_count();

-- Create function to update comment count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sref_codes
    SET comment_count = comment_count + 1
    WHERE id = NEW.sref_code_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sref_codes
    SET comment_count = comment_count - 1
    WHERE id = OLD.sref_code_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment count
CREATE TRIGGER update_sref_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_count();

-- Create function for full-text search
CREATE OR REPLACE FUNCTION search_sref_codes(
  search_query TEXT,
  limit_count INT DEFAULT 20,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  title TEXT,
  description TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.code,
    sc.title,
    sc.description,
    ts_rank(
      to_tsvector('english',
        sc.title || ' ' ||
        COALESCE(sc.description, '') || ' ' ||
        sc.code
      ),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM sref_codes sc
  WHERE
    sc.status = 'ACTIVE'
    AND sc.deleted_at IS NULL
    AND (
      to_tsvector('english',
        sc.title || ' ' ||
        COALESCE(sc.description, '') || ' ' ||
        sc.code
      ) @@ plainto_tsquery('english', search_query)
    )
  ORDER BY rank DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Seed default categories
INSERT INTO categories (name, slug, description, icon, color, sort_order, is_active)
VALUES
  ('Anime', 'anime', 'Anime and manga style references', '🎨', '#FF6B9D', 1, true),
  ('Photography', 'photography', 'Photographic style references', '📷', '#4ECDC4', 2, true),
  ('Cartoon', 'cartoon', 'Cartoon and comic style references', '🎭', '#FFD93D', 3, true),
  ('Surrealistic', 'surrealistic', 'Surreal and abstract art references', '🌈', '#6C5CE7', 4, true),
  ('3D', '3d', '3D rendered style references', '🎲', '#00B894', 5, true),
  ('2D', '2d', '2D flat design references', '🖼️', '#FD79A8', 6, true),
  ('Manga', 'manga', 'Japanese manga style references', '📚', '#FF7675', 7, true),
  ('Vector', 'vector', 'Vector art style references', '✏️', '#A29BFE', 8, true)
ON CONFLICT (slug) DO NOTHING;

-- Create realtime publication for live updates
CREATE PUBLICATION sref_changes FOR TABLE
  sref_codes,
  likes,
  favorites,
  comments
WHERE (status = 'ACTIVE');

COMMIT;
