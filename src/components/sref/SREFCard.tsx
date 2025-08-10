'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { SREFItem } from '@/lib/types/sref';

interface SREFCardProps {
  sref: SREFItem;
  priority?: boolean;
}

export default function SREFCard({ sref, priority = false }: SREFCardProps) {
  const [, setHoveredImage] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean[]>([false, false, false, false]);

  const handleImageError = (index: number) => {
    setImageError(prev => {
      const newErrors = [...prev];
      newErrors[index] = true;
      return newErrors;
    });
  };

  // Generate placeholder SVG for failed images
  const getPlaceholderSrc = (index: number) => {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f3f4f6"/>
        <text x="200" y="150" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="14">
          SREF ${sref.code}-${index + 1}
        </text>
      </svg>
    `)}`;
  };

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800">
      {/* Image Grid - 2x2 layout matching midjourneysref.com */}
      <div className="relative aspect-square">
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-full">
          {sref.images.slice(0, 4).map((image, index) => (
            <div
              key={index}
              className="relative bg-gray-100 dark:bg-gray-800 overflow-hidden cursor-pointer group-hover:brightness-110 transition-all"
              onMouseEnter={() => setHoveredImage(index)}
            >
              <Image
                src={imageError[index] ? getPlaceholderSrc(index) : image}
                alt={`${sref.title} example ${index + 1}`}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                priority={priority && index === 0}
                onError={() => handleImageError(index)}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            </div>
          ))}
        </div>
        
        {/* Premium badge */}
        {sref.premium && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            👑 PRO
          </div>
        )}
        
        {/* Featured badge */}
        {sref.featured && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            ⭐ Featured
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* SREF Code and Title */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-sm font-mono text-blue-600 dark:text-blue-400 mb-1">
              SREF: {sref.code}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-2">
              {sref.title}
            </h3>
          </div>
          <Link 
            href={`/sref/${sref.code}`}
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Description */}
        {sref.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {sref.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {sref.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
          {sref.tags.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              +{sref.tags.length - 3}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              👀 {sref.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              ❤️ {sref.likes.toLocaleString()}
            </span>
          </div>
          <div className="text-xs">
            #{sref.ranking?.allTime || 'N/A'}
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors duration-200 pointer-events-none" />
    </div>
  );
}