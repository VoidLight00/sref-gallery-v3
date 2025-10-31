'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import InteractiveSREFCard from '@/components/sref/InteractiveSREFCard';

interface SREFSectionProps {
  title: string;
  subtitle: string;
  srefs: any[];
  viewAllLink: string;
  viewAllText: string;
  bgColor?: string;
  columns?: number;
}

export default function SREFSection({
  title,
  subtitle,
  srefs,
  viewAllLink,
  viewAllText,
  bgColor = 'bg-white dark:bg-gray-900',
  columns = 3
}: SREFSectionProps) {
  const handleLike = useCallback(async (srefId: string, liked: boolean) => {
    try {
      const response = await fetch(`/api/srefs/${srefId}/like`, {
        method: liked ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      console.log(`SREF ${srefId} ${liked ? 'liked' : 'unliked'}`);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  }, []);

  const handleBookmark = useCallback(async (srefId: string, bookmarked: boolean) => {
    try {
      const response = await fetch(`/api/srefs/${srefId}/favorite`, {
        method: bookmarked ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      console.log(`SREF ${srefId} ${bookmarked ? 'bookmarked' : 'unbookmarked'}`);
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  }, []);

  const handleCopy = useCallback((srefCode: string) => {
    navigator.clipboard.writeText(`--sref ${srefCode}`);
    console.log(`SREF code copied: ${srefCode}`);
  }, []);

  const gridCols = columns === 3 
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
          </div>
          <Link
            href={viewAllLink}
            className="hidden sm:inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            View All
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className={`grid ${gridCols} gap-6 mb-8`}>
          {srefs.map((sref, index) => (
            <InteractiveSREFCard 
              key={sref.id} 
              sref={sref} 
              priority={index < 3}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onCopy={handleCopy}
            />
          ))}
        </div>
        
        {/* Mobile View All Button */}
        <div className="text-center sm:hidden">
          <Link
            href={viewAllLink}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            {viewAllText}
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}