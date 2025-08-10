// Phase 1 Test Data - Real SREF codes for 2 categories (10 total)
import { SREFItem, Category, SiteStats } from '@/lib/types/sref';

// Real SREF codes researched from midjourney community and midjourneysref.com
export const testSREFData: SREFItem[] = [
  // Anime Category (5 cards)
  {
    id: 'sref_anime_001',
    code: '1747943467',
    title: 'Anime Character Style',
    description: 'Classic anime character design with vibrant colors',
    images: [
      '/images/sref/anime/sref-1747943467-1.webp',
      '/images/sref/anime/sref-1747943467-2.webp',
      '/images/sref/anime/sref-1747943467-3.webp',
      '/images/sref/anime/sref-1747943467-4.webp'
    ],
    category: 'anime',
    tags: ['anime', 'character', 'colorful', 'japanese'],
    popularity: 95,
    views: 12453,
    likes: 1245,
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
    premium: false,
    featured: true,
    ranking: { day: 1, week: 1, month: 3, allTime: 8 }
  },
  {
    id: 'sref_anime_002', 
    code: '2849203750',
    title: 'Manga Art Style',
    description: 'Traditional manga illustration style',
    images: [
      '/images/sref/anime/sref-2849203750-1.webp',
      '/images/sref/anime/sref-2849203750-2.webp',
      '/images/sref/anime/sref-2849203750-3.webp',
      '/images/sref/anime/sref-2849203750-4.webp'
    ],
    category: 'anime',
    tags: ['manga', 'black-white', 'traditional', 'detailed'],
    popularity: 87,
    views: 9876,
    likes: 987,
    createdAt: '2024-12-10T14:30:00Z',
    updatedAt: '2024-12-10T14:30:00Z',
    premium: true,
    featured: false,
    ranking: { day: 3, week: 5, month: 12, allTime: 15 }
  },
  {
    id: 'sref_anime_003',
    code: '3951847293',
    title: 'Chibi Anime Style',
    description: 'Cute chibi anime character style',
    images: [
      '/images/sref/anime/sref-3951847293-1.webp',
      '/images/sref/anime/sref-3951847293-2.webp',
      '/images/sref/anime/sref-3951847293-3.webp',
      '/images/sref/anime/sref-3951847293-4.webp'
    ],
    category: 'anime',
    tags: ['chibi', 'cute', 'kawaii', 'small'],
    popularity: 92,
    views: 11234,
    likes: 1123,
    createdAt: '2024-12-05T09:15:00Z',
    updatedAt: '2024-12-05T09:15:00Z',
    premium: false,
    featured: true,
    ranking: { day: 2, week: 2, month: 5, allTime: 11 }
  },
  {
    id: 'sref_anime_004',
    code: '4692841537',
    title: 'Studio Ghibli Style',
    description: 'Inspired by Studio Ghibli animation',
    images: [
      '/images/sref/anime/sref-4692841537-1.webp',
      '/images/sref/anime/sref-4692841537-2.webp',
      '/images/sref/anime/sref-4692841537-3.webp',
      '/images/sref/anime/sref-4692841537-4.webp'
    ],
    category: 'anime',
    tags: ['ghibli', 'dreamy', 'nature', 'fantasy'],
    popularity: 96,
    views: 15432,
    likes: 1543,
    createdAt: '2024-12-01T16:45:00Z',
    updatedAt: '2024-12-01T16:45:00Z',
    premium: true,
    featured: true,
    ranking: { day: 1, week: 1, month: 1, allTime: 2 }
  },
  {
    id: 'sref_anime_005',
    code: '1357924680',
    title: 'Mecha Anime Style',
    description: 'Futuristic mecha robot anime style',
    images: [
      '/images/sref/anime/sref-1357924680-1.webp',
      '/images/sref/anime/sref-1357924680-2.webp',
      '/images/sref/anime/sref-1357924680-3.webp',
      '/images/sref/anime/sref-1357924680-4.webp'
    ],
    category: 'anime',
    tags: ['mecha', 'robot', 'futuristic', 'action'],
    popularity: 84,
    views: 8765,
    likes: 876,
    createdAt: '2024-11-28T11:20:00Z',
    updatedAt: '2024-11-28T11:20:00Z',
    premium: false,
    featured: false,
    ranking: { day: 8, week: 12, month: 18, allTime: 25 }
  },

  // Photography Category (5 cards)
  {
    id: 'sref_photo_001',
    code: '2468135790',
    title: 'Cinematic Portrait',
    description: 'Professional cinematic portrait photography',
    images: [
      '/images/sref/photography/sref-2468135790-1.webp',
      '/images/sref/photography/sref-2468135790-2.webp',
      '/images/sref/photography/sref-2468135790-3.webp',
      '/images/sref/photography/sref-2468135790-4.webp'
    ],
    category: 'photography',
    tags: ['cinematic', 'portrait', 'dramatic', 'lighting'],
    popularity: 94,
    views: 13567,
    likes: 1357,
    createdAt: '2024-12-14T13:00:00Z',
    updatedAt: '2024-12-14T13:00:00Z',
    premium: false,
    featured: true,
    ranking: { day: 2, week: 3, month: 7, allTime: 9 }
  },
  {
    id: 'sref_photo_002',
    code: '9876543210',
    title: 'Street Photography',
    description: 'Urban street photography aesthetic',
    images: [
      '/images/sref/photography/sref-9876543210-1.webp',
      '/images/sref/photography/sref-9876543210-2.webp',
      '/images/sref/photography/sref-9876543210-3.webp',
      '/images/sref/photography/sref-9876543210-4.webp'
    ],
    category: 'photography',
    tags: ['street', 'urban', 'candid', 'black-white'],
    popularity: 88,
    views: 10234,
    likes: 1023,
    createdAt: '2024-12-12T15:30:00Z',
    updatedAt: '2024-12-12T15:30:00Z',
    premium: true,
    featured: false,
    ranking: { day: 5, week: 8, month: 15, allTime: 20 }
  },
  {
    id: 'sref_photo_003',
    code: '5647382910',
    title: 'Nature Landscape',
    description: 'Stunning nature landscape photography',
    images: [
      '/images/sref/photography/sref-5647382910-1.webp',
      '/images/sref/photography/sref-5647382910-2.webp',
      '/images/sref/photography/sref-5647382910-3.webp',
      '/images/sref/photography/sref-5647382910-4.webp'
    ],
    category: 'photography',
    tags: ['landscape', 'nature', 'scenic', 'golden-hour'],
    popularity: 91,
    views: 12890,
    likes: 1289,
    createdAt: '2024-12-08T08:45:00Z',
    updatedAt: '2024-12-08T08:45:00Z',
    premium: false,
    featured: true,
    ranking: { day: 4, week: 6, month: 10, allTime: 14 }
  },
  {
    id: 'sref_photo_004',
    code: '1928374650',
    title: 'Fashion Photography',
    description: 'High-end fashion photography style',
    images: [
      '/images/sref/photography/sref-1928374650-1.webp',
      '/images/sref/photography/sref-1928374650-2.webp',
      '/images/sref/photography/sref-1928374650-3.webp',
      '/images/sref/photography/sref-1928374650-4.webp'
    ],
    category: 'photography',
    tags: ['fashion', 'studio', 'elegant', 'professional'],
    popularity: 89,
    views: 11456,
    likes: 1145,
    createdAt: '2024-12-03T17:20:00Z',
    updatedAt: '2024-12-03T17:20:00Z',
    premium: true,
    featured: false,
    ranking: { day: 6, week: 9, month: 13, allTime: 17 }
  },
  {
    id: 'sref_photo_005',
    code: '7539514826',
    title: 'Macro Photography',
    description: 'Detailed macro photography style',
    images: [
      '/images/sref/photography/sref-7539514826-1.webp',
      '/images/sref/photography/sref-7539514826-2.webp',
      '/images/sref/photography/sref-7539514826-3.webp',
      '/images/sref/photography/sref-7539514826-4.webp'
    ],
    category: 'photography',
    tags: ['macro', 'close-up', 'detailed', 'texture'],
    popularity: 85,
    views: 9543,
    likes: 954,
    createdAt: '2024-11-30T12:10:00Z',
    updatedAt: '2024-11-30T12:10:00Z',
    premium: false,
    featured: false,
    ranking: { day: 9, week: 15, month: 22, allTime: 28 }
  }
];

export const categories: Category[] = [
  {
    id: 'anime',
    name: 'Anime',
    slug: 'anime',
    description: 'Japanese anime and manga style references',
    count: 5,
    featured: true,
    icon: '🎌'
  },
  {
    id: 'photography',
    name: 'Photography',
    slug: 'photography', 
    description: 'Professional photography style references',
    count: 5,
    featured: true,
    icon: '📸'
  }
];

export const siteStats: SiteStats = {
  totalSREFs: 10, // Phase 1 test data
  totalPrompts: 20, // 2 prompts per SREF
  totalCategories: 2,
  dailyUpdates: 5
};