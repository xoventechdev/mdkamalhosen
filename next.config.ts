import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    // Security headers applied to every route (public + admin). Admin renders
    // inside the same app so the headers are uniform; CSP does not block admin
    // because we don't use inline scripts (Next.js emits hashed or external
    // bundles by default).
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
        // Conservative Content Security Policy. Inline styles are allowed
        // because Tailwind utility classes rely on inline style attributes in
        // a few dynamic spots (transform / scroll); `unsafe-inline` is the
        // pragmatic choice here. We could move to nonce-based with the Next
        // middleware helper in a follow-up.
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          // Next.js ImageResponse (OG) needs to load Google Fonts via CSS;
          // data: allows inline image data URIs used by Next/MDX components.
          "img-src 'self' data: blob: https:",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.supabase.co https://va.vercel-insights.com https://vitals.vercel-insights.com",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "upgrade-insecure-requests",
        ].join("; "),
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;