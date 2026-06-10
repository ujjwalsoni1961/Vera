"use client";

import dynamic from "next/dynamic";
import { Check } from "lucide-react";
import type { DecisionWidget, WidgetStat } from "@/lib/engine-core/types";
import { cn } from "@/lib/utils";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] w-full items-center justify-center bg-page text-xs text-ink-muted">
      Loading map…
    </div>
  ),
});

// ────────────────────────────────────────────────────────────────────────────
// Renders a decision's concrete outcome in the chat: route map, reassignment
// table, or report table. `completed` switches the styling once approved.
// ────────────────────────────────────────────────────────────────────────────

function Stats({ stats }: { stats: WidgetStat[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line px-4 py-2.5">
      {stats.map((s) => (
        <span key={s.label} className="flex items-baseline gap-1.5 text-xs">
          <span className="text-ink-muted">{s.label}</span>
          {s.before && (
            <span className="text-ink-muted line-through decoration-zinc-300">
              {s.before}
            </span>
          )}
          <span className="font-medium text-ink">{s.after}</span>
        </span>
      ))}
    </div>
  );
}

export function DecisionWidgetView({
  widget,
  completed,
}: {
  widget: DecisionWidget;
  completed: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="text-xs font-medium text-ink">{widget.title}</span>
        <span
          className={cn(
            "flex items-center gap-1.5 text-xxs font-medium uppercase tracking-wide",
            completed ? "text-ok" : "text-ink-muted"
          )}
        >
          {completed && <Check className="h-3 w-3" strokeWidth={2.5} />}
          {completed ? "Applied" : "Proposed"}
        </span>
      </div>

      {widget.kind === "route" && <RouteMap widget={widget} />}

      {widget.kind === "assignments" && (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line text-xxs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-2 font-medium">Job</th>
              <th className="py-2 pr-3 font-medium">Site</th>
              <th className="py-2 pr-3 font-medium">Assignee</th>
              <th className="py-2 pr-4 font-medium">Window</th>
            </tr>
          </thead>
          <tbody>
            {widget.rows.map((r) => (
              <tr key={r.job} className="border-b border-line last:border-0">
                <td className="px-4 py-2 font-mono text-[11px] text-ink">
                  {r.job}
                </td>
                <td className="py-2 pr-3 text-ink-secondary">{r.site}</td>
                <td className="py-2 pr-3">
                  <span className="text-ink-muted line-through decoration-zinc-300">
                    {r.from}
                  </span>
                  <span className="mx-1 text-ink-muted">→</span>
                  <span
                    className={cn(
                      "font-medium",
                      completed ? "text-ok" : "text-ink"
                    )}
                  >
                    {r.to}
                  </span>
                  {r.note && (
                    <span className="ml-1.5 text-xxs text-ink-muted">
                      {r.note}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 font-mono text-[11px] text-ink-secondary">
                  {r.window}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {widget.kind === "table" && (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line text-xxs uppercase tracking-wide text-ink-muted">
              {widget.columns.map((c, i) => (
                <th
                  key={c}
                  className={cn(
                    "py-2 pr-3 font-medium",
                    i === 0 ? "px-4" : "",
                    i === widget.columns.length - 1 && "pr-4"
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {widget.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-line last:border-0">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "py-2 pr-3 align-top",
                      ci === 0
                        ? "px-4 font-mono text-[11px] text-ink"
                        : "text-ink-secondary",
                      ci === row.length - 1 && "pr-4"
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {"stats" in widget && widget.stats && widget.stats.length > 0 && (
        <Stats stats={widget.stats} />
      )}
    </div>
  );
}
