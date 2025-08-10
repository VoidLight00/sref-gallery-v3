import Header from '@/components/layout/Header';
import SREFCard from '@/components/sref/SREFCard';
import { testSREFData, categories } from '@/lib/data/sref-data';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  // Find category
  const category = categories.find(cat => cat.slug === slug);
  if (!category) {
    notFound();
  }

  // Filter SREFs by category
  const categorySREFs = testSREFData.filter(sref => sref.category === category.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">{category.icon}</div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {category.name} Style References
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                {category.description}
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span>{categorySREFs.length} SREF codes</span>
            <span>Updated daily</span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">●</span>
              Active category
            </span>
          </div>
        </div>

        {/* Results Grid */}
        {categorySREFs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categorySREFs.map((sref, index) => (
              <SREFCard 
                key={sref.id} 
                sref={sref} 
                priority={index < 8}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No SREF codes found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              We&apos;re working on adding more {category.name.toLowerCase()} style references. Check back soon!
            </p>
          </div>
        )}

        {/* Related Categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Explore Other Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.filter(cat => cat.id !== category.id).map(cat => (
              <a
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {cat.count} codes
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static paths for all categories
export async function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.slug,
  }));
}