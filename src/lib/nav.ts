import {
  LayoutDashboard,
  ListChecks,
  Workflow,
  Wrench,
  Brain,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    description: "Operational summary & task console",
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: ListChecks,
    description: "Submitted operational tasks",
  },
  {
    label: "Agent Runs",
    href: "/agent-runs",
    icon: Workflow,
    description: "Execution traces & pipelines",
  },
  {
    label: "Tools",
    href: "/tools",
    icon: Wrench,
    description: "Connected operational services",
  },
  {
    label: "Memory",
    href: "/memory",
    icon: Brain,
    description: "Operational knowledge & incidents",
  },
  {
    label: "Audit Logs",
    href: "/audit",
    icon: ScrollText,
    description: "Immutable event history",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Workspace configuration",
  },
];
