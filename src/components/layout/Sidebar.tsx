"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { navItems } from "@/lib/nav";
import { Logo, VeraMark } from "./Logo";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200",
        collapsed ? "w-[56px]" : "w-[208px]"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-line",
          collapsed ? "justify-center px-0" : "px-4"
        )}
      >
        {collapsed ? <VeraMark size={22} /> : <Logo />}
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-ink-secondary hover:bg-zinc-100 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-ink-muted transition-colors hover:bg-zinc-100 hover:text-ink-secondary",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
