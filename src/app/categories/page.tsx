import Header from '@/components/layout/Header';
import Link from 'next/link';

const categories = [
  {
    id: 'anime',
    name: 'Anime',
    icon: '🎌',
    description: 'Anime and manga art styles',
    count: 25,
    color: 'from-pink-500 to-purple-600'
  },
  {
    id: 'photography',
    name: 'Photography',
    icon: '📸',
    description: 'Photographic styles and techniques',
    count: 18,
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'art',
    name: 'Digital Art',
    icon: '🎨',
    description: 'Digital art and illustration styles',
    count: 22,
    color: 'from-green-500 to-teal-600'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    icon: '📻',
    description: 'Retro and vintage aesthetic styles',
    count: 12,
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'digital',
    name: 'Digital',
    icon: '💻',
    description: 'Modern digital and tech styles',
    count: 15,
    color: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: '🌿',
    description: 'Natural and organic styles',
    count: 8,
    color: 'from-green-400 to-emerald-600'
  }
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🗂️ SREF Categories
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore SREF codes organized by style categories. Each category contains carefully curated 
            style references that work best for specific types of creative projects.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              {/* Category Header */}
              <div className={`h-24 bg-gradient-to-r ${category.color} p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                <div className="relative z-10 flex items-center justify-between h-full">
                  <div className="text-4xl">{category.icon}</div>
                  <div className="text-right">
                    <div className="text-white/90 text-sm font-medium">
                      {category.count} SREFs
                    </div>
                    <div className="text-white text-xs opacity-80">
                      Available
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h3>
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {category.count} style references
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    Explore →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Can&apos;t Find What You&apos;re Looking For?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Browse all SREF codes in our discovery page or use advanced filters to find 
            exactly what you need for your creative projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/discover"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Browse All SREFs
            </Link>
            <Link
              href="/discover?sort=trending"
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Trending
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}