'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  quality?: number;
}

/**
 * Progressive Image component with placeholder, lazy loading, and fallback support
 * Optimized for SREF Gallery image display
 */
export default function ProgressiveImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder,
  fallbackSrc,
  onLoad,
  onError,
  sizes,
  quality = 85
}: ProgressiveImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate SVG placeholder if none provided
  const defaultPlaceholder = placeholder || `data:image/svg+xml,${encodeURIComponent(`
    <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <rect x="20%" y="30%" width="60%" height="40%" rx="8" fill="#e2e8f0"/>
      <circle cx="35%" cy="45%" r="8" fill="#cbd5e1"/>
      <rect x="50%" y="60%" width="30%" height="4" rx="2" fill="#e2e8f0"/>
      <rect x="50%" y="68%" width="20%" height="4" rx="2" fill="#e2e8f0"/>
    </svg>
  `)}`;

  const handleImageLoad = () => {
    setImageState('loaded');
    onLoad?.();
  };

  const handleImageError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setImageState('error');
    onError?.();
  };

  // Intersection Observer for lazy loading (when not priority)
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const baseClassName = `transition-all duration-300 ${className}`;
  
  // Loading state classes
  const loadingClassName = imageState === 'loading' 
    ? 'opacity-0 scale-95' 
    : 'opacity-100 scale-100';

  // Render different states
  if (imageState === 'error') {
    return (
      <div 
        className={`${baseClassName} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-400 dark:text-gray-600">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Placeholder/blur layer */}
      {imageState === 'loading' && (
        <div className="absolute inset-0">
          <Image
            src={defaultPlaceholder}
            alt=""
            fill
            className="object-cover blur-sm scale-110 opacity-50"
            priority={priority}
          />
          {/* Loading animation overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      )}

      {/* Main image */}
      <Image
        ref={imgRef}
        src={priority ? currentSrc : defaultPlaceholder}
        data-src={!priority ? currentSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        className={`${baseClassName} ${loadingClassName} object-cover`}
        priority={priority}
        onLoad={handleImageLoad}
        onError={handleImageError}
        sizes={sizes}
        quality={quality}
        fill={!width && !height}
      />

      {/* Loading spinner for priority images */}
      {imageState === 'loading' && priority && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-800/50">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}