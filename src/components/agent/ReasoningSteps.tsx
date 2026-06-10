"use client";

import { motion } from "framer-motion";
import { ReferenceChip } from "./ReferenceChip";
import type { ReasoningStep } from "@/lib/engine";

/**
 * Renders a list of reasoning steps, optionally animated as they stream in.
 * Reused by the Agent workspace panel, the action card and the Audit trail.
 */
export function ReasoningSteps({
  steps,
  animated = false,
}: {
  steps: ReasoningStep[];
  animated?: boolean;
}) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const content = (
          <div className="flex gap-3 border-b border-line py-3 last:border-b-0">
            <span className="mt-px w-5 shrink-0 text-right font-mono text-xxs leading-[20px] text-ink-muted">
              {i + 1}
            </span>
            <p className="text-[13px] leading-relaxed text-ink">
              {step.text}
              {step.references.length > 0 && (
                <span className="ml-1.5 whitespace-nowrap">
                  {step.references.map((r) => (
                    <ReferenceChip key={r.id} reference={r} />
                  ))}
                </span>
              )}
            </p>
          </div>
        );
        return animated ? (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {content}
          </motion.li>
        ) : (
          <li key={i}>{content}</li>
        );
      })}
    </ol>
  );
}
