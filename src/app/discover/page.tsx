import Header from '@/components/layout/Header';
import DiscoverContent from '@/components/sections/DiscoverContent';
import { prisma } from '@/lib/prisma';

async function getInitialSREFs() {
  const srefs = await prisma.srefCode.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      images: true
    },
    take: 12,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return srefs.map(sref => ({
    id: sref.id,
    code: sref.code,
    title: sref.title,
    description: sref.description || '',
    imageUrl: sref.imageUrl || `/images/sref/${sref.code}.webp`,
    images: sref.images?.length > 0 
      ? sref.images.map(img => img.url) 
      : [
          `/images/sref/${sref.code}-1.webp`,
          `/images/sref/${sref.code}-2.webp`,
          `/images/sref/${sref.code}-3.webp`,
          `/images/sref/${sref.code}-4.webp`
        ],
    promptExamples: sref.promptExamples ? JSON.parse(sref.promptExamples) : [],
    featured: sref.featured,
    premium: sref.premium,
    likes: sref.likeCount,
    views: sref.viewCount,
    favorites: sref.favoriteCount,
    category: sref.categories[0]?.category?.name || 'Uncategorized',
    tags: sref.tags?.map(t => t.tag.name) || [],
    createdAt: sref.createdAt.toISOString(),
    user: sref.user ? {
      id: sref.user.id,
      name: sref.user.name || 'Anonymous',
      avatar: sref.user.image || '/avatars/default.jpg'
    } : undefined
  }));
}

async function getTotalCount() {
  return await prisma.srefCode.count({
    where: {
      status: 'ACTIVE'
    }
  });
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      sortOrder: 'asc'
    }
  });
  
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    color: cat.color
  }));
}

async function getTags() {
  const tags = await prisma.tag.findMany({
    orderBy: {
      name: 'asc'
    }
  });
  
  return tags.map(tag => ({
    id: tag.id,
    name: tag.name
  }));
}

export default async function DiscoverPage() {
  const [initialSREFs, totalCount, categories, tags] = await Promise.all([
    getInitialSREFs(),
    getTotalCount(),
    getCategories(),
    getTags()
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🔍 Discover SREF Codes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Explore our complete collection of {totalCount} Midjourney style reference codes
          </p>
        </div>

        {/* Client Component for Interactive Features */}
        <DiscoverContent
          initialSREFs={initialSREFs}
          totalCount={totalCount}
          categories={categories}
          tags={tags}
        />
      </div>
    </div>
  );
}