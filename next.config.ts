import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ===== PERFORMANCE OPTIMIZATIONS =====

  // Enable optimized images with modern formats
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
    ],
    // Optimize image delivery
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'inline',

    // Disable static image optimization for remote images
    // (we handle optimization via CDN)
    disableStaticImages: false,
  },

  // Server packages to exclude from client bundle
  serverExternalPackages: ["mongoose"],

  // ===== BUNDLE OPTIMIZATIONS =====

  // Optimize package imports
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "react", "react-dom"],
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable parallel routes (if using)
    ppr: true,
    // Enable server components in browser
    serverComponentsInBrowser: false,
  },

  // Compression
  compress: true,

  // ===== OUTPUT OPTIMIZATIONS =====

  // Generate static pages by default
  output: 'standalone',

  // Enable React Server Components
  reactMode: 'concurrent',

  // ===== CACHING =====

  // Cache static assets
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',

  // ===== SECURITY HEADERS =====
  async headers() {
    const securityHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "img-src 'self' data: blob: https:",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com https://va.vercel-insights.com https://vitals.vercel-insights.com",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "upgrade-insecure-requests",
        ].join("; "),
      },
      // Performance headers
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // ===== REDIRECTS =====

  async redirects() {
    return [
      // Add any redirects here
    ];
  },

  // ===== REWRITES =====

  async rewrites() {
    return [
      // Add any rewrites here
    ];
  },
};

export default nextConfig;
