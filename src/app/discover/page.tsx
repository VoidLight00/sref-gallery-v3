'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import InteractiveSREFCard from '@/components/sref/InteractiveSREFCard';
import SearchAndFilters from '@/components/ui/SearchAndFilters';
import { testSREFData } from '@/lib/data/sref-data';
import { SREFItem } from '@/lib/types/sref';

export default function DiscoverPage() {
  const [filteredData, setFilteredData] = useState<SREFItem[]>(testSREFData);
  const [loadedCount, setLoadedCount] = useState(12);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = (srefId: string, liked: boolean) => {
    console.log(`SREF ${srefId} ${liked ? 'liked' : 'unliked'}`);
    // In a real app, this would make an API call to update the like status
  };

  const handleBookmark = (srefId: string, bookmarked: boolean) => {
    console.log(`SREF ${srefId} ${bookmarked ? 'bookmarked' : 'unbookmarked'}`);
    // In a real app, this would make an API call to update the bookmark status
  };

  const handleCopy = (srefCode: string) => {
    console.log(`SREF code copied: ${srefCode}`);
    // Analytics tracking could be added here
  };

  const loadMore = async () => {
    setIsLoading(true);
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoadedCount(prev => Math.min(prev + 12, filteredData.length));
    setIsLoading(false);
  };

  const displayedData = filteredData.slice(0, loadedCount);
  const hasMore = loadedCount < filteredData.length;

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

        {/* Interactive Search & Filters */}
        <SearchAndFilters
          data={testSREFData}
          onFilteredDataChange={setFilteredData}
          className="mb-8"
        />

        {/* Results Stats */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {displayedData.length} of {filteredData.length} results
            {filteredData.length !== testSREFData.length && (
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                Filtered
              </span>
            )}
          </div>
        </div>

        {/* Interactive Results Grid */}
        {displayedData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {displayedData.map((sref, index) => (
                <InteractiveSREFCard 
                  key={sref.id} 
                  sref={sref} 
                  priority={index < 8}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onCopy={handleCopy}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button 
                  onClick={loadMore}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {isLoading && (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isLoading ? 'Loading...' : `Load More (${filteredData.length - loadedCount} remaining)`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
            <button
              onClick={() => {
                // Reset filters - this would be implemented in SearchAndFilters component
                window.location.reload();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}