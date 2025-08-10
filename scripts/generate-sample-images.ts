#!/usr/bin/env tsx

/**
 * Generate sample images for all SREF codes in the database
 * This script creates placeholder images for development and testing
 */

import { imageProcessor } from '../src/lib/utils/imageProcessor';
import { testSREFData } from '../src/lib/data/sref-data';
import path from 'path';
import fs from 'fs/promises';

interface GenerationStats {
  totalGenerated: number;
  categoryCounts: Record<string, number>;
  errors: string[];
  startTime: number;
  endTime: number;
}

async function generateSampleImages(): Promise<GenerationStats> {
  const stats: GenerationStats = {
    totalGenerated: 0,
    categoryCounts: {},
    errors: [],
    startTime: Date.now(),
    endTime: 0
  };

  console.log('🎨 Starting SREF Gallery image generation...\n');

  try {
    // Ensure the base image directories exist
    const publicDir = path.join(process.cwd(), 'public');
    const imageDir = path.join(publicDir, 'images', 'sref');
    
    await fs.mkdir(imageDir, { recursive: true });
    console.log(`📁 Created image directory: ${imageDir}`);

    // Process each SREF item
    for (const sref of testSREFData) {
      console.log(`\n🔄 Processing SREF ${sref.code} (${sref.category})`);
      
      try {
        // Initialize category count
        if (!stats.categoryCounts[sref.category]) {
          stats.categoryCounts[sref.category] = 0;
        }

        // Generate images for this SREF
        const results = await imageProcessor.processSREFImages(
          sref.code, 
          sref.category, 
          4, // 4 images per SREF
          {
            quality: 85,
            format: 'webp',
            generatePlaceholder: true
          }
        );

        console.log(`  ✅ Generated ${results.length} images for SREF ${sref.code}`);
        
        stats.totalGenerated += results.length;
        stats.categoryCounts[sref.category] += results.length;

      } catch (error) {
        const errorMsg = `Failed to process SREF ${sref.code}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`  ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    // Generate additional category-specific placeholder images
    console.log('\n🎯 Generating category placeholder images...');
    
    const categories = ['anime', 'photography', 'art', 'digital', 'vintage'];
    for (const category of categories) {
      try {
        const categoryDir = path.join(imageDir, category);
        await fs.mkdir(categoryDir, { recursive: true });
        
        // Generate a generic category placeholder
        const placeholderPath = path.join(categoryDir, `${category}-placeholder.webp`);
        await imageProcessor.generatePlaceholder('XXXX', 0, placeholderPath, { 
          category,
          width: 800,
          height: 800
        });
        
        console.log(`  ✅ Generated placeholder for ${category} category`);
      } catch (error) {
        console.error(`  ❌ Failed to create placeholder for ${category}:`, error);
      }
    }

    stats.endTime = Date.now();
    
    // Print summary
    console.log('\n📊 Generation Summary:');
    console.log('=' .repeat(50));
    console.log(`📈 Total images generated: ${stats.totalGenerated}`);
    console.log(`⏱️  Time taken: ${((stats.endTime - stats.startTime) / 1000).toFixed(2)}s`);
    console.log('\n📂 Images by category:');
    
    Object.entries(stats.categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category.padEnd(15)}: ${count} images`);
    });

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach(error => console.log(`  • ${error}`));
    }

    // Get final image statistics
    const imageStats = await imageProcessor.getImageStats();
    console.log('\n🗂️  Final Image Statistics:');
    console.log(`   Total files: ${imageStats.totalImages}`);
    console.log(`   Total size: ${(imageStats.totalSize / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('❌ Fatal error during image generation:', error);
    stats.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return stats;
}

// Enhanced SREF sample data for testing
const enhancedSREFData = [
  // Art category
  {
    id: 'sref_art_001',
    code: '8462951730',
    category: 'art',
    title: 'Abstract Digital Art',
    description: 'Modern abstract digital art style'
  },
  {
    id: 'sref_art_002',
    code: '9573186420',
    category: 'art',
    title: 'Oil Painting Style',
    description: 'Classical oil painting technique'
  },
  {
    id: 'sref_art_003',
    code: '1597348260',
    category: 'art',
    title: 'Watercolor Style',
    description: 'Soft watercolor painting style'
  },

  // Digital category
  {
    id: 'sref_digital_001',
    code: '7419628530',
    category: 'digital',
    title: 'Cyberpunk Style',
    description: 'Futuristic cyberpunk aesthetic'
  },
  {
    id: 'sref_digital_002',
    code: '8520741630',
    category: 'digital',
    title: 'Neon Synthwave',
    description: 'Retro synthwave with neon colors'
  },

  // Vintage category
  {
    id: 'sref_vintage_001',
    code: '9630852740',
    category: 'vintage',
    title: 'Film Photography',
    description: '35mm film photography aesthetic'
  },
  {
    id: 'sref_vintage_002',
    code: '7418529630',
    category: 'vintage',
    title: 'Polaroid Style',
    description: 'Instant polaroid camera style'
  }
];

async function generateEnhancedSamples(): Promise<void> {
  console.log('\n🔧 Generating enhanced sample images...');
  
  for (const sref of enhancedSREFData) {
    try {
      await imageProcessor.processSREFImages(sref.code, sref.category, 4);
      console.log(`  ✅ Generated enhanced samples for ${sref.code} (${sref.category})`);
    } catch (error) {
      console.error(`  ❌ Failed to generate enhanced samples for ${sref.code}:`, error);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 SREF Gallery Image Generator\n');
  
  try {
    // Generate main sample images
    const stats = await generateSampleImages();
    
    // Generate additional enhanced samples
    await generateEnhancedSamples();
    
    console.log('\n🎉 Image generation completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Run `npm run dev` to start the development server');
    console.log('  2. Visit http://localhost:3000 to see the gallery with images');
    console.log('  3. For production, configure CDN settings in .env.local');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Image generation failed:', error);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

export { generateSampleImages, generateEnhancedSamples };