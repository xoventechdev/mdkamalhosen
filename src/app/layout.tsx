import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { ConditionalSiteFooter } from "@/components/conditional-site-footer";
import { CommandPalette } from "@/components/ui/command-palette";
import { Toaster } from "sonner";
import { JsonLd } from "@/components/json-ld";
import { personJsonLd, websiteJsonLd, combineJsonLd } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/utils";
import { getProfile } from "@/server/queries";
import { SITE_DEFAULTS } from "@/lib/site-defaults";
import Script from "next/script";
import Head from "next/head";
import '@/styles/globals.css';

// Preload fonts with display swap for better performance
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const defaultOgImage = absoluteUrl("/api/og?type=default");

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#070b1a" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

// Cache metadata for better performance
const DEFAULT_TITLE = `${SITE_DEFAULTS.name} — Building Management System Engineer`;
const DEFAULT_DESCRIPTION =
  "BMS Engineer commissioning HVAC plants and shipping the software that runs them. Honeywell Alerton, Niagara 4, BACnet, Modbus, IoT, and AI-assisted engineering workflow.";
const DEFAULT_KEYWORDS = [
  "Building Management System",
  "BMS Engineer",
  "Honeywell Alerton",
  "Niagara 4",
  "BACnet",
  "Modbus",
  "HVAC automation",
  "Smart buildings",
  SITE_DEFAULTS.name,
];
const DEFAULT_TWITTER_HANDLE = SITE_DEFAULTS.twitterHandle;

// Enable static generation for better performance
export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export async function generateMetadata(): Promise<Metadata> {
  // Use cache to avoid duplicate fetches
  const profile = (await getProfile().catch(() => null)) as {
    name?: string;
    siteTitle?: string;
    siteDescription?: string;
    siteKeywords?: string[];
    twitterHandle?: string;
  } | null;

  const title = profile?.siteTitle || DEFAULT_TITLE;
  const description = profile?.siteDescription || DEFAULT_DESCRIPTION;
  const keywords = profile?.siteKeywords?.length ? profile.siteKeywords : DEFAULT_KEYWORDS;
  const twitterCreator = profile?.twitterHandle || DEFAULT_TWITTER_HANDLE;
  const name = profile?.name || SITE_DEFAULTS.name;

  return {
    metadataBase: new URL(siteUrl),
    authors: [{ name, url: absoluteUrl("/about") }],
    creator: name,
    publisher: name,
    category: "technology",
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": [
          { url: "/feed.xml", title: `${name} — Blog RSS` },
        ],
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.webmanifest",
    title: {
      default: title,
      template: `%s — ${name}`,
    },
    description,
    keywords,
    openGraph: {
      type: "website",
      locale: "en_IE",
      url: siteUrl,
      siteName: name,
      title,
      description,
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: `${name} — BMS Engineer`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
      creator: twitterCreator,
    },
  };
}

// Shared profile shape consumed by JSON-LD, footer, and metadata below.
type ProfileView = {
  name: string;
  email: string;
  phone?: string | null;
  location: string;
  avatarUrl?: string | null;
  summary: string;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  whatsapp?: string | null;
  role: string;
  lookingToNewOpportunity?: boolean;
} | null;

function buildJsonLd(profile: ProfileView) {
  if (!profile) {
    return combineJsonLd(
      personJsonLd({ name: SITE_DEFAULTS.name, email: SITE_DEFAULTS.email }),
      websiteJsonLd({ includeSearchAction: true }),
    );
  }
  return combineJsonLd(
    personJsonLd({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      avatarUrl: profile.avatarUrl,
      bio: profile.summary,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      currentRole: profile.role,
      currentCompany: undefined,
    }),
    websiteJsonLd({ includeSearchAction: true }),
  );
}

function buildFooterProfile(profile: ProfileView) {
  if (!profile) return null;
  return {
    name: profile.name,
    location: profile.location,
    email: profile.email,
    linkedinUrl: profile.linkedinUrl ?? null,
    githubUrl: profile.githubUrl ?? null,
    whatsapp: profile.whatsapp ?? null,
    lookingToNewOpportunity: profile.lookingToNewOpportunity ?? true,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single fetch shared across JSON-LD, footer, and metadata.
  const profile = (await getProfile().catch(() => null)) as ProfileView;
  const jsonLd = buildJsonLd(profile);
  const footerProfile = buildFooterProfile(profile);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <Head>
        {/* Preconnect to critical third-party domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link rel="preconnect" href="https://va.vercel-insights.com" />

        {/* Preload critical CSS */}
        <link rel="preload" href="/_next/static/css/main.css" as="style" />

        {/* DNS prefetch for all external domains */}
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
        <link rel="dns-prefetch" href="https://va.vercel-insights.com" />
      </Head>

      <body className="relative min-h-screen bg-background font-sans text-foreground">
        <div className="gradient-mesh" aria-hidden="true" />

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
          >
            Skip to content
          </a>

          {/* Analytics script - moved outside Head */}
          <Script
            src="/_next/static/chunks/main.js"
            strategy="afterInteractive"
          />

          <SiteHeader name={footerProfile?.name} />

          <main id="main" className="relative z-10 flex-1">
            {children}
          </main>

          <ConditionalSiteFooter profile={footerProfile} />
          <CommandPalette />
          <Toaster richColors position="top-right" closeButton />
          <JsonLd data={jsonLd} />

          {/* Analytics - load after page is interactive */}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
