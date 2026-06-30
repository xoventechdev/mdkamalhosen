import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 } as const;

/**
 * Open Graph image generator. Returns a 1200x630 PNG that follows the same
 * visual language as the home hero (gradient mesh + glass + monospace kicker).
 *
 * Query params (all optional):
 *   - title       : Main headline (1 line preferred; longer gets truncated)
 *   - subtitle    : 1 line of body copy below the title
 *   - type        : 'default' | 'project' | 'post'
 *   - category    : 'bms' | 'software' | 'iot' | 'android' (used as kicker)
 *
 * Caching: Vercel's edge cache will hold the rendered PNG for an hour. The
 * per-route og meta builds a unique URL per (title, subtitle, type) combo, so
 * each unique combination is cached separately.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const title = (searchParams.get("title") ?? "Md Kamal Hosen").slice(0, 120);
  const subtitle = (
    searchParams.get("subtitle") ??
    "Building Management System Engineer · Riyadh, KSA"
  ).slice(0, 200);
  const type = searchParams.get("type") ?? "default";
  const category = searchParams.get("category");

  // Brand-colour swatches per category — accent violet for project / post.
  const categoryColor =
    category === "bms"
      ? "#0891b2"
      : category === "software"
        ? "#7c3aed"
        : category === "iot"
          ? "#059669"
          : category === "android"
            ? "#d97706"
            : "#4f46e5";

  const kicker =
    type === "project"
      ? "Case study"
      : type === "post"
        ? "Blog post"
        : "Portfolio · 2026";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#070b1a",
          fontFamily: '"Inter", "Helvetica Neue", system-ui, sans-serif',
          color: "#f5f6fb",
        }}
      >
        {/* Gradient mesh backdrop — three radial gradients painted via CSS,
            exactly mirroring the v2 .gradient-mesh utility in globals.css. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(at 12% 8%, rgba(124,58,237,0.45) 0%, transparent 45%), radial-gradient(at 88% 0%, rgba(79,70,229,0.45) 0%, transparent 45%), radial-gradient(at 100% 100%, rgba(5,150,105,0.30) 0%, transparent 50%)",
          }}
        />

        {/* Subtle grid pattern for texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            opacity: 0.6,
          }}
        />

        {/* Top bar — logo + kicker */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "48px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 24,
              letterSpacing: "0.02em",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 36,
                height: 36,
                borderRadius: 10,
                background: categoryColor,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: "white",
              }}
            >
              K
            </div>
            <div style={{ display: "flex" }}>{"// kamal"}</div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 16,
              color: "rgba(245,246,251,0.85)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: categoryColor,
                boxShadow: `0 0 18px ${categoryColor}`,
              }}
            />
            {kicker}
          </div>
        </div>

        {/* Headline + subtitle */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
            padding: "32px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: title.length > 60 ? 56 : 72,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              maxWidth: 1000,
              // Text gradient via background-clip would need inline CSS
              // backgroundImage — ImageResponse uses DOM elements, so we
              // simulate the "text-gradient" look with a single tint instead.
              color: "#ffffff",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 26,
              lineHeight: 1.4,
              color: "rgba(220,222,235,0.85)",
              maxWidth: 950,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Bottom strip — domain + blurb */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "32px 64px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 18,
            color: "rgba(220,222,235,0.7)",
          }}
        >
          <div style={{ display: "flex" }}>mdkamalhosennn@portfolio</div>
          <div style={{ display: "flex" }}>BMS · Niagara 4 · BACnet · Modbus</div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=3600",
        "Content-Type": "image/png",
      },
    },
  );
}
