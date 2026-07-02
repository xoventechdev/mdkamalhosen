/**
 * Static search index for the command palette (Cmd/Ctrl-K).
 *
 * WHY STATIC (not from src/server/queries.ts):
 * The palette runs entirely in the browser. Importing server queries here would
 * pull Prisma + PrismaClient + Node-only modules into the client bundle and break
 * the build. Pages keep their own try/catch fallbacks for live data — the palette
 * shows the same fallback content so search results are predictable while the DB
 * is still being seeded.
 *
 * Update this file whenever the dummy/fallback arrays on the home, projects, or
 * blog pages change. A Phase-2 utility can rebuild this file from live queries
 * after admin edits land; for now it ships as a static artifact.
 */

export type SearchItemType = "route" | "project" | "post" | "page";

export interface SearchItem {
  type: SearchItemType;
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string[];
  category?: string;
}

export const searchIndex: SearchItem[] = [
  // ---- Routes (top-level pages) ----
  {
    type: "route",
    title: "Home",
    subtitle: "Landing page — hero, featured projects, latest writing",
    href: "/",
    keywords: ["home", "landing", "index"],
  },
  {
    type: "route",
    title: "About",
    subtitle: "Story, journey, mission and values",
    href: "/about",
    keywords: ["about", "bio", "story", "mission", "values", "kamal"],
  },
  {
    type: "route",
    title: "Experience",
    subtitle: "5+ years of BMS commissioning across the GCC",
    href: "/experience",
    keywords: ["experience", "career", "work", "history", "cv", "resume"],
  },
  {
    type: "route",
    title: "Projects",
    subtitle: "Case studies — BMS, software, IoT, Android",
    href: "/projects",
    keywords: ["projects", "work", "case study", "portfolio"],
  },
  {
    type: "route",
    title: "Skills",
    subtitle: "Grouped matrix — building automation, programming, IoT, AI",
    href: "/skills",
    keywords: ["skills", "stack", "technologies", "abilities"],
  },
  {
    type: "route",
    title: "Blog",
    subtitle: "Field notes on BACnet, Niagara 4, commissioning, AI",
    href: "/blog",
    keywords: ["blog", "writing", "articles", "posts", "notes"],
  },
  {
    type: "route",
    title: "Contact",
    subtitle: "Email, LinkedIn, WhatsApp",
    href: "/contact",
    keywords: ["contact", "email", "phone", "whatsapp", "linkedin"],
  },
  {
    type: "route",
    title: "Download CV",
    subtitle: "Web view of the resume + PDF download",
    href: "/cv",
    keywords: ["cv", "resume", "pdf", "download"],
  },

  // ---- Projects (mirrors fallbackProjects in projects/page.tsx) ----
  {
    type: "project",
    title: "KAFD District — BMS Commissioning",
    subtitle: "BMS networks at King Abdullah Financial District",
    href: "/projects/kafd-bms-commissioning",
    category: "bms",
    keywords: ["kafd", "commissioning", "alerton", "niagara", "bacnet", "hvac"],
  },
  {
    type: "project",
    title: "Red Palace — BMS Integration",
    subtitle: "BMS commissioning and graphics for a heritage commercial site",
    href: "/projects/red-palace-bms",
    category: "bms",
    keywords: ["red palace", "heritage", "graphics", "bacnet", "modbus"],
  },
  {
    type: "project",
    title: "Resume Builder",
    subtitle: "Role-targeted resume generator from structured data",
    href: "/projects/resume-builder",
    category: "software",
    keywords: ["resume", "builder", "next.js", "prisma", "supabase"],
  },
  {
    type: "project",
    title: "Attendance System",
    subtitle: "Time-and-attendance tracking for small engineering teams",
    href: "/projects/attendance-system",
    category: "software",
    keywords: ["attendance", "node", "mysql", "react"],
  },
  {
    type: "project",
    title: "IoT Dashboard",
    subtitle: "Real-time MQTT dashboard for ESP8266 sensor networks",
    href: "/projects/iot-dashboard",
    category: "iot",
    keywords: ["iot", "mqtt", "esp8266", "dashboard", "sensor"],
  },
  {
    type: "project",
    title: "Android App — 100K+ Downloads",
    subtitle: "Published Android application with 100,000+ downloads",
    href: "/projects/android-100k-downloads",
    category: "android",
    keywords: ["android", "google play", "java", "rest", "mobile"],
  },

  // ---- Posts (mirrors seeded blog posts) ----
  {
    type: "post",
    title: "BACnet vs Modbus: A Short Reference",
    subtitle: "When to use which — protocol tradeoffs in real BMS work",
    href: "/blog/bacnet-vs-modbus-brief",
    keywords: ["bacnet", "modbus", "protocol", "bms"],
  },
  {
    type: "post",
    title: "Commissioning a Niagara 4 Site — Checklist",
    subtitle: "Step-by-step checklist for Niagara 4 site handover",
    href: "/blog/commissioning-niagara-4-site",
    keywords: ["niagara", "commissioning", "checklist", "bms"],
  },
  {
    type: "post",
    title: "How I Use AI in My Engineering Workflow",
    subtitle: "Planning, documentation, coding, troubleshooting, research",
    href: "/blog/how-i-use-ai-in-engineering",
    keywords: ["ai", "workflow", "chatgpt", "claude", "engineering"],
  },

  // ---- Tag pages ----
  {
    type: "page",
    title: "Posts tagged 'bms'",
    href: "/blog/tag/bms",
    keywords: ["bms", "tag", "blog"],
  },
  {
    type: "page",
    title: "Posts tagged 'ai'",
    href: "/blog/tag/ai",
    keywords: ["ai", "tag", "blog"],
  },
];

/** Score an item against a query. Higher = better match. */
export function scoreMatch(item: SearchItem, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  const titleLower = item.title.toLowerCase();
  if (titleLower === q) return 100;
  if (titleLower.startsWith(q)) return 80;
  if (titleLower.includes(q)) return 60;

  const subLower = (item.subtitle ?? "").toLowerCase();
  if (subLower.includes(q)) return 30;

  for (const kw of item.keywords ?? []) {
    if (kw.toLowerCase() === q) return 50;
    if (kw.toLowerCase().includes(q)) return 25;
  }

  return 0;
}

export function search(query: string, limit = 8): SearchItem[] {
  if (!query.trim()) {
    // Empty query → show the top routes (good for first open).
    return searchIndex
      .filter((i) => i.type === "route")
      .slice(0, limit);
  }
  const scored = searchIndex
    .map((item) => ({ item, score: scoreMatch(item, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((x) => x.item);
}