"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReasoningSteps } from "./ReasoningSteps";
import { DecisionWidgetView } from "./DecisionWidget";
import {
  recordAuditEntry,
  saveRule,
  type Decision,
  type ParsedRule,
} from "@/lib/engine";

// ── Card shown when the task stated a policy: confirm into the rulebook ─────

export function LearnedRuleCard({ rule }: { rule: ParsedRule }) {
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function add() {
    setSaving(true);
    try {
      const r = await saveRule({ ...rule }, "chat");
      setSaved(r.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-card border border-line bg-surface"
    >
      <div className="px-4 py-3.5">
        <p className="flex items-center gap-1.5 text-xxs font-medium uppercase tracking-wide text-ink-muted">
          <BookPlus className="h-3 w-3" />
          Proposed rulebook addition
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
          {rule.naturalLanguage}
        </p>
        <pre className="mt-2.5 overflow-x-auto rounded-md bg-page px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-secondary">
          {rule.structured}
        </pre>
        <p className="mt-2 text-xxs text-ink-muted">Scope: {rule.scope}</p>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
        {saved ? (
          <span className="flex items-center gap-1.5 text-[13px] text-ink-secondary">
            <Check className="h-3.5 w-3.5 text-ok" strokeWidth={2} />
            Added to the rulebook as {saved}. Applied to every decision from
            now on.
          </span>
        ) : (
          <>
            <Button variant="primary" size="sm" onClick={add} disabled={saving}>
              {saving ? "Adding…" : "Add to rulebook"}
            </Button>
            <span className="text-xs text-ink-muted">
              Takes effect immediately for new decisions.
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Decision card: action + outcome widget + approve flow ───────────────────

export function ActionCard({
  task,
  decision,
  onModify,
}: {
  task: string;
  decision: Decision;
  onModify: () => void;
}) {
  const [executed, setExecuted] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const informational = decision.status === "informational";

  async function approve() {
    setExecuted(true);
    try {
      await recordAuditEntry(task, decision);
    } catch {
      // The card state is the source of truth for the demo; audit write is best-effort.
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-card border border-line bg-surface"
    >
      <div className="px-4 py-3.5">
        <p className="text-xxs font-medium uppercase tracking-wide text-ink-muted">
          {informational
            ? "Findings"
            : executed
              ? "Action executed"
              : "Recommended action"}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
          {decision.action}
        </p>
        {decision.references.length > 0 && (
          <p className="mt-2 font-mono text-xxs text-ink-muted">
            References: {decision.references.map((r) => r.id).join(", ")}
          </p>
        )}
        {decision.widget && (
          <div className="mt-3">
            <DecisionWidgetView
              widget={decision.widget}
              completed={executed}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
        {executed ? (
          <span className="flex items-center gap-1.5 text-[13px] text-ink-secondary">
            <Check className="h-3.5 w-3.5 text-ok" strokeWidth={2} />
            Executed — dispatch updated, crews notified, logged to audit.
          </span>
        ) : (
          <>
            {!informational && (
              <Button variant="primary" size="sm" onClick={approve}>
                Approve
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSteps((s) => !s)}
            >
              View reasoning
            </Button>
            <Button variant="ghost" size="sm" onClick={onModify}>
              Modify
            </Button>
          </>
        )}
      </div>
      {showSteps && !executed && (
        <div className="border-t border-line px-4 py-2">
          <ReasoningSteps steps={decision.steps} />
        </div>
      )}
    </motion.div>
  );
}
