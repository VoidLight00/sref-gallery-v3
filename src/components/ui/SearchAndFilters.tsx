'use client';

import { useState, useCallback, useEffect } from 'react';
import { SREFItem } from '@/lib/types/sref';

interface FilterOptions {
  category: string;
  sortBy: string;
  premiumOnly: boolean;
  featuredOnly: boolean;
  searchQuery: string;
}

interface SearchAndFiltersProps {
  data: SREFItem[];
  onFilteredDataChange: (filteredData: SREFItem[]) => void;
  className?: string;
  categories?: Array<{ 
    id: string; 
    name: string; 
    slug: string; 
    icon?: string | null; 
    color?: string | null;
    _count?: { srefCodes: number };
  }>;
  tags?: Array<{ id: string; name: string; }>;
  showCategoryFilter?: boolean;
}

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'anime', label: '🎌 Anime' },
  { value: 'photography', label: '📸 Photography' },
  { value: 'art', label: '🎨 Digital Art' },
  { value: 'vintage', label: '📻 Vintage' },
  { value: 'digital', label: '💻 Digital' },
  { value: 'nature', label: '🌿 Nature' }
];

const sortOptions = [
  { value: 'trending', label: '🔥 Trending' },
  { value: 'newest', label: '🆕 Newest' },
  { value: 'popular', label: '⭐ Most Popular' },
  { value: 'views', label: '👀 Most Viewed' },
  { value: 'likes', label: '❤️ Most Liked' },
  { value: 'alphabetical', label: '📝 A-Z' }
];

export default function SearchAndFilters({ 
  data, 
  onFilteredDataChange, 
  className = '' 
}: SearchAndFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    sortBy: 'trending',
    premiumOnly: false,
    featuredOnly: false,
    searchQuery: ''
  });
  
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(filters.searchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(filters.searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  // Generate search suggestions based on available data
  const generateSearchSuggestions = useCallback((query: string) => {
    if (query.length < 2) return [];
    
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();
    
    data.forEach(sref => {
      // Add matching titles
      if (sref.title.toLowerCase().includes(queryLower)) {
        suggestions.add(sref.title);
      }
      
      // Add matching tags
      sref.tags.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag);
        }
      });
      
      // Add matching descriptions
      if (sref.description?.toLowerCase().includes(queryLower)) {
        const words = sref.description.split(' ');
        words.forEach(word => {
          if (word.toLowerCase().includes(queryLower) && word.length > 2) {
            suggestions.add(word);
          }
        });
      }
    });
    
    return Array.from(suggestions).slice(0, 8);
  }, [data]);

  // Filter and sort data based on current filters
  const filterAndSortData = useCallback(() => {
    let filtered = [...data];
    
    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(sref =>
        sref.title.toLowerCase().includes(query) ||
        sref.description?.toLowerCase().includes(query) ||
        sref.tags.some(tag => tag.toLowerCase().includes(query)) ||
        sref.code.includes(query)
      );
    }
    
    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(sref => 
        sref.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }
    
    // Apply premium filter
    if (filters.premiumOnly) {
      filtered = filtered.filter(sref => sref.premium);
    }
    
    // Apply featured filter
    if (filters.featuredOnly) {
      filtered = filtered.filter(sref => sref.featured);
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'likes':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'trending':
      default:
        // Trending algorithm: combination of recent activity and engagement
        filtered.sort((a, b) => {
          const aScore = (a.likes * 2) + a.views + (a.featured ? 1000 : 0);
          const bScore = (b.likes * 2) + b.views + (b.featured ? 1000 : 0);
          return bScore - aScore;
        });
        break;
    }
    
    onFilteredDataChange(filtered);
  }, [data, debouncedSearchQuery, filters, onFilteredDataChange]);

  // Update filtered data when filters change
  useEffect(() => {
    filterAndSortData();
  }, [filterAndSortData]);

  // Update search suggestions when search query changes
  useEffect(() => {
    if (filters.searchQuery.length >= 2) {
      const suggestions = generateSearchSuggestions(filters.searchQuery);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [filters.searchQuery, generateSearchSuggestions]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFilters(prev => ({ ...prev, searchQuery: suggestion }));
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      sortBy: 'trending',
      premiumOnly: false,
      featuredOnly: false,
      searchQuery: ''
    });
  };

  const activeFiltersCount = [
    filters.category,
    filters.premiumOnly,
    filters.featuredOnly,
    filters.searchQuery
  ].filter(Boolean).length;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search SREF codes, styles, tags..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  onClick={() => handleFilterChange('searchQuery', '')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* Search Suggestions */}
          {showSuggestions && isSearchFocused && searchSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              <div className="py-2">
                <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Suggestions
                </div>
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <span className="text-gray-400 mr-2">🔍</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Category:
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Premium Only */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.premiumOnly}
              onChange={(e) => handleFilterChange('premiumOnly', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              👑 Premium Only
            </span>
          </label>

          {/* Featured Only */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.featuredOnly}
              onChange={(e) => handleFilterChange('featuredOnly', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              ⭐ Featured Only
            </span>
          </label>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}