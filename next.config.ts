import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Mongoose pulls in the optional `mongodb` driver and a `bson` tree that
  // are larger than the ~200 KB budget Next.js prefers to bundle. Marking
  // it as a server-external package keeps the cold-start penalty modest on
  // Vercel and avoids webpack trying to bundle a native module.
  serverExternalPackages: ["mongoose"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
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
          "connect-src 'self' https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com https://va.vercel-insights.com https://vitals.vercel-insights.com",
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