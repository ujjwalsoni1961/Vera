"use client";

import { Search, ChevronDown } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";

export function Topbar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-surface px-5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[13px] font-medium text-ink">
          Takapulpetti Oy
        </span>
        <span className="text-ink-faint">·</span>
        <span className="text-[13px] text-ink-secondary">Field Service · EU-North</span>
      </div>

      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            placeholder="Search jobs, technicians, rules"
            className="h-8 w-full rounded-md border border-line bg-page pl-8 pr-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-accent-border focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <StatusDot tone="ok" />
          <span className="text-xs text-ink-secondary">Engine connected</span>
        </div>
        <button className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-zinc-100">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-medium text-ink-secondary">
            ML
          </div>
          <span className="hidden text-[13px] text-ink-secondary sm:block">
            M. Lehtonen
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
        </button>
      </div>
    </header>
  );
}
