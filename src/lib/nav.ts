/**
 * Single source of truth for the public site navigation. Both the header and the
 * footer import from here so they never drift apart. CV button is rendered as a
 * separate CTA on the header, but lives in the nav data for the footer.
 */

export interface NavItem {
  href: string;
  label: string;
  /** If true, this is the prominent CTA — render with primary button styling. */
  cta?: boolean;
  /** Optional short description used in the footer column. */
  description?: string;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/projects", label: "Projects" },
  { href: "/skills", label: "Skills" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/cv", label: "Download CV", cta: true },
];

export const footerNavItems: NavItem[] = navItems.filter((i) => !i.cta);