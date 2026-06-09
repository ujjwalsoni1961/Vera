"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <Logo />
        <div className="leading-tight">
          <div className="font-display text-[15px] font-bold text-ink">Vera</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-subtle">
            Logistics Intelligence
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 label-eyebrow">Workspace</div>
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-item", active && "nav-item-active")}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-brand-600" : "text-ink-subtle"
                )}
                strokeWidth={2}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Trust footer */}
      <div className="border-t border-line p-3">
        <div className="rounded-xl border border-line bg-surface-subtle p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <ShieldCheck className="h-4 w-4 text-brand-600" strokeWidth={2} />
            Deterministic Core
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-subtle">
            Operational decisions are validated by a symbolic solver — never by
            the language model.
          </p>
        </div>
      </div>
    </aside>
  );
}
