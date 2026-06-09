"use client";

import { Search, Bell, ChevronDown, Building2 } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-line bg-surface/85 px-5 backdrop-blur-md">
      {/* Org context */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
          <Building2 className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-ink">
            NordRetail Logistics
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
            Production · EU-Central
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="ml-2 hidden max-w-md flex-1 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="text"
            placeholder="Search shipments, routes, incidents…"
            className="w-full rounded-xl border border-line bg-surface-subtle py-2 pl-9 pr-16 text-sm text-ink placeholder:text-ink-subtle focus:border-brand-300 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-subtle lg:block">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-surface bg-status-warn" />
        </button>

        <div className="mx-1 h-6 w-px bg-line" />

        {/* User menu */}
        <button className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-surface-muted">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
            CK
          </div>
          <div className="hidden text-left leading-tight sm:block">
            <div className="text-[13px] font-semibold text-ink">C. Koskinen</div>
            <div className="text-[11px] text-ink-subtle">Ops Manager</div>
          </div>
          <ChevronDown className="h-4 w-4 text-ink-subtle" />
        </button>
      </div>
    </header>
  );
}
