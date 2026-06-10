import {
  Bot,
  BookOpen,
  Network,
  ScrollText,
  Code2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Agent", href: "/", icon: Bot },
  { label: "Rulebook", href: "/rulebook", icon: BookOpen },
  { label: "Memory", href: "/memory", icon: Network },
  { label: "Audit", href: "/audit", icon: ScrollText },
  { label: "Developers", href: "/developers", icon: Code2 },
  { label: "Settings", href: "/settings", icon: Settings },
];
