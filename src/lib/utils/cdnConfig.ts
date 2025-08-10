/**
 * CDN Configuration for SREF Gallery
 * Supports multiple CDN providers: Cloudinary, AWS CloudFront, Vercel
 */

export interface CDNConfig {
  provider: 'cloudinary' | 'aws' | 'vercel' | 'local';
  baseUrl: string;
  transformationParams: Record<string, any>;
  fallbackUrl?: string;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'pad';
  gravity?: 'center' | 'face' | 'north' | 'south' | 'east' | 'west';
  blur?: number;
  sharpen?: boolean;
  progressive?: boolean;
}

/**
 * CDN Manager for optimized image delivery
 */
export class CDNManager {
  private config: CDNConfig;

  constructor(config?: Partial<CDNConfig>) {
    this.config = {
      provider: (process.env.CDN_PROVIDER as any) || 'local',
      baseUrl: process.env.CDN_BASE_URL || '',
      transformationParams: {},
      fallbackUrl: '/images',
      ...config
    };
  }

  /**
   * Generate optimized image URL based on CDN provider
   */
  getImageUrl(imagePath: string, options: ImageTransformOptions = {}): string {
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    switch (this.config.provider) {
      case 'cloudinary':
        return this.buildCloudinaryUrl(cleanPath, options);
      
      case 'aws':
        return this.buildAWSUrl(cleanPath, options);
      
      case 'vercel':
        return this.buildVercelUrl(cleanPath, options);
      
      case 'local':
      default:
        return this.buildLocalUrl(cleanPath, options);
    }
  }

  /**
   * Build Cloudinary URL with transformations
   */
  private buildCloudinaryUrl(imagePath: string, options: ImageTransformOptions): string {
    const { baseUrl } = this.config;
    const transformations: string[] = [];

    if (options.width && options.height) {
      transformations.push(`w_${options.width},h_${options.height}`);
    } else if (options.width) {
      transformations.push(`w_${options.width}`);
    } else if (options.height) {
      transformations.push(`h_${options.height}`);
    }

    if (options.crop && options.crop !== 'scale') {
      const cropMap = {
        fill: 'c_fill',
        fit: 'c_fit',
        crop: 'c_crop',
        pad: 'c_pad',
        scale: 'c_scale'
      };
      transformations.push(cropMap[options.crop]);
    }

    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }

    if (options.format && options.format !== 'auto') {
      transformations.push(`f_${options.format}`);
    } else {
      transformations.push('f_auto');
    }

    if (options.gravity && options.gravity !== 'center') {
      transformations.push(`g_${options.gravity}`);
    }

    if (options.blur) {
      transformations.push(`e_blur:${options.blur * 100}`);
    }

    if (options.sharpen) {
      transformations.push('e_sharpen');
    }

    if (options.progressive) {
      transformations.push('fl_progressive');
    }

    const transformationString = transformations.length > 0 
      ? `/${transformations.join(',')}`
      : '';

    return `${baseUrl}${transformationString}/${imagePath}`;
  }

  /**
   * Build AWS CloudFront URL with query parameters
   */
  private buildAWSUrl(imagePath: string, options: ImageTransformOptions): string {
    const { baseUrl } = this.config;
    const params = new URLSearchParams();

    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);

    const queryString = params.toString();
    const separator = queryString ? '?' : '';

    return `${baseUrl}/${imagePath}${separator}${queryString}`;
  }

  /**
   * Build Vercel Image Optimization URL
   */
  private buildVercelUrl(imagePath: string, options: ImageTransformOptions): string {
    const params = new URLSearchParams();
    
    params.set('url', `/${imagePath}`);
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());

    return `/_next/image?${params.toString()}`;
  }

  /**
   * Build local development URL
   */
  private buildLocalUrl(imagePath: string, options: ImageTransformOptions): string {
    // For local development, return the original path
    // Image optimization would be handled by Next.js Image component
    return `/${imagePath}`;
  }

  /**
   * Generate responsive image URLs for different screen sizes
   */
  getResponsiveUrls(imagePath: string, baseOptions: ImageTransformOptions = {}): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  } {
    return {
      thumbnail: this.getImageUrl(imagePath, { ...baseOptions, width: 200, height: 200 }),
      small: this.getImageUrl(imagePath, { ...baseOptions, width: 400, height: 400 }),
      medium: this.getImageUrl(imagePath, { ...baseOptions, width: 800, height: 800 }),
      large: this.getImageUrl(imagePath, { ...baseOptions, width: 1200, height: 1200 }),
      original: this.getImageUrl(imagePath, baseOptions)
    };
  }

  /**
   * Generate WebP and AVIF variants with fallbacks
   */
  getModernFormats(imagePath: string, options: ImageTransformOptions = {}): {
    avif: string;
    webp: string;
    jpeg: string;
  } {
    return {
      avif: this.getImageUrl(imagePath, { ...options, format: 'avif' }),
      webp: this.getImageUrl(imagePath, { ...options, format: 'webp' }),
      jpeg: this.getImageUrl(imagePath, { ...options, format: 'jpeg' })
    };
  }

  /**
   * Generate placeholder image URL
   */
  getPlaceholderUrl(imagePath: string, options: ImageTransformOptions = {}): string {
    return this.getImageUrl(imagePath, {
      ...options,
      width: 32,
      height: 32,
      quality: 20,
      blur: 2
    });
  }

  /**
   * Preload critical images
   */
  preloadImage(imagePath: string, options: ImageTransformOptions = {}): void {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = this.getImageUrl(imagePath, options);
    
    // Add responsive preloading
    if (options.width || options.height) {
      const responsive = this.getResponsiveUrls(imagePath, options);
      link.setAttribute('imagesizes', '(max-width: 768px) 100vw, 50vw');
      link.setAttribute('imagesrcset', [
        `${responsive.small} 400w`,
        `${responsive.medium} 800w`,
        `${responsive.large} 1200w`
      ].join(', '));
    }

    document.head.appendChild(link);
  }

  /**
   * Update CDN configuration
   */
  updateConfig(newConfig: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CDNConfig {
    return { ...this.config };
  }
}

// Default CDN configuration based on environment
const getDefaultConfig = (): CDNConfig => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return {
      provider: 'local',
      baseUrl: '',
      transformationParams: {}
    };
  }

  // Production configuration
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return {
      provider: 'cloudinary',
      baseUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      transformationParams: {
        quality: 'auto',
        format: 'auto'
      },
      fallbackUrl: '/images'
    };
  }

  if (process.env.AWS_CLOUDFRONT_DOMAIN) {
    return {
      provider: 'aws',
      baseUrl: `https://${process.env.AWS_CLOUDFRONT_DOMAIN}`,
      transformationParams: {},
      fallbackUrl: '/images'
    };
  }

  // Default to Vercel Image Optimization
  return {
    provider: 'vercel',
    baseUrl: '',
    transformationParams: {},
    fallbackUrl: '/images'
  };
};

// Export singleton instance
export const cdnManager = new CDNManager(getDefaultConfig());

// Utility functions
export const getOptimizedImageUrl = (
  imagePath: string, 
  options?: ImageTransformOptions
) => cdnManager.getImageUrl(imagePath, options);

export const getResponsiveImageUrls = (
  imagePath: string, 
  options?: ImageTransformOptions
) => cdnManager.getResponsiveUrls(imagePath, options);