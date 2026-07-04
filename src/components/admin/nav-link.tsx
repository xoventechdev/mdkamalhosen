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
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  MessageSquare,
};

export interface NavLinkProps {
  href: string;
  label: string;
  iconName: string;
  exact?: boolean;
  /** Optional count to surface as an inline badge — used for pending comments. */
  badge?: number;
}

export function NavLink({ href, label, iconName, exact, badge }: NavLinkProps) {
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
      <span className="flex-1 truncate">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <Badge variant="accent" className="ml-auto h-5 px-1.5 text-[10px]">
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
    </Link>
  );
}