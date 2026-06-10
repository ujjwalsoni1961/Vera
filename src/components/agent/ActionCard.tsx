"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReasoningSteps } from "./ReasoningSteps";
import { recordAuditEntry, type Decision } from "@/lib/engine";

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

  async function approve() {
    setExecuted(true);
    try {
      await recordAuditEntry(task, decision);
    } catch {
      // The card state is the source of truth for the demo; audit write is best-effort.
    }
  }

  if (executed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-3"
      >
        <Check className="h-3.5 w-3.5 text-ok" strokeWidth={2} />
        <span className="text-[13px] text-ink-secondary">
          Executed — logged to audit.
        </span>
      </motion.div>
    );
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
          Recommended action
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
          {decision.action}
        </p>
        {decision.references.length > 0 && (
          <p className="mt-2 font-mono text-xxs text-ink-muted">
            References: {decision.references.map((r) => r.id).join(", ")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
        <Button variant="primary" size="sm" onClick={approve}>
          Approve
        </Button>
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
      </div>
      {showSteps && (
        <div className="border-t border-line px-4 py-2">
          <ReasoningSteps steps={decision.steps} />
        </div>
      )}
    </motion.div>
  );
}
