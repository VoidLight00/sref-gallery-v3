'use client';

import Link from 'next/link';
import { siteStats } from '@/lib/data/sref-data';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Hand-picked{' '}
            <span className="text-blue-600 dark:text-blue-400">
              {siteStats.totalSREFs.toLocaleString()} sref codes
            </span>
            ,{' '}
            <span className="text-blue-600 dark:text-blue-400">
              {siteStats.totalPrompts.toLocaleString()} prompts
            </span>{' '}
            and video examples
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto">
            Find best Style Reference Code, prompts and video examples. Updated daily.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {siteStats.totalSREFs}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">SREF Codes</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {siteStats.totalPrompts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Prompts</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {siteStats.totalCategories}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {siteStats.dailyUpdates}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Daily Updates</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/discover"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              🔍 Explore All Style Reference Codes
            </Link>
            <Link
              href="/premium"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              👑 Start Your Trial
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Updated Daily</span>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Video Examples</span>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Premium Features</span>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Easy Copy-Paste</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}