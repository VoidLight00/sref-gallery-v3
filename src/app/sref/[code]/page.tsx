import Header from '@/components/layout/Header';
import Image from 'next/image';
import Link from 'next/link';
import { testSREFData } from '@/lib/data/sref-data';
import { notFound } from 'next/navigation';

interface SREFDetailPageProps {
  params: Promise<{ code: string }>;
}

export default async function SREFDetailPage({ params }: SREFDetailPageProps) {
  const { code } = await params;
  
  // Find SREF by code
  const sref = testSREFData.find(s => s.code === code);
  if (!sref) {
    notFound();
  }

  // Generate placeholder for failed images
  const getPlaceholderSrc = (index: number) => {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#f3f4f6"/>
        <text x="200" y="200" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="16">
          SREF ${sref.code}-${index + 1}
        </text>
      </svg>
    `)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
          <span>›</span>
          <Link href="/discover" className="hover:text-blue-600 dark:hover:text-blue-400">Discover</Link>
          <span>›</span>
          <Link href={`/category/${sref.category}`} className="hover:text-blue-600 dark:hover:text-blue-400 capitalize">
            {sref.category}
          </Link>
          <span>›</span>
          <span className="text-gray-900 dark:text-white">SREF {sref.code}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {sref.title}
              </h1>
              
              {/* 2x2 Image Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {sref.images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Image
                      src={getPlaceholderSrc(index)} // Using placeholder for Phase 1
                      alt={`${sref.title} example ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index < 2}
                    />
                  </div>
                ))}
              </div>

              {/* Description */}
              {sref.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {sref.description}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {sref.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Usage Instructions */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  How to use this SREF code:
                </h3>
                <div className="bg-gray-900 dark:bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
                  /imagine your prompt --sref {sref.code}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Add this SREF code to your Midjourney prompt to apply this style reference
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SREF Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">SREF Information</h2>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">SREF Code</span>
                  <p className="font-mono text-lg text-blue-600 dark:text-blue-400">{sref.code}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</span>
                  <p className="capitalize text-gray-900 dark:text-white">{sref.category}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Popularity</span>
                  <p className="text-gray-900 dark:text-white">{sref.popularity}%</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Views</span>
                  <p className="text-gray-900 dark:text-white">{sref.views.toLocaleString()}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Likes</span>
                  <p className="text-gray-900 dark:text-white">{sref.likes.toLocaleString()}</p>
                </div>
                
                {sref.ranking?.allTime && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">All-time Ranking</span>
                    <p className="text-gray-900 dark:text-white">#{sref.ranking.allTime}</p>
                  </div>
                )}
              </div>

              {/* Premium Badge */}
              {sref.premium && (
                <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">👑</span>
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100">Premium SREF</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    This is a premium style reference with enhanced quality
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  📋 Copy SREF Code
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  ❤️ Like this SREF
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  🔖 Bookmark
                </button>
              </div>
            </div>

            {/* Related SREFs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Related SREFs</h3>
              <div className="space-y-4">
                {testSREFData
                  .filter(s => s.category === sref.category && s.id !== sref.id)
                  .slice(0, 3)
                  .map(relatedSREF => (
                    <Link
                      key={relatedSREF.id}
                      href={`/sref/${relatedSREF.code}`}
                      className="block group"
                    >
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex-shrink-0"></div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {relatedSREF.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {relatedSREF.code}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static paths for all SREF codes
export async function generateStaticParams() {
  return testSREFData.map((sref) => ({
    code: sref.code,
  }));
}