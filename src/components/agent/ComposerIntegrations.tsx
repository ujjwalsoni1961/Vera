"use client";

import Link from "next/link";
import { Blocks, Settings2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StatusDot } from "@/components/ui/status-dot";

interface SourceRow {
  name: string;
  kind: string;
  state: "connected" | "available";
  detail: string;
}

const SOURCES: SourceRow[] = [
  {
    name: "NordRetail TMS",
    kind: "Transport management",
    state: "connected",
    detail: "Shipments, routes, carrier assignments",
  },
  {
    name: "Telematics feed",
    kind: "Vehicle telemetry",
    state: "connected",
    detail: "Position, temperature, door events",
  },
  {
    name: "Rulebook",
    kind: "Operating rules",
    state: "connected",
    detail: "Active constraints applied to every decision",
  },
  {
    name: "Memory graph",
    kind: "Knowledge graph",
    state: "connected",
    detail: "Ports, lanes, carriers, customers",
  },
  {
    name: "ERP",
    kind: "Orders & invoicing",
    state: "available",
    detail: "Connect in Settings",
  },
];

export function ComposerIntegrations() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Connected sources"
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-zinc-100 hover:text-ink"
        >
          <Blocks className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 p-2">
        <p className="px-2 pb-1.5 pt-1 text-xxs font-medium uppercase tracking-wide text-ink-muted">
          Connected sources
        </p>
        <ul>
          {SOURCES.map((s) => (
            <li
              key={s.name}
              className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-zinc-50"
            >
              <StatusDot
                tone={s.state === "connected" ? "ok" : "neutral"}
                className="mt-1.5"
              />
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-ink">
                  {s.name}
                  <span className="ml-1.5 font-normal text-ink-muted">
                    {s.kind}
                  </span>
                </p>
                <p className="truncate text-xxs text-ink-tertiary">
                  {s.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-1 border-t border-line px-2 pb-1 pt-2">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xxs text-ink-secondary hover:text-ink"
          >
            <Settings2 className="h-3 w-3" strokeWidth={1.75} />
            Manage connections
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
