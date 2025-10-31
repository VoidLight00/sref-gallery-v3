import Header from '@/components/layout/Header';
import HeroSection from '@/components/layout/HeroSection';
import CategoryGrid from '@/components/layout/CategoryGrid';
import SREFSection from '@/components/sections/SREFSection';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

async function getFeaturedSREFs() {
  const srefs = await prisma.srefCode.findMany({
    where: { 
      featured: true,
      status: 'ACTIVE'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      images: true
    },
    take: 6,
    orderBy: {
      likeCount: 'desc'
    }
  });

  return srefs.map(sref => ({
    id: sref.id,
    code: sref.code,
    title: sref.title,
    description: sref.description || '',
    imageUrl: sref.imageUrl || `https://picsum.photos/400/300?random=${sref.code}`,
    images: sref.images?.length > 0 
      ? sref.images.map(img => img.url) 
      : [
          `https://picsum.photos/400/300?random=${sref.code}1`,
          `https://picsum.photos/400/300?random=${sref.code}2`,
          `https://picsum.photos/400/300?random=${sref.code}3`,
          `https://picsum.photos/400/300?random=${sref.code}4`
        ],
    promptExamples: sref.promptExamples ? JSON.parse(sref.promptExamples) : [],
    featured: sref.featured,
    premium: sref.premium,
    likes: sref.likeCount,
    views: sref.viewCount,
    favorites: sref.favoriteCount,
    category: sref.categories[0]?.category?.name || 'Uncategorized',
    tags: sref.tags?.map(t => t.tag.name) || [],
    createdAt: sref.createdAt.toISOString(),
    user: sref.user ? {
      id: sref.user.id,
      name: sref.user.name || 'Anonymous',
      avatar: sref.user.image || '/avatars/default.jpg'
    } : undefined
  }));
}

async function getNewestSREFs() {
  const srefs = await prisma.srefCode.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      images: true
    },
    take: 3,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return srefs.map(sref => ({
    id: sref.id,
    code: sref.code,
    title: sref.title,
    description: sref.description || '',
    imageUrl: sref.imageUrl || `https://picsum.photos/400/300?random=${sref.code}`,
    images: sref.images?.length > 0 
      ? sref.images.map(img => img.url) 
      : [
          `https://picsum.photos/400/300?random=${sref.code}1`,
          `https://picsum.photos/400/300?random=${sref.code}2`,
          `https://picsum.photos/400/300?random=${sref.code}3`,
          `https://picsum.photos/400/300?random=${sref.code}4`
        ],
    promptExamples: sref.promptExamples ? JSON.parse(sref.promptExamples) : [],
    featured: sref.featured,
    premium: sref.premium,
    likes: sref.likeCount,
    views: sref.viewCount,
    favorites: sref.favoriteCount,
    category: sref.categories[0]?.category?.name || 'Uncategorized',
    tags: sref.tags?.map(t => t.tag.name) || [],
    createdAt: sref.createdAt.toISOString(),
    user: sref.user ? {
      id: sref.user.id,
      name: sref.user.name || 'Anonymous',
      avatar: sref.user.image || '/avatars/default.jpg'
    } : undefined
  }));
}

export default async function HomePage() {
  const [featuredSREFs, newestSREFs] = await Promise.all([
    getFeaturedSREFs(),
    getNewestSREFs()
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Categories Section */}
      <CategoryGrid />
      
      {/* Featured SREFs Section */}
      <SREFSection
        title="⭐ Featured SREF Codes"
        subtitle="Hand-picked style references that deliver exceptional results"
        srefs={featuredSREFs}
        viewAllLink="/discover"
        viewAllText="View All Featured SREFs"
        bgColor="bg-gray-50 dark:bg-gray-800"
        columns={3}
      />

      {/* Newest SREFs Section */}
      <SREFSection
        title="🆕 Newest SREF Codes"
        subtitle="Latest additions to our SREF collection"
        srefs={newestSREFs}
        viewAllLink="/discover?sort=newest"
        viewAllText="View All Newest SREFs"
        bgColor="bg-white dark:bg-gray-900"
        columns={3}
      />

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🎨</div>
                <div className="font-bold text-xl">SREF Gallery</div>
              </div>
              <p className="text-gray-300 mb-6">
                Discover the best Midjourney style reference codes and prompts. 
                Updated daily with curated collections from the community.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.120.112.225.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z.017 0z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/discover" className="hover:text-white transition-colors">Discover</Link></li>
                <li><Link href="/categories" className="hover:text-white transition-colors">Categories</Link></li>
                <li><Link href="/ranking" className="hover:text-white transition-colors">Ranking</Link></li>
                <li><Link href="/how-to" className="hover:text-white transition-colors">How to Use</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SREF Gallery. Made with ❤️ for the Midjourney community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}