import Header from '@/components/layout/Header';
import SREFCard from '@/components/sref/SREFCard';
import { testSREFData } from '@/lib/data/sref-data';

export default function RankingPage() {
  // Sort SREFs by different ranking criteria
  const topRated = [...testSREFData]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10);
    
  const mostViewed = [...testSREFData]
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
    
  const trending = [...testSREFData]
    .filter(sref => sref.featured)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🏆 SREF Rankings
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover the most popular, trending, and highest-rated SREF codes based on 
            community engagement, usage statistics, and creative results.
          </p>
        </div>

        {/* Trending Section */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔥</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Trending This Week
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Hottest SREF codes gaining popularity
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {trending.map((sref, index) => (
              <div key={sref.id} className="relative">
                <div className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
                  #{index + 1}
                </div>
                <SREFCard sref={sref} priority={index < 3} />
              </div>
            ))}
          </div>
        </section>

        {/* Most Liked Section */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="text-3xl">❤️</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Most Liked
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Community favorites with the highest ratings
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {topRated.map((sref, index) => (
              <div 
                key={sref.id} 
                className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    index === 0 ? 'text-yellow-500' : 
                    index === 1 ? 'text-gray-400' : 
                    index === 2 ? 'text-orange-500' : 'text-gray-600'
                  }`}>
                    #{index + 1}
                  </div>
                  {index < 3 && (
                    <div className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
                
                <div className="w-20 h-20 relative rounded-lg overflow-hidden">
                  <img
                    src={sref.images[0]}
                    alt={sref.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                      SREF: {sref.code}
                    </span>
                    {sref.premium && (
                      <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs px-2 py-1 rounded-full">
                        👑 PRO
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {sref.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>❤️ {sref.likes.toLocaleString()}</span>
                    <span>👀 {sref.views.toLocaleString()}</span>
                    <span>📅 {new Date(sref.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {((sref.likes / sref.views) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Like Rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Most Viewed Section */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="text-3xl">👀</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Most Viewed
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  SREF codes with the highest view counts
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mostViewed.map((sref, index) => (
              <div key={sref.id} className="relative">
                <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
                  #{index + 1}
                </div>
                <SREFCard sref={sref} />
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Want to See Your SREF in Rankings?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Submit your best SREF codes and let the community vote. High-quality submissions 
            can make it to our trending and most-liked sections.
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
            Submit Your SREF
          </button>
        </div>
      </div>
    </div>
  );
}