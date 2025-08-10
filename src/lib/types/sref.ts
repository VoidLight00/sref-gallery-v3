// SREF Gallery Types - Based on midjourneysref.com analysis

export interface SREFItem {
  id: string;
  code: string; // Real Midjourney SREF code
  title: string;
  description?: string;
  images: string[]; // 4 images per SREF
  category: string;
  tags: string[];
  popularity: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  premium: boolean;
  featured: boolean;
  ranking?: {
    day: number;
    week: number;
    month: number;
    allTime: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
  featured: boolean;
  icon?: string;
}

export interface SREFFilters {
  category?: string;
  tags?: string[];
  timeRange?: 'day' | 'week' | 'month' | 'all';
  premium?: boolean;
  featured?: boolean;
  sortBy?: 'popularity' | 'newest' | 'views' | 'likes';
}

export interface SiteStats {
  totalSREFs: number;
  totalPrompts: number;
  totalCategories: number;
  dailyUpdates: number;
}

export type TimeRange = '24h' | '7d' | '30d' | 'all';
export type SortOption = 'trending' | 'newest' | 'popular' | 'views';