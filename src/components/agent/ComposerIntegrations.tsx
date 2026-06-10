"use client";

import Link from "next/link";
import { Blocks, Settings2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StatusDot } from "@/components/ui/status-dot";
import { useConnections } from "@/lib/connections";

interface SourceRow {
  name: string;
  kind: string;
  state: "connected" | "available";
  detail: string;
}

export function ComposerIntegrations() {
  const connections = useConnections();

  const sources: SourceRow[] = [
    {
      name: connections.fsm ?? "Field service system",
      kind: "Field service",
      state: connections.fsm ? "connected" : "available",
      detail: connections.fsm
        ? "Work orders, technicians, scheduling"
        : "Connect in Settings",
    },
    {
      name: connections.telematics
        ? `${connections.telematics} telematics`
        : "Telematics",
      kind: "Vehicle telemetry",
      state: connections.telematics ? "connected" : "available",
      detail: connections.telematics
        ? "Van positions, driving logs"
        : "Connect in Settings",
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
      detail: "Sites, technicians, equipment, customers",
    },
    {
      name: connections.erp ?? "ERP",
      kind: "Orders & invoicing",
      state: connections.erp ? "connected" : "available",
      detail: connections.erp
        ? "Parts inventory, purchase orders"
        : "Connect in Settings",
    },
  ];

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
          {sources.map((s) => (
            <li
              key={s.kind}
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
                <p className="text-xs text-ink-muted">{s.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-1 border-t border-line pt-1">
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-ink-secondary transition-colors hover:bg-zinc-50 hover:text-ink"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Manage connections
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
