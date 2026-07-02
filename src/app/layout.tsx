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
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Md Kamal Hosen — Building Management System Engineer",
    template: "%s — Md Kamal Hosen",
  },
  description:
    "BMS Engineer commissioning HVAC plants and shipping the software that runs them. Honeywell Alerton, Niagara 4, BACnet, Modbus, IoT, and AI-assisted engineering workflow.",
  keywords: [
    "Building Management System",
    "BMS Engineer",
    "Honeywell Alerton",
    "Niagara 4",
    "BACnet",
    "Modbus",
    "HVAC automation",
    "Smart buildings",
    "Md Kamal Hosen",
  ],
  authors: [{ name: "Md Kamal Hosen", url: absoluteUrl("/about") }],
  creator: "Md Kamal Hosen",
  publisher: "Md Kamal Hosen",
  category: "technology",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: "Md Kamal Hosen — Blog RSS" },
      ],
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: siteUrl,
    siteName: "Md Kamal Hosen",
    title: "Md Kamal Hosen — Building Management System Engineer",
    description:
      "BMS Engineer commissioning HVAC plants and shipping the software that runs them.",
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "Md Kamal Hosen — BMS Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Md Kamal Hosen — Building Management System Engineer",
    description:
      "BMS Engineer commissioning HVAC plants and shipping the software that runs them.",
    images: [defaultOgImage],
    creator: "@mdkamalhosennn",
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
};

async function loadSiteJsonLd() {
  // Best-effort: profile may be empty in dev before seed runs.
  try {
    const profile = (await getProfile()) as unknown as {
      name: string;
      email: string;
      phone?: string | null;
      location: string;
      avatarUrl?: string | null;
      summary: string;
      linkedinUrl?: string | null;
      githubUrl?: string | null;
      role: string;
    } | null;
    if (!profile) {
      return combineJsonLd(
        personJsonLd({
          name: "Md Kamal Hosen",
          email: "mdkamalhosennn@gmail.com",
        }),
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
  } catch {
    return combineJsonLd(
      personJsonLd({ name: "Md Kamal Hosen" }),
      websiteJsonLd({ includeSearchAction: true }),
    );
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[layout][loadSiteJsonLd] start");
  const layoutT0 = Date.now();
  const jsonLd = await loadSiteJsonLd();
  const layoutMs = Date.now() - layoutT0;
  console.log(`[layout][loadSiteJsonLd] end ${layoutMs}ms`);
  if (layoutMs > 1000) {
    console.warn(`[layout][loadSiteJsonLd] SLOW ${layoutMs}ms`);
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <body className="relative min-h-screen bg-background font-sans text-foreground">
        {/* Fixed gradient mesh — sits behind all content. */}
        <div className="gradient-mesh" aria-hidden="true" />

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="relative z-10 flex-1">
            {children}
          </main>
          <ConditionalSiteFooter />
          <CommandPalette />
          <Toaster richColors position="top-right" closeButton />
          {/* Site-wide structured data (Person + WebSite with SearchAction). */}
          <JsonLd data={jsonLd} />
          {/* Vercel Web Vitals + pageview analytics. No-op outside Vercel. */}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}