'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SREFItem } from '@/lib/types/sref';
import ProgressiveImage from '@/components/ui/ProgressiveImage';
import { getOptimizedImageUrl } from '@/lib/utils/cdnConfig';

interface EnhancedSREFCardProps {
  sref: SREFItem;
  priority?: boolean;
  showPreview?: boolean;
  className?: string;
}

export default function EnhancedSREFCard({ 
  sref, 
  priority = false, 
  showPreview = true,
  className = ''
}: EnhancedSREFCardProps) {
  const [hoveredImage, setHoveredImage] = useState<number>(0);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([true, true, true, true]);
  const [_errorStates, setErrorStates] = useState<boolean[]>([false, false, false, false]);

  const handleImageLoad = (index: number) => {
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });
  };

  const handleImageError = (index: number) => {
    setErrorStates(prev => {
      const newErrors = [...prev];
      newErrors[index] = true;
      return newErrors;
    });
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });
  };

  // Generate fallback placeholder URL for failed images
  const getFallbackUrl = (index: number) => {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-${sref.code}-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#bg-${sref.code}-${index})"/>
        <circle cx="200" cy="170" r="40" fill="#cbd5e1" opacity="0.5"/>
        <text x="200" y="230" text-anchor="middle" fill="#64748b" 
              font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">
          SREF ${sref.code}
        </text>
        <text x="200" y="250" text-anchor="middle" fill="#94a3b8" 
              font-family="system-ui, -apple-system, sans-serif" font-size="12">
          Example ${index + 1}
        </text>
        <rect x="40" y="40" width="320" height="320" 
              fill="none" stroke="#cbd5e1" stroke-width="2" 
              stroke-dasharray="8,4" opacity="0.4" rx="12"/>
      </svg>
    `)}`;
  };

  // Calculate loading progress
  const loadedCount = loadingStates.filter(state => !state).length;
  const loadingProgress = (loadedCount / 4) * 100;

  return (
    <div className={`group bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 ${className}`}>
      {/* Image Grid - 2x2 layout with enhanced progressive loading */}
      <div className="relative aspect-square">
        {/* Loading progress bar */}
        {loadingProgress < 100 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-10">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        )}

        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-full">
          {sref.images.slice(0, 4).map((image, index) => (
            <div
              key={index}
              className="relative bg-gray-100 dark:bg-gray-800 overflow-hidden cursor-pointer group-hover:brightness-110 transition-all duration-300"
              onMouseEnter={() => setHoveredImage(index)}
            >
              <ProgressiveImage
                src={getOptimizedImageUrl(image, { 
                  width: 400, 
                  height: 400, 
                  quality: 85,
                  format: 'webp'
                })}
                alt={`${sref.title} example ${index + 1}`}
                width={400}
                height={400}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={priority && index === 0}
                fallbackSrc={getFallbackUrl(index)}
                onLoad={() => handleImageLoad(index)}
                onError={() => handleImageError(index)}
                sizes="(max-width: 768px) 50vw, 25vw"
                quality={85}
              />
              
              {/* Hover overlay with enhanced effects */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
              
              {/* Index indicator on hover */}
              {hoveredImage === index && showPreview && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  {index + 1}/4
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Premium badge with enhanced styling */}
        {sref.premium && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
            <span className="mr-1">👑</span>PRO
          </div>
        )}
        
        {/* Featured badge */}
        {sref.featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
            <span className="mr-1">⭐</span>Featured
          </div>
        )}

        {/* Quality indicator */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          WebP
        </div>
      </div>

      {/* Card Content with enhanced typography */}
      <div className="p-5">
        {/* SREF Code and Title */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-sm font-mono text-blue-600 dark:text-blue-400 mb-1.5 tracking-wider">
              SREF: {sref.code}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-2 leading-tight">
              {sref.title}
            </h3>
          </div>
          <Link 
            href={`/sref/${sref.code}`}
            className="text-blue-500 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
            title="View details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Description */}
        {sref.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
            {sref.description}
          </p>
        )}

        {/* Tags with improved styling */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {sref.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
          {sref.tags.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-500 px-2 py-1">
              +{sref.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Stats with enhanced layout */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {sref.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {sref.likes.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {sref.ranking?.allTime && sref.ranking.allTime <= 10 && (
              <span className="text-xs bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full border border-yellow-200 dark:border-yellow-700">
                Top {sref.ranking.allTime}
              </span>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              #{sref.ranking?.allTime || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced hover effect */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-all duration-300 pointer-events-none" />
    </div>
  );
}