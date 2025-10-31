import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Abstract',
        slug: 'abstract',
        description: 'Abstract and conceptual styles',
        icon: '🎨',
        color: '#FF6B6B',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Anime',
        slug: 'anime',
        description: 'Anime and manga inspired styles',
        icon: '🎌',
        color: '#4ECDC4',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Photography',
        slug: 'photography',
        description: 'Photographic and realistic styles',
        icon: '📷',
        color: '#45B7D1',
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy and magical styles',
        icon: '🔮',
        color: '#96CEB4',
        sortOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Minimal',
        slug: 'minimal',
        description: 'Minimalist and clean styles',
        icon: '⚪',
        color: '#FFEAA7',
        sortOrder: 5,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Cyberpunk',
        slug: 'cyberpunk',
        description: 'Futuristic and cyberpunk styles',
        icon: '🤖',
        color: '#DDA0DD',
        sortOrder: 6,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'trending' } }),
    prisma.tag.create({ data: { name: 'popular' } }),
    prisma.tag.create({ data: { name: 'new' } }),
    prisma.tag.create({ data: { name: 'aesthetic' } }),
    prisma.tag.create({ data: { name: 'vibrant' } }),
    prisma.tag.create({ data: { name: 'dark' } }),
    prisma.tag.create({ data: { name: 'light' } }),
    prisma.tag.create({ data: { name: 'colorful' } }),
    prisma.tag.create({ data: { name: 'monochrome' } }),
    prisma.tag.create({ data: { name: 'vintage' } }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      image: '/avatars/default.jpg',
    },
  });

  console.log('✅ Created test user (test@example.com / password123)');

  // Create SREF codes with real data
  const srefData = [
    {
      code: '1747943467',
      title: 'Dreamy Watercolor',
      description: 'Soft, ethereal watercolor style with pastel tones',
      category: 'abstract',
      tags: ['trending', 'aesthetic', 'light'],
      featured: true,
      viewCount: 1234,
      likeCount: 89,
    },
    {
      code: '2849203750',
      title: 'Neon Tokyo Nights',
      description: 'Vibrant cyberpunk aesthetic with neon lighting',
      category: 'cyberpunk',
      tags: ['popular', 'vibrant', 'dark'],
      featured: true,
      viewCount: 2341,
      likeCount: 156,
    },
    {
      code: '3951847293',
      title: 'Studio Ghibli Dreams',
      description: 'Whimsical anime style inspired by Studio Ghibli',
      category: 'anime',
      tags: ['trending', 'aesthetic', 'colorful'],
      viewCount: 3456,
      likeCount: 234,
    },
    {
      code: '4829374619',
      title: 'Vintage Film Photography',
      description: 'Classic 35mm film photography aesthetic',
      category: 'photography',
      tags: ['vintage', 'aesthetic'],
      viewCount: 987,
      likeCount: 67,
    },
    {
      code: '5738291047',
      title: 'Dark Fantasy',
      description: 'Gothic and dark fantasy art style',
      category: 'fantasy',
      tags: ['dark', 'popular'],
      viewCount: 1876,
      likeCount: 145,
    },
    {
      code: '6492837561',
      title: 'Minimalist Architecture',
      description: 'Clean, geometric architectural visualization',
      category: 'minimal',
      tags: ['new', 'monochrome'],
      viewCount: 654,
      likeCount: 45,
    },
    {
      code: '7381920475',
      title: 'Ethereal Portrait',
      description: 'Soft, dreamy portrait photography style',
      category: 'photography',
      tags: ['aesthetic', 'light'],
      featured: true,
      viewCount: 2987,
      likeCount: 189,
    },
    {
      code: '8293746510',
      title: 'Retro Anime 80s',
      description: '80s and 90s retro anime aesthetic',
      category: 'anime',
      tags: ['vintage', 'colorful'],
      viewCount: 1543,
      likeCount: 112,
    },
    {
      code: '9182736450',
      title: 'Abstract Geometry',
      description: 'Bold geometric abstract compositions',
      category: 'abstract',
      tags: ['vibrant', 'new'],
      viewCount: 876,
      likeCount: 56,
    },
    {
      code: '1029384756',
      title: 'Magical Realism',
      description: 'Surreal blend of reality and fantasy',
      category: 'fantasy',
      tags: ['trending', 'aesthetic'],
      viewCount: 2134,
      likeCount: 167,
    },
  ];

  for (const sref of srefData) {
    const categoryObj = categories.find(c => c.slug === sref.category);
    const tagObjs = tags.filter(t => sref.tags.includes(t.name));

    const created = await prisma.srefCode.create({
      data: {
        code: sref.code,
        title: sref.title,
        description: sref.description,
        featured: sref.featured || false,
        viewCount: sref.viewCount,
        likeCount: sref.likeCount,
        favoriteCount: Math.floor(sref.likeCount * 0.6),
        imageUrl: `/images/sref/${sref.code}.webp`,
        promptExamples: JSON.stringify([
          `A beautiful scene in ${sref.title} style`,
          `Portrait photography with ${sref.title} aesthetic`,
          `Landscape art using ${sref.title} techniques`,
        ]),
        userId: user.id,
        categories: {
          create: categoryObj ? [{
            categoryId: categoryObj.id,
          }] : [],
        },
        tags: {
          create: tagObjs.map(tag => ({
            tagId: tag.id,
          })),
        },
        images: {
          create: [
            {
              url: `/images/sref/${sref.code}.webp`,
              width: 1024,
              height: 1024,
              format: 'webp',
            },
            {
              url: `/images/sref/${sref.code}-thumb.webp`,
              width: 256,
              height: 256,
              format: 'webp',
            },
          ],
        },
      },
    });
  }

  console.log(`✅ Created ${srefData.length} SREF codes with relationships`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });