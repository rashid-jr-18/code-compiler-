import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable standalone output for serverless deployment on Vercel
  output: 'standalone',
  
  // Image optimization settings for better performance
  images: {
    // Allow external image domains if needed
    remotePatterns: [
      // Add any external image domains here if needed
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      //   port: '',
      //   pathname: '/images/**',
      // },
    ],
    // Optimize image formats
    formats: ['image/webp', 'image/avif'],
    // Set image sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enable experimental features for better performance
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  
  // Compress responses
  compress: true,
  
  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_JUDGE0_URL: process.env.NEXT_PUBLIC_JUDGE0_URL,
  },
};

export default nextConfig;
