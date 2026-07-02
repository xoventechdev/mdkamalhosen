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
import { absoluteUrl } from "@/lib/utils";

const ogImage = absoluteUrl(
  "/api/og?type=default&title=Contact&subtitle=Open+to+relocation+anywhere+for+the+right+opportunity",
);

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Md Kamal Hosen — BMS Engineer, open to relocation anywhere for the right opportunity.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact",
    description:
      "Get in touch with Md Kamal Hosen — BMS Engineer, open to relocation anywhere for the right opportunity.",
    url: absoluteUrl("/contact"),
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Contact — Md Kamal Hosen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — Md Kamal Hosen",
    description: "Reach out via email, phone, LinkedIn, or WhatsApp.",
    images: [ogImage],
  },
};

const channels = [
  {
    icon: Mail,
    label: "Email",
    value: "mdkamalhosennn@gmail.com",
    href: "mailto:mdkamalhosennn@gmail.com",
    color: "text-accent",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+966 58 347 1377",
    href: "tel:+966583471377",
    color: "text-cat-software",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    value: "linkedin.com/in/mdkamalhosennn",
    href: "https://linkedin.com/in/mdkamalhosennn",
    color: "text-cat-bms",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+966 58 347 1377",
    href: "https://wa.me/966583471377",
    color: "text-cat-iot",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's talk about your next building"
        description="I'm open to relocation anywhere for the right opportunity. Recruiters, contractors, and consultants welcome — I usually reply within a day or two."
      />
      <section>
        <div className="container py-12 md:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Channels */}
            <ScrollReveal>
              <div className="flex h-full flex-col">
                <h2 className="text-lg font-semibold">Reach me directly</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Any channel works. If you have an NDA, send it before sharing
                  project details.
                </p>
                <ul className="mt-6 space-y-3">
                  {channels.map((c) => (
                    <li key={c.label}>
                      <a
                        href={c.href}
                        target={c.href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 rounded-2xl glass-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                      >
                        <span
                          className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted ${c.color}`}
                        >
                          <c.icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
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
                <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <p className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" /> Riyadh, Saudi Arabia
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    <Globe className="h-4 w-4" aria-hidden="true" /> Open to relocation anywhere for the right opportunity
                  </p>
                </div>
                <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-500/80" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Currently available
                </div>
              </div>
            </ScrollReveal>

            {/* Form */}
            <ScrollReveal delay={120}>
              <ContactForm />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}