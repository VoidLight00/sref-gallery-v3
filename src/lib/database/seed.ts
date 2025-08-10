import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { passwordUtils } from '../../server/middleware/auth';

const prisma = new PrismaClient();

interface RealSrefData {
  research_metadata: any;
  real_sref_codes: Array<{
    code: string;
    title: string;
    category: string;
    description: string;
    tags: string[];
    popularity: number;
    likes: number;
    views: number;
    style_type: string;
    verified: boolean;
    community_rating: number;
  }>;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Load real SREF data
    const srefDataPath = join(process.cwd(), 'research-data', 'real-sref-collection.json');
    const srefData: RealSrefData = JSON.parse(readFileSync(srefDataPath, 'utf-8'));

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@sref-gallery.com' },
      update: {},
      create: {
        email: 'admin@sref-gallery.com',
        username: 'admin',
        passwordHash: await passwordUtils.hash('admin123!'),
        firstName: 'Admin',
        lastName: 'User',
        admin: true,
        premium: true,
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    // Create premium test user
    console.log('👤 Creating premium test user...');
    const premiumUser = await prisma.user.upsert({
      where: { email: 'premium@sref-gallery.com' },
      update: {},
      create: {
        email: 'premium@sref-gallery.com',
        username: 'premium_user',
        passwordHash: await passwordUtils.hash('premium123!'),
        firstName: 'Premium',
        lastName: 'User',
        premium: true,
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    // Create regular test user
    console.log('👤 Creating regular test user...');
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@sref-gallery.com' },
      update: {},
      create: {
        email: 'user@sref-gallery.com',
        username: 'regular_user',
        passwordHash: await passwordUtils.hash('user123!'),
        firstName: 'Regular',
        lastName: 'User',
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    // Create categories based on research data
    console.log('📂 Creating categories...');
    const categoryMap = new Map();

    const categories = [
      { name: 'Anime & Manga', slug: 'anime', description: 'Japanese anime and manga style references', icon: '🎌', featured: true },
      { name: 'Photography', slug: 'photography', description: 'Professional photography and film styles', icon: '📸', featured: true },
      { name: 'Illustration', slug: 'illustration', description: 'Digital and traditional illustration styles', icon: '🎨', featured: true },
      { name: 'Traditional Art', slug: 'traditional-art', description: 'Classical art techniques and mediums', icon: '🖼️', featured: false },
      { name: 'Digital Art', slug: 'digital-art', description: 'Modern digital art and design styles', icon: '💻', featured: false },
      { name: 'Color Themed', slug: 'color-themed', description: 'Styles focused on specific color palettes', icon: '🌈', featured: false },
      { name: 'Line Art', slug: 'line-art', description: 'Clean line art and minimalist drawing styles', icon: '✏️', featured: false },
      { name: 'Surreal', slug: 'surreal', description: 'Surrealistic and abstract artistic styles', icon: '🔮', featured: false },
      { name: 'Fantasy', slug: 'fantasy', description: 'Fantasy and magical themed styles', icon: '🧚', featured: false },
      { name: 'Modern Art', slug: 'modern-art', description: 'Contemporary and modern art styles', icon: '🏢', featured: false },
      { name: 'Vintage', slug: 'vintage', description: 'Retro and vintage aesthetic styles', icon: '📻', featured: false },
      { name: 'Trending', slug: 'trending', description: 'Currently trending and popular styles', icon: '🔥', featured: true },
      { name: 'Expressive Art', slug: 'expressive-art', description: 'Emotional and expressive art styles', icon: '🎭', featured: false }
    ];

    for (const cat of categories) {
      const category = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat
      });
      categoryMap.set(cat.slug, category);
    }

    // Map research categories to our categories
    const categoryMapping: { [key: string]: string } = {
      'anime': 'anime',
      'photography': 'photography', 
      'illustration': 'illustration',
      'digital-art': 'digital-art',
      'fantasy': 'fantasy',
      'color-themed': 'color-themed',
      'traditional-art': 'traditional-art',
      'modern-art': 'modern-art',
      'line-art': 'line-art',
      'surreal': 'surreal',
      'trending': 'trending',
      'vintage': 'vintage',
      'expressive-art': 'expressive-art'
    };

    // Create SREF codes from research data
    console.log('🎨 Creating SREF codes...');
    let createdSrefs = 0;

    for (const srefData of srefData.real_sref_codes) {
      try {
        // Map category
        const categorySlug = categoryMapping[srefData.category] || 'digital-art';
        const category = categoryMap.get(categorySlug);

        // Create or find tags
        const tagPromises = srefData.tags.map(async (tagName) => {
          return await prisma.tag.upsert({
            where: { name: tagName.toLowerCase() },
            update: {},
            create: {
              name: tagName.toLowerCase(),
              slug: tagName.toLowerCase().replace(/\s+/g, '-'),
              description: `Style related to ${tagName}`,
              usageCount: 1
            }
          });
        });

        const tags = await Promise.all(tagPromises);

        // Generate slug
        const slug = `${srefData.code}-${srefData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50)}`;

        // Determine if this should be premium (top 30% by popularity)
        const isPremium = srefData.popularity > 85;
        
        // Determine if this should be featured (top 20% by popularity)
        const isFeatured = srefData.popularity > 90;

        // Create SREF code
        const sref = await prisma.srefCode.create({
          data: {
            code: srefData.code,
            title: srefData.title,
            description: srefData.description,
            slug,
            popularityScore: srefData.popularity,
            views: srefData.views,
            likes: srefData.likes,
            verified: srefData.verified,
            featured: isFeatured,
            premium: isPremium,
            status: 'ACTIVE',
            submittedById: adminUser.id,
            approvedById: adminUser.id,
            approvedAt: new Date(),
            metaDescription: `${srefData.title}: ${srefData.description}`,
            metaKeywords: srefData.tags,
            promptExamples: [
              `${srefData.title} style portrait`,
              `landscape in ${srefData.title.toLowerCase()} style`,
              `character design, ${srefData.title.toLowerCase()} aesthetic`
            ],
            categories: {
              create: [{
                categoryId: category.id
              }]
            },
            tags: {
              create: tags.map(tag => ({
                tagId: tag.id
              }))
            }
          }
        });

        // Create placeholder images
        const imagePromises = [];
        for (let i = 1; i <= 4; i++) {
          imagePromises.push(
            prisma.srefImage.create({
              data: {
                srefId: sref.id,
                imageUrl: `https://picsum.photos/512/512?random=${sref.code}_${i}`,
                thumbnailUrl: `https://picsum.photos/256/256?random=${sref.code}_${i}`,
                imageOrder: i,
                altText: `${srefData.title} example ${i}`,
                width: 512,
                height: 512,
                format: 'jpg',
                blurHash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
                processed: true
              }
            })
          );
        }

        await Promise.all(imagePromises);
        createdSrefs++;

        if (createdSrefs % 10 === 0) {
          console.log(`  ✅ Created ${createdSrefs} SREF codes...`);
        }

      } catch (error) {
        console.error(`❌ Failed to create SREF ${srefData.code}:`, error);
      }
    }

    // Update category counts
    console.log('📊 Updating category counts...');
    const categoryUpdates = [];
    for (const [slug, category] of categoryMap) {
      categoryUpdates.push(
        prisma.category.update({
          where: { id: category.id },
          data: {
            srefCount: await prisma.srefCode.count({
              where: {
                categories: {
                  some: { categoryId: category.id }
                },
                status: 'ACTIVE'
              }
            })
          }
        })
      );
    }
    await Promise.all(categoryUpdates);

    // Update tag usage counts
    console.log('🏷️ Updating tag usage counts...');
    const tags = await prisma.tag.findMany();
    const tagUpdates = [];
    for (const tag of tags) {
      tagUpdates.push(
        prisma.tag.update({
          where: { id: tag.id },
          data: {
            usageCount: await prisma.srefTag.count({
              where: { tagId: tag.id }
            })
          }
        })
      );
    }
    await Promise.all(tagUpdates);

    // Create some sample user interactions
    console.log('❤️ Creating sample user interactions...');
    
    // Get some random SREFs for interactions
    const sampleSrefs = await prisma.srefCode.findMany({
      take: 20,
      orderBy: { popularityScore: 'desc' }
    });

    // Create some favorites
    for (let i = 0; i < 10; i++) {
      const sref = sampleSrefs[i];
      await prisma.userFavorite.upsert({
        where: {
          userId_srefId: {
            userId: premiumUser.id,
            srefId: sref.id
          }
        },
        update: {},
        create: {
          userId: premiumUser.id,
          srefId: sref.id
        }
      });

      // Update favorites count
      await prisma.srefCode.update({
        where: { id: sref.id },
        data: { favorites: { increment: 1 } }
      });
    }

    // Create some likes
    for (let i = 5; i < 15; i++) {
      const sref = sampleSrefs[i];
      await prisma.userLike.upsert({
        where: {
          userId_srefId: {
            userId: regularUser.id,
            srefId: sref.id
          }
        },
        update: {},
        create: {
          userId: regularUser.id,
          srefId: sref.id
        }
      });
    }

    // Create some analytics data
    console.log('📈 Creating sample analytics...');
    const analyticsPromises = [];
    for (let i = 0; i < 100; i++) {
      const randomSref = sampleSrefs[Math.floor(Math.random() * sampleSrefs.length)];
      const randomUser = Math.random() > 0.7 ? [premiumUser.id, regularUser.id][Math.floor(Math.random() * 2)] : null;
      
      analyticsPromises.push(
        prisma.srefAnalytic.create({
          data: {
            srefId: randomSref.id,
            eventType: ['VIEW', 'LIKE', 'FAVORITE', 'DOWNLOAD'][Math.floor(Math.random() * 4)] as any,
            userId: randomUser,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
            userAgent: 'Mozilla/5.0 (sample)',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random time in last 30 days
          }
        })
      );
    }
    await Promise.all(analyticsPromises);

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - SREF Codes: ${createdSrefs}`);
    console.log(`   - Tags: ${(await prisma.tag.count())}`);
    console.log(`   - Users: 3 (admin, premium, regular)`);
    console.log(`   - Test credentials:`);
    console.log(`     Admin: admin@sref-gallery.com / admin123!`);
    console.log(`     Premium: premium@sref-gallery.com / premium123!`);
    console.log(`     Regular: user@sref-gallery.com / user123!`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });