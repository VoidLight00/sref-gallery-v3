import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import CategoryContent from '@/components/sections/CategoryContent';
import { SREFItem } from '@/lib/types/sref';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { sort?: string; page?: string };
}

// Generate metadata for the category page
export async function generateMetadata(
  { params }: CategoryPageProps
): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true }
  });

  if (!category) {
    return {
      title: 'Category Not Found'
    };
  }

  return {
    title: `${category.name} SREF Codes - Midjourney Style References`,
    description: category.description || `Explore ${category.name} style references for Midjourney AI art generation`,
    openGraph: {
      title: `${category.name} SREF Gallery`,
      description: category.description || `Browse ${category.name} style references`,
      type: 'website',
    }
  };
}

// Get category data from API endpoint
async function getCategoryData(slug: string, sort: string = 'newest') {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/categories/${slug}?sort=${sort}&take=12`,
      { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch category data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching category data:', error);
    throw error;
  }
}

// Get all categories for filter dropdown
async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        _count: {
          select: { srefCodes: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Get all tags for filter dropdown
async function getAllTags() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    });
    
    return tags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const sort = searchParams.sort || 'newest';
  
  // Fetch data in parallel
  const [categoryData, allCategories, allTags] = await Promise.all([
    getCategoryData(params.slug, sort),
    getAllCategories(),
    getAllTags()
  ]);

  // Handle category not found
  if (!categoryData) {
    notFound();
  }

  const { category, srefs, pagination } = categoryData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Category Icon */}
            {category.icon && (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl mb-6 shadow-lg">
                {category.icon}
              </div>
            )}
            
            {/* Category Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {category.name}
            </h1>
            
            {/* Category Description */}
            {category.description && (
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
                {category.description}
              </p>
            )}
            
            {/* Stats */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{category.count}</span>
              <span>SREF codes available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategoryContent
          category={category}
          initialSREFs={srefs}
          pagination={pagination}
          categories={allCategories}
          tags={allTags}
          initialSort={sort}
        />
      </div>
    </div>
  );
}

// Generate static params for known categories (optional optimization)
export async function generateStaticParams() {
  try {
    const categories = await prisma.category.findMany({
      select: { slug: true },
      where: {
        srefCodes: {
          some: {} // Only include categories that have SREF codes
        }
      }
    });
    
    return categories.map((category) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}