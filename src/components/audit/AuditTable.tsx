"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/pages/PageHeader";
import { Card } from "@/components/ui/card";
import { StatusDot, type DotTone } from "@/components/ui/status-dot";
import { ReasoningSteps } from "@/components/agent/ReasoningSteps";
import { ReferenceProvider } from "@/components/agent/ReferenceChip";
import { formatDateTime, cn } from "@/lib/utils";
import { listAuditEntries, type AuditEntry, type DecisionStatus } from "@/lib/engine";

const STATUS_TONE: Record<DecisionStatus, DotTone> = {
  executed: "ok",
  recommended: "warn",
  informational: "neutral",
  rejected: "bad",
};

const STATUS_LABEL: Record<DecisionStatus, string> = {
  executed: "Executed",
  recommended: "Awaiting approval",
  informational: "Informational",
  rejected: "Rejected",
};

export function AuditTable() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    listAuditEntries().then(setEntries);
  }, []);

  return (
    <ReferenceProvider>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <PageHeader
          title="Audit"
          description="Every decision with its complete reasoning trace, stored permanently. Expand a row to review the steps and references behind it."
        />
        <Card>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-xxs font-medium uppercase tracking-wide text-ink-muted">
                <th className="w-36 px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Task</th>
                <th className="w-[30%] px-5 py-3">Decision</th>
                <th className="w-44 px-5 py-3">Status</th>
                <th className="w-12 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const open = openId === entry.id;
                return (
                  <FragmentRow
                    key={entry.id}
                    entry={entry}
                    open={open}
                    onToggle={() => setOpenId(open ? null : entry.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </ReferenceProvider>
  );
}

function FragmentRow({
  entry,
  open,
  onToggle,
}: {
  entry: AuditEntry;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "cursor-pointer border-b border-line transition-colors hover:bg-page",
          open && "bg-page"
        )}
      >
        <td className="px-5 py-4 align-top text-xs text-ink-muted">
          {formatDateTime(entry.ts)}
        </td>
        <td className="px-5 py-4 align-top text-[13px] leading-relaxed text-ink">
          {entry.task}
        </td>
        <td className="px-5 py-4 align-top text-xs leading-relaxed text-ink-secondary">
          {entry.decision.action}
        </td>
        <td className="px-5 py-4 align-top">
          <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <StatusDot tone={STATUS_TONE[entry.decision.status]} />
            {STATUS_LABEL[entry.decision.status]}
          </span>
        </td>
        <td className="px-5 py-4 align-top">
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-ink-muted transition-transform",
              open && "rotate-90"
            )}
          />
        </td>
      </tr>
      {open && (
        <tr className="border-b border-line">
          <td colSpan={5} className="bg-page px-5 py-2">
            <div className="px-5">
              <p className="pt-2 text-xxs font-medium uppercase tracking-wide text-ink-muted">
                Reasoning trace
              </p>
              <ReasoningSteps steps={entry.decision.steps} />
              {entry.decision.references.length > 0 && (
                <p className="py-2.5 font-mono text-xxs text-ink-muted">
                  References:{" "}
                  {entry.decision.references.map((r) => r.id).join(", ")}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
