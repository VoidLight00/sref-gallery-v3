/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack config to reduce file watching
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/.git', '**/.npm', '**/.claude*']
      }
    }
    return config
  },
  
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow TypeScript errors during builds  
    ignoreBuildErrors: true,
  },
  images: {
    // Enable optimization for all image formats
    formats: ['image/webp', 'image/avif'],
    
    // Allow images from CDN domains
    domains: [
      'localhost',
      'res.cloudinary.com', // Cloudinary
      'd1234567890.cloudfront.net', // AWS CloudFront (replace with actual domain)
    ],

    // Netlify-specific image optimization
    ...(process.env.NETLIFY && {
      unoptimized: true, // Netlify handles image optimization
    }),
    
    // Image size configuration
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Enable static optimization
    unoptimized: false,
    
    // Loader configuration (can be customized per CDN)
    loader: 'default',
    
    // Remote patterns for enhanced security
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        port: '',
        pathname: '/**',
      }
    ]
  },
  
  // Experimental features for better performance (disabled for Next.js 14)
  // experimental: {
  //   // Enable server components optimization
  //   optimizePackageImports: ['sharp']
  // },
  
  // Compress responses in production
  compress: true,
};

module.exports = nextConfig;
