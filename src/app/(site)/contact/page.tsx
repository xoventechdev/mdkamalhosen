import type { Metadata } from "next";
import {
  Mail,
  Phone,
  Linkedin,
  MessageCircle,
  MapPin,
  Globe,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ContactForm } from "@/components/contact-form";
import { Toaster } from "sonner";
import { absoluteUrl } from "@/lib/utils";
import { getProfile } from "@/server/queries";

// Job-seeking copy mirrors live in metadata too. The admin toggle flips the
// contact surface from "actively looking" to "established professional".
const SEEKING_DESCRIPTION =
  "Get in touch with Md Kamal Hosen — BMS Engineer, open to relocation anywhere for the right opportunity.";
const NEUTRAL_DESCRIPTION = "Get in touch with Md Kamal Hosen — BMS Engineer.";
const SEEKING_HEADER =
  "I'm open to relocation anywhere for the right opportunity. Recruiters, contractors, and consultants welcome — I usually reply within a day or two.";
const NEUTRAL_HEADER =
  "Recruiters, contractors, and consultants welcome — I usually reply within a day or two.";
const SEEKING_OG_SUBTITLE =
  "Open+to+relocation+anywhere+for+the+right+opportunity";
const NEUTRAL_OG_SUBTITLE = "Recruiters,+contractors,+and+consultants+welcome";

export async function generateMetadata(): Promise<Metadata> {
  const profile = (await getProfile().catch(() => null)) as {
    lookingToNewOpportunity?: boolean;
  } | null;
  const showJob = profile?.lookingToNewOpportunity ?? true;
  const description = showJob ? SEEKING_DESCRIPTION : NEUTRAL_DESCRIPTION;
  const ogSubtitle = showJob ? SEEKING_OG_SUBTITLE : NEUTRAL_OG_SUBTITLE;
  const ogImage = absoluteUrl(
    `/api/og?type=default&title=Contact&subtitle=${ogSubtitle}`,
  );
  return {
    title: "Contact",
    description,
    alternates: { canonical: "/contact" },
    openGraph: {
      title: "Contact",
      description,
      url: absoluteUrl("/contact"),
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Contact — Md Kamal Hosen",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Contact — Md Kamal Hosen",
      description: "Reach out via email, phone, LinkedIn, or WhatsApp.",
      images: [ogImage],
    },
  };
}

export default async function ContactPage() {
  const profile = (await getProfile().catch(() => null)) as {
    name?: string;
    location?: string;
    lookingToNewOpportunity?: boolean;
    email?: string;
    phone?: string | null;
    linkedinUrl?: string | null;
    whatsapp?: string | null;
    preferredLocations?: string[];
  } | null;
  const showJob = profile?.lookingToNewOpportunity ?? true;
  const headerDescription = showJob ? SEEKING_HEADER : NEUTRAL_HEADER;
  const location = profile?.location ?? "Riyadh, Saudi Arabia";
  const preferredLocations = profile?.preferredLocations ?? [];

  // Derive channels from the profile. Each entry is gated on its source
  // field being non-empty so a partially-filled profile doesn't render
  // a dead "Phone: undefined" link.
  const channels: Array<{
    icon: typeof Mail;
    label: string;
    value: string;
    href: string;
    color: string;
    external: boolean;
  }> = [];
  if (profile?.email) {
    channels.push({
      icon: Mail,
      label: "Email",
      value: profile.email,
      href: `mailto:${profile.email}`,
      color: "text-accent",
      external: false,
    });
  }
  if (profile?.phone) {
    channels.push({
      icon: Phone,
      label: "Phone",
      value: profile.phone,
      href: `tel:${profile.phone.replace(/\s+/g, "")}`,
      color: "text-cat-software",
      external: false,
    });
  }
  if (profile?.linkedinUrl) {
    channels.push({
      icon: Linkedin,
      label: "LinkedIn",
      value: profile.linkedinUrl.replace(/^https?:\/\//, ""),
      href: profile.linkedinUrl,
      color: "text-cat-bms",
      external: true,
    });
  }
  if (profile?.whatsapp) {
    channels.push({
      icon: MessageCircle,
      label: "WhatsApp",
      value: profile.whatsapp,
      href: `https://wa.me/${profile.whatsapp.replace(/[^\d]/g, "")}`,
      color: "text-cat-iot",
      external: true,
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's talk about your next building"
        description={headerDescription}
      />
      <section>
        <div className="container py-12 md:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Channels */}
            <ScrollReveal>
              <div className="flex h-full flex-col">
                <h2 className="text-lg font-semibold">Reach me directly</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Any channel works. If you have an NDA, send it before sharing
                  project details.
                </p>
                {channels.length === 0 ? (
                  <p className="text-muted-foreground mt-6 text-sm">
                    No contact channels configured. Add some in{" "}
                    <a
                      href="/admin/profile"
                      className="text-accent hover:underline"
                    >
                      Admin → Profile
                    </a>
                    .
                  </p>
                ) : (
                  <ul className="mt-6 space-y-3">
                    {channels.map((c) => (
                      <li key={c.label}>
                        <a
                          href={c.href}
                          target={c.external ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="glass-card group flex items-center gap-4 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                        >
                          <span
                            className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted ${c.color}`}
                          >
                            <c.icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.18em]">
                              {c.label}
                            </p>
                            <p className="mt-0.5 truncate text-sm font-medium group-hover:text-accent">
                              {c.value}
                            </p>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="text-muted-foreground mt-6 flex flex-wrap gap-4 text-sm">
                  <p className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" /> {location}
                  </p>
                  {showJob && preferredLocations.length > 0 && (
                    <p className="inline-flex items-center gap-1.5">
                      <Globe className="h-4 w-4" aria-hidden="true" /> Open to{" "}
                      {preferredLocations.join(" / ")}
                    </p>
                  )}
                </div>
                {showJob && (
                  <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-500/80" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Currently available
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Form */}
            <ScrollReveal delay={120}>
              <ContactForm />
            </ScrollReveal>
          </div>
        </div>
      </section>
      <Toaster richColors position="top-right" closeButton />
    </>
  );
}
