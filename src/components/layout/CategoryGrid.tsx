'use client';

import Link from 'next/link';
import { categories } from '@/lib/data/sref-data';

export default function CategoryGrid() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Category by Style
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore our curated collection of Midjourney SREF codes organized by artistic styles and themes.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group bg-gray-50 dark:bg-gray-800 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-center border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg"
            >
              {/* Category Icon */}
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                {category.icon}
              </div>
              
              {/* Category Name */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {category.name}
              </h3>
              
              {/* Category Count */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {category.count} SREF{category.count !== 1 ? 's' : ''}
              </p>
              
              {/* Category Description */}
              <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">
                {category.description}
              </p>
              
              {/* Featured Badge */}
              {category.featured && (
                <div className="mt-3">
                  <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium px-2 py-1 rounded-full">
                    Featured
                  </span>
                </div>
              )}

              {/* Hover Arrow */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="w-5 h-5 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
          
          {/* View All Categories */}
          <Link
            href="/categories"
            className="group bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 hover:from-blue-100 hover:to-indigo-200 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 text-center border border-blue-200 dark:border-blue-800 hover:shadow-lg flex items-center justify-center"
          >
            <div>
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                📂
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                View All
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                40+ Categories
              </p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="w-5 h-5 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}