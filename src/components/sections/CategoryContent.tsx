'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InteractiveSREFCard from '@/components/sref/InteractiveSREFCard';
import SearchAndFilters from '@/components/ui/SearchAndFilters';
import { SREFItem } from '@/lib/types/sref';

interface CategoryContentProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    count: number;
  };
  initialSREFs: SREFItem[];
  pagination: {
    skip: number;
    take: number;
    total: number;
    hasMore: boolean;
  };
  categories: Array<{ 
    id: string; 
    name: string; 
    slug: string; 
    icon?: string | null; 
    color?: string | null;
    _count: { srefCodes: number };
  }>;
  tags: Array<{ id: string; name: string; }>;
  initialSort: string;
}

export default function CategoryContent({ 
  category,
  initialSREFs, 
  pagination: initialPagination,
  categories, 
  tags,
  initialSort
}: CategoryContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [srefs, setSREFs] = useState<SREFItem[]>(initialSREFs);
  const [filteredData, setFilteredData] = useState<SREFItem[]>(initialSREFs);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSort, setCurrentSort] = useState(initialSort);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: string) => {
    if (newSort === currentSort) return;
    
    setCurrentSort(newSort);
    setIsLoading(true);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.push(`/categories/${category.slug}?${params.toString()}`);
    
    // Fetch new data
    fetchCategorySREFs(newSort, 0, 12, true);
  }, [currentSort, searchParams, router, category.slug]);

  // Fetch category SREFs
  const fetchCategorySREFs = async (
    sort: string = currentSort, 
    skip: number = 0, 
    take: number = 12,
    replace: boolean = false
  ) => {
    try {
      const response = await fetch(
        `/api/categories/${category.slug}?sort=${sort}&skip=${skip}&take=${take}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch category SREFs');
      }
      
      const data = await response.json();
      
      if (replace) {
        setSREFs(data.srefs);
        setFilteredData(data.srefs);
      } else {
        setSREFs(prev => [...prev, ...data.srefs]);
        setFilteredData(prev => [...prev, ...data.srefs]);
      }
      
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching category SREFs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = useCallback(async (srefId: string, liked: boolean) => {
    try {
      const response = await fetch(`/api/sref/${srefId}/like`, {
        method: liked ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      // Update local state
      setSREFs(prev => prev.map(sref => 
        sref.id === srefId 
          ? { ...sref, likes: liked ? sref.likes + 1 : sref.likes - 1 }
          : sref
      ));
      setFilteredData(prev => prev.map(sref => 
        sref.id === srefId 
          ? { ...sref, likes: liked ? sref.likes + 1 : sref.likes - 1 }
          : sref
      ));

      console.log(`SREF ${srefId} ${liked ? 'liked' : 'unliked'}`);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  }, []);

  const handleBookmark = useCallback(async (srefId: string, bookmarked: boolean) => {
    try {
      const response = await fetch(`/api/sref/${srefId}/favorite`, {
        method: bookmarked ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      // Update local state
      setSREFs(prev => prev.map(sref => 
        sref.id === srefId 
          ? { ...sref, favorites: bookmarked ? sref.favorites + 1 : sref.favorites - 1 }
          : sref
      ));
      setFilteredData(prev => prev.map(sref => 
        sref.id === srefId 
          ? { ...sref, favorites: bookmarked ? sref.favorites + 1 : sref.favorites - 1 }
          : sref
      ));

      console.log(`SREF ${srefId} ${bookmarked ? 'bookmarked' : 'unbookmarked'}`);
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  }, []);

  const handleCopy = useCallback((srefCode: string) => {
    navigator.clipboard.writeText(`--sref ${srefCode}`);
    console.log(`SREF code copied: ${srefCode}`);
  }, []);

  const loadMore = async () => {
    if (isLoading || !pagination.hasMore) return;
    
    setIsLoading(true);
    await fetchCategorySREFs(currentSort, pagination.skip + pagination.take, 12, false);
  };

  return (
    <>
      {/* Sort Options */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
        
        {/* Category Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <a href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</a>
          <span>/</span>
          <a href="/categories" className="hover:text-blue-600 dark:hover:text-blue-400">Categories</a>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-200 font-medium">{category.name}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        data={srefs}
        onFilteredDataChange={setFilteredData}
        className="mb-8"
        categories={categories}
        tags={tags}
        showCategoryFilter={false} // Hide category filter since we're already in a category
      />

      {/* Results Stats */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredData.length} of {category.count} {category.name.toLowerCase()} results
          {filteredData.length !== srefs.length && (
            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
              Filtered
            </span>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {filteredData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {filteredData.map((sref, index) => (
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
          {pagination.hasMore && filteredData.length === srefs.length && (
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
                {isLoading ? 'Loading...' : `Load More ${category.name}`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">{category.icon || '📁'}</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No {category.name.toLowerCase()} results found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your search or filters to find {category.name.toLowerCase()} style references.
          </p>
          <button
            onClick={() => {
              setFilteredData(srefs);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </>
  );
}