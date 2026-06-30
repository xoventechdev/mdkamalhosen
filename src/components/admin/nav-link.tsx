"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  FileText,
  Mail,
  Settings,
  GraduationCap,
  Award,
  Wrench,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderGit2,
  FileText,
  Mail,
  Settings,
  GraduationCap,
  Award,
  Wrench,
  User,
};

export interface NavLinkProps {
  href: string;
  label: string;
  iconName: string;
  exact?: boolean;
}

export function NavLink({ href, label, iconName, exact }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const Icon = ICONS[iconName] ?? User;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent/10 font-medium text-accent"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}