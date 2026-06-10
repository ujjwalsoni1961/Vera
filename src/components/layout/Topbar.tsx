"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, LogOut, Loader2 } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { StatusDot } from "@/components/ui/status-dot";

export function Topbar() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

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

        <Popover.Root>
          <Popover.Trigger asChild>
            <button className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-zinc-100">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-medium text-ink-secondary">
                VL
              </div>
              <span className="hidden text-[13px] text-ink-secondary sm:block">
                V. Lehtonen
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={6}
              className="z-50 w-60 rounded-card border border-line bg-surface p-1.5 shadow-popover"
            >
              <div className="px-2.5 py-2">
                <p className="text-[13px] font-medium text-ink">Valle Lehtonen</p>
                <p className="text-xs text-ink-muted">valle@outlook.com</p>
                <p className="mt-1 text-xxs text-ink-muted">
                  Operator · Takapulpetti Oy
                </p>
              </div>
              <div className="my-1 h-px bg-line" />
              <button
                onClick={signOut}
                disabled={signingOut}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-ink-secondary transition-colors hover:bg-zinc-100 hover:text-ink disabled:opacity-60"
              >
                {signingOut ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                Sign out
              </button>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </header>
  );
}
