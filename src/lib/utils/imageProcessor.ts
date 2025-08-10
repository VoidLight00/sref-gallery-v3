import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export interface ImageProcessingOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  sizes?: { width: number; height: number; suffix: string }[];
  generatePlaceholder?: boolean;
}

export interface ProcessedImageResult {
  originalPath: string;
  processedPaths: string[];
  placeholder?: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * Image processing utility for SREF Gallery
 * Handles optimization, format conversion, and responsive sizing
 */
export class ImageProcessor {
  private publicDir: string;
  private imageDir: string;

  constructor() {
    this.publicDir = path.join(process.cwd(), 'public');
    this.imageDir = path.join(this.publicDir, 'images');
  }

  /**
   * Process a single image with optimization and multiple formats
   */
  async processImage(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult> {
    const {
      quality = 85,
      format = 'webp',
      sizes = [
        { width: 400, height: 400, suffix: 'thumb' },
        { width: 800, height: 800, suffix: 'medium' },
        { width: 1200, height: 1200, suffix: 'large' }
      ],
      generatePlaceholder = true
    } = options;

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const processedPaths: string[] = [];
    let placeholder: string | undefined;

    // Get image metadata
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Process original image
    const originalOutput = outputPath.replace(/\.[^.]+$/, `.${format}`);
    await image
      .toFormat(format, { quality })
      .toFile(originalOutput);
    processedPaths.push(originalOutput);

    // Generate responsive sizes
    for (const size of sizes) {
      const sizedOutput = outputPath.replace(
        /(\.[^.]+)$/,
        `-${size.suffix}.$1`
      ).replace(/\.[^.]+$/, `.${format}`);

      await sharp(inputPath)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .toFormat(format, { quality })
        .toFile(sizedOutput);

      processedPaths.push(sizedOutput);
    }

    // Generate low-quality placeholder
    if (generatePlaceholder) {
      const placeholderBuffer = await sharp(inputPath)
        .resize(32, 32, { fit: 'cover' })
        .blur(2)
        .webp({ quality: 20 })
        .toBuffer();

      placeholder = `data:image/webp;base64,${placeholderBuffer.toString('base64')}`;
    }

    return {
      originalPath: inputPath,
      processedPaths,
      placeholder,
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: (await fs.stat(inputPath)).size
      }
    };
  }

  /**
   * Generate placeholder image for SREF codes
   */
  async generatePlaceholder(
    srefCode: string,
    index: number,
    outputPath: string,
    options: { width?: number; height?: number; category?: string } = {}
  ): Promise<string> {
    const { width = 400, height = 400, category = 'default' } = options;

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Color scheme based on category
    const colorSchemes = {
      anime: { bg: '#FFE5F1', text: '#E91E63', accent: '#FF4081' },
      photography: { bg: '#E3F2FD', text: '#1976D2', accent: '#2196F3' },
      art: { bg: '#F3E5F5', text: '#7B1FA2', accent: '#9C27B0' },
      default: { bg: '#F5F5F5', text: '#424242', accent: '#757575' }
    };

    const colors = colorSchemes[category as keyof typeof colorSchemes] || colorSchemes.default;

    // Generate SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:0.1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        <circle cx="${width/2}" cy="${height/2 - 30}" r="40" fill="${colors.accent}" opacity="0.2"/>
        <text x="${width/2}" y="${height/2 - 10}" text-anchor="middle" fill="${colors.text}" 
              font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">
          SREF ${srefCode}
        </text>
        <text x="${width/2}" y="${height/2 + 15}" text-anchor="middle" fill="${colors.text}" 
              font-family="system-ui, -apple-system, sans-serif" font-size="12" opacity="0.7">
          Example ${index + 1}
        </text>
        <rect x="20" y="20" width="${width - 40}" height="${height - 40}" 
              fill="none" stroke="${colors.accent}" stroke-width="2" 
              stroke-dasharray="5,5" opacity="0.3" rx="8"/>
      </svg>
    `;

    // Convert SVG to WebP
    const webpOutput = outputPath.replace(/\.[^.]+$/, '.webp');
    await sharp(Buffer.from(svg))
      .webp({ quality: 85 })
      .toFile(webpOutput);

    return webpOutput;
  }

  /**
   * Batch process images for a SREF code
   */
  async processSREFImages(
    srefCode: string,
    category: string,
    imageCount: number = 4,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult[]> {
    const results: ProcessedImageResult[] = [];
    const categoryDir = path.join(this.imageDir, 'sref', category);
    
    await fs.mkdir(categoryDir, { recursive: true });

    // Generate placeholder images for now (since we don't have real images)
    for (let i = 0; i < imageCount; i++) {
      const placeholderPath = path.join(categoryDir, `sref-${srefCode}-${i + 1}.webp`);
      
      await this.generatePlaceholder(srefCode, i, placeholderPath, {
        category,
        width: 400,
        height: 400
      });

      // Create a mock result for the placeholder
      results.push({
        originalPath: placeholderPath,
        processedPaths: [placeholderPath],
        placeholder: undefined, // We don't need a placeholder for a placeholder
        metadata: {
          width: 400,
          height: 400,
          format: 'webp',
          size: 0 // Will be filled after file creation
        }
      });
    }

    return results;
  }

  /**
   * Generate optimized images for all SREF data
   */
  async generateAllSREFImages(srefData: any[]): Promise<void> {
    for (const sref of srefData) {
      console.log(`Generating images for SREF ${sref.code} (${sref.category})`);
      await this.processSREFImages(sref.code, sref.category, 4);
    }
  }

  /**
   * Clean up old images
   */
  async cleanupImages(pattern: string): Promise<void> {
    // Implementation for cleaning up old or unused images
    // This would be used for maintenance
  }

  /**
   * Get image statistics
   */
  async getImageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    categories: Record<string, number>;
  }> {
    const stats = {
      totalImages: 0,
      totalSize: 0,
      categories: {} as Record<string, number>
    };

    try {
      const srefDir = path.join(this.imageDir, 'sref');
      const categories = await fs.readdir(srefDir);

      for (const category of categories) {
        const categoryPath = path.join(srefDir, category);
        const files = await fs.readdir(categoryPath);
        
        stats.categories[category] = files.length;
        stats.totalImages += files.length;

        // Calculate total size
        for (const file of files) {
          const filePath = path.join(categoryPath, file);
          const fileStat = await fs.stat(filePath);
          stats.totalSize += fileStat.size;
        }
      }
    } catch (error) {
      console.warn('Error calculating image stats:', error);
    }

    return stats;
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();