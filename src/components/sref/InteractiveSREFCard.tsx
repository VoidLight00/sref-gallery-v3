'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { SREFItem } from '@/lib/types/sref';
import { toast } from '@/components/ui/Toast';

interface InteractiveSREFCardProps {
  sref: SREFItem;
  priority?: boolean;
  onLike?: (srefId: string, liked: boolean) => void;
  onBookmark?: (srefId: string, bookmarked: boolean) => void;
  onCopy?: (srefCode: string) => void;
}

export default function InteractiveSREFCard({ 
  sref, 
  priority = false,
  onLike,
  onBookmark,
  onCopy
}: InteractiveSREFCardProps) {
  const [_hoveredImage, setHoveredImage] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean[]>([false, false, false, false]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(sref.likes);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleImageError = (index: number) => {
    setImageError(prev => {
      const newErrors = [...prev];
      newErrors[index] = true;
      return newErrors;
    });
  };

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

  const handleCopyClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`--sref ${sref.code}`);
      
      // Trigger callback
      onCopy?.(sref.code);
      
      // Show toast notification
      toast.success('SREF Code Copied!', `--sref ${sref.code} is ready to paste in Midjourney`, {
        duration: 3000,
        action: {
          label: 'View Examples',
          onClick: () => window.open(`/sref/${sref.code}`, '_blank')
        }
      });
      
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = `--sref ${sref.code}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      // Show toast notification
      toast.success('SREF Code Copied!', `--sref ${sref.code} is ready to paste in Midjourney`);
    }
  }, [sref.code, onCopy]);

  const handleLikeClick = useCallback(() => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikes(prev => newLikedState ? prev + 1 : prev - 1);
    setIsAnimating(true);
    
    // Trigger callback
    onLike?.(sref.id, newLikedState);
    
    // Show toast notification
    if (newLikedState) {
      toast.success('Added to Favorites!', `"${sref.title}" has been liked`, {
        duration: 2000
      });
    } else {
      toast.info('Removed from Favorites', `"${sref.title}" has been unliked`, {
        duration: 2000
      });
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [isLiked, sref.id, sref.title, onLike]);

  const handleBookmarkClick = useCallback(() => {
    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);
    setIsAnimating(true);
    
    // Trigger callback
    onBookmark?.(sref.id, newBookmarkedState);
    
    // Show toast notification
    if (newBookmarkedState) {
      toast.success('Bookmarked!', `"${sref.title}" saved to your collection`, {
        duration: 2500,
        action: {
          label: 'View All',
          onClick: () => window.open('/bookmarks', '_blank')
        }
      });
    } else {
      toast.info('Bookmark Removed', `"${sref.title}" removed from collection`, {
        duration: 2000
      });
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [isBookmarked, sref.id, sref.title, onBookmark]);

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 relative">

      {/* Image Grid - 2x2 layout */}
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
        
        {/* Action Buttons Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {/* Copy Button */}
            <button
              onClick={handleCopyClick}
              className={`bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 ${
                isAnimating ? 'animate-pulse scale-110' : ''
              }`}
              title="Copy SREF Code"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            
            {/* Like Button */}
            <button
              onClick={handleLikeClick}
              className={`${
                isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 text-gray-700 hover:bg-red-50 hover:text-red-500'
              } p-2 rounded-full shadow-lg transition-all duration-200 ${
                isAnimating ? 'animate-bounce scale-110' : ''
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            
            {/* Bookmark Button */}
            <button
              onClick={handleBookmarkClick}
              className={`${
                isBookmarked 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-white/90 text-gray-700 hover:bg-yellow-50 hover:text-yellow-500'
              } p-2 rounded-full shadow-lg transition-all duration-200 ${
                isAnimating ? 'animate-bounce scale-110' : ''
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
            >
              <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Premium badge */}
        {sref.premium && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            👑 PRO
          </div>
        )}
        
        {/* Featured badge */}
        {sref.featured && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            ⭐ Featured
          </div>
        )}

        {/* Quick Copy Button (Always Visible) */}
        <div className="absolute bottom-3 right-3">
          <button
            onClick={handleCopyClick}
            className="bg-gray-900/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium hover:bg-gray-900 transition-all duration-200 flex items-center gap-1"
            title="Copy SREF Code"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
        </div>
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
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
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

        {/* Stats with Interactive Elements */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              👀 {sref.views.toLocaleString()}
            </span>
            <button
              onClick={handleLikeClick}
              className={`flex items-center gap-1 transition-colors ${
                isLiked ? 'text-red-500' : 'hover:text-red-500'
              }`}
            >
              <span>{isLiked ? '❤️' : '🤍'}</span>
              {likes.toLocaleString()}
            </button>
            <button
              onClick={handleBookmarkClick}
              className={`flex items-center gap-1 transition-colors ${
                isBookmarked ? 'text-yellow-500' : 'hover:text-yellow-500'
              }`}
            >
              <span>{isBookmarked ? '🔖' : '📖'}</span>
              {isBookmarked ? 'Saved' : 'Save'}
            </button>
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