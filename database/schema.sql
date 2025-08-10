-- SREF Gallery V3 - Production Database Schema
-- PostgreSQL 15+ Required

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search performance

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    premium BOOLEAN DEFAULT FALSE,
    admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

-- SREF Codes Core Table
CREATE TABLE sref_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL, -- Midjourney SREF code like "1747943467"
    title VARCHAR(255) NOT NULL,
    description TEXT,
    prompt_examples TEXT[], -- Array of example prompts
    
    -- Metrics
    popularity_score INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    
    -- Status and Flags
    featured BOOLEAN DEFAULT FALSE,
    premium BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE, -- Verified to work well
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'disabled', 'reported')),
    
    -- SEO and Meta
    slug VARCHAR(255) UNIQUE, -- For SEO-friendly URLs
    meta_description TEXT,
    meta_keywords TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    featured_at TIMESTAMP,
    
    -- User who submitted (optional)
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Admin who approved
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10), -- Emoji or icon identifier
    color VARCHAR(7), -- Hex color code
    featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- For subcategories
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    sref_count INTEGER DEFAULT 0 -- Cached count for performance
);

-- Many-to-many relationship for SREF-Categories
CREATE TABLE sref_categories (
    sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (sref_id, category_id)
);

-- Tags System
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color for tag display
    usage_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sref_tags (
    sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (sref_id, tag_id)
);

-- Image Management
CREATE TABLE sref_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    image_order INTEGER DEFAULT 1 CHECK (image_order >= 1 AND image_order <= 4), -- 1-4 for the 4 images
    alt_text VARCHAR(255),
    width INTEGER,
    height INTEGER,
    file_size INTEGER, -- in bytes
    format VARCHAR(10), -- webp, jpg, png
    blur_hash VARCHAR(50), -- For progressive loading
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- CDN and processing info
    s3_key TEXT, -- S3 object key
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT
);

-- User Interactions
CREATE TABLE user_favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, sref_id)
);

CREATE TABLE user_likes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, sref_id)
);

CREATE TABLE user_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
    download_type VARCHAR(20) DEFAULT 'images' CHECK (download_type IN ('images', 'prompts', 'all')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Collections (User-created lists)
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255), -- For public collections
    is_public BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, slug) -- Slug unique per user
);

CREATE TABLE collection_items (
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (collection_id, sref_id)
);

-- Analytics and Tracking
CREATE TABLE sref_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'like', 'unlike', 'favorite', 'unfavorite', 'download', 'share', 'copy')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous users
    session_id VARCHAR(255), -- For anonymous tracking
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2), -- ISO country code
    created_at TIMESTAMP DEFAULT NOW()
);

-- Page/Route analytics
CREATE TABLE page_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    load_time INTEGER, -- Page load time in ms
    created_at TIMESTAMP DEFAULT NOW()
);

-- Search queries for analytics
CREATE TABLE search_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    filters JSONB, -- Store filter parameters as JSON
    results_count INTEGER,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reports and moderation
CREATE TABLE sref_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('inappropriate', 'copyright', 'broken', 'duplicate', 'spam', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    resolution TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB, -- Additional data as JSON
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- API Keys for external integrations
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions TEXT[] DEFAULT '{"read"}', -- Array of permissions
    rate_limit INTEGER DEFAULT 1000, -- Requests per hour
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- SREF Codes indexes
CREATE INDEX idx_sref_codes_status ON sref_codes(status);
CREATE INDEX idx_sref_codes_featured ON sref_codes(featured) WHERE featured = TRUE;
CREATE INDEX idx_sref_codes_premium ON sref_codes(premium) WHERE premium = TRUE;
CREATE INDEX idx_sref_codes_popularity ON sref_codes(popularity_score DESC);
CREATE INDEX idx_sref_codes_views ON sref_codes(views DESC);
CREATE INDEX idx_sref_codes_created_at ON sref_codes(created_at DESC);
CREATE INDEX idx_sref_codes_updated_at ON sref_codes(updated_at DESC);

-- Full-text search indexes
CREATE INDEX idx_sref_codes_title_search ON sref_codes USING GIN(to_tsvector('english', title));
CREATE INDEX idx_sref_codes_description_search ON sref_codes USING GIN(to_tsvector('english', description));
CREATE INDEX idx_sref_codes_title_trigram ON sref_codes USING GIN(title gin_trgm_ops);

-- Analytics indexes
CREATE INDEX idx_sref_analytics_sref_id ON sref_analytics(sref_id);
CREATE INDEX idx_sref_analytics_event_type ON sref_analytics(event_type);
CREATE INDEX idx_sref_analytics_created_at ON sref_analytics(created_at);
CREATE INDEX idx_sref_analytics_user_id ON sref_analytics(user_id) WHERE user_id IS NOT NULL;

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_premium ON users(premium) WHERE premium = TRUE;

-- Category and tag indexes
CREATE INDEX idx_categories_featured ON categories(featured) WHERE featured = TRUE;
CREATE INDEX idx_categories_parent_id ON categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX idx_tags_name_search ON tags USING GIN(name gin_trgm_ops);

-- Junction table indexes
CREATE INDEX idx_sref_categories_category_id ON sref_categories(category_id);
CREATE INDEX idx_sref_tags_tag_id ON sref_tags(tag_id);

-- Image indexes
CREATE INDEX idx_sref_images_sref_id ON sref_images(sref_id);
CREATE INDEX idx_sref_images_order ON sref_images(sref_id, image_order);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_sref_codes_updated_at BEFORE UPDATE ON sref_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for tag usage count
CREATE TRIGGER update_tag_usage_count_trigger
    AFTER INSERT OR DELETE ON sref_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to update category SREF count
CREATE OR REPLACE FUNCTION update_category_sref_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE categories SET sref_count = sref_count + 1 WHERE id = NEW.category_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE categories SET sref_count = sref_count - 1 WHERE id = OLD.category_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for category SREF count
CREATE TRIGGER update_category_sref_count_trigger
    AFTER INSERT OR DELETE ON sref_categories
    FOR EACH ROW EXECUTE FUNCTION update_category_sref_count();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, featured, sort_order) VALUES
('Anime', 'anime', 'Japanese anime and manga style references', '🎌', true, 1),
('Photography', 'photography', 'Professional photography style references', '📸', true, 2),
('Art', 'art', 'Artistic and creative style references', '🎨', true, 3),
('Architecture', 'architecture', 'Architectural and building style references', '🏛️', false, 4),
('Fashion', 'fashion', 'Fashion and clothing style references', '👗', false, 5),
('Nature', 'nature', 'Natural landscapes and scenery', '🌿', false, 6),
('Abstract', 'abstract', 'Abstract and conceptual art styles', '🔮', false, 7);

-- Insert common tags
INSERT INTO tags (name, slug, description) VALUES
('portrait', 'portrait', 'Portrait photography and character art'),
('landscape', 'landscape', 'Landscape and scenery images'),
('minimalist', 'minimalist', 'Clean, simple, minimalist design'),
('colorful', 'colorful', 'Bright, vibrant, colorful imagery'),
('black-white', 'black-white', 'Black and white or monochrome'),
('vintage', 'vintage', 'Retro, vintage, nostalgic style'),
('modern', 'modern', 'Contemporary, modern design'),
('cinematic', 'cinematic', 'Movie-like, cinematic quality'),
('detailed', 'detailed', 'Highly detailed, intricate imagery'),
('atmospheric', 'atmospheric', 'Moody, atmospheric lighting');