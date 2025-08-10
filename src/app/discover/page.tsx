import Header from '@/components/layout/Header';
import SREFCard from '@/components/sref/SREFCard';
import { testSREFData } from '@/lib/data/sref-data';

export default function DiscoverPage() {
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
            Explore our complete collection of {testSREFData.length} Midjourney style reference codes
          </p>
        </div>

        {/* Filter Bar (Phase 2) */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
              <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="trending">🔥 Trending</option>
                <option value="newest">🆕 Newest</option>
                <option value="popular">⭐ Most Popular</option>
                <option value="views">👀 Most Viewed</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
              <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">All Categories</option>
                <option value="anime">🎌 Anime</option>
                <option value="photography">📸 Photography</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="premium" className="rounded" />
              <label htmlFor="premium" className="text-sm text-gray-700 dark:text-gray-300">
                👑 Premium Only
              </label>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {testSREFData.map((sref, index) => (
            <SREFCard 
              key={sref.id} 
              sref={sref} 
              priority={index < 8}
            />
          ))}
        </div>

        {/* Load More (Phase 2) */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
            Load More SREF Codes
          </button>
        </div>
      </div>
    </div>
  );
}