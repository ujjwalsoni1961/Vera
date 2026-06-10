"use client";

import { useRef, useState } from "react";
import { Check, FileUp, PlugZap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { useConnections } from "@/lib/connections";
import { parseRule, saveRule, type ParsedRule } from "@/lib/engine";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────────
// Import rules from a connected system or a policy file. Lines are parsed
// into structured form, reviewed with checkboxes, then saved to the rulebook.
// ────────────────────────────────────────────────────────────────────────────

const SYSTEM_POLICIES = [
  "Technicians must not start a P1 job without confirming safe isolation of the equipment.",
  "Customers receive an ETA notification when the technician is 30 minutes away.",
  "Parts over 500 euros require service manager approval before ordering.",
];

type Phase = "choose" | "parsing" | "review" | "saving";

export function ImportRulesModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const connections = useConnections();
  const [phase, setPhase] = useState<Phase>("choose");
  const [sourceLabel, setSourceLabel] = useState("");
  const [candidates, setCandidates] = useState<ParsedRule[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  async function parseLines(lines: string[], label: string) {
    setSourceLabel(label);
    setPhase("parsing");
    const texts = lines
      .map((l) => l.replace(/^[-*\d.\s"']+/, "").trim())
      .filter((l) => l.length > 12)
      .slice(0, 6);
    const parsed: ParsedRule[] = [];
    for (const text of texts) {
      try {
        parsed.push(await parseRule(text));
      } catch {
        // skip lines the parser rejects
      }
    }
    setCandidates(parsed);
    setSelected(new Set(parsed.map((_, i) => i)));
    setPhase("review");
  }

  function importFromSystem() {
    const vendor = connections.fsm ?? connections.erp ?? "connected system";
    void parseLines(SYSTEM_POLICIES, vendor);
  }

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      void parseLines(
        text.split(/\r?\n/).filter(Boolean),
        file.name
      );
    };
    reader.readAsText(file);
  }

  async function save() {
    setPhase("saving");
    for (const [i, rule] of candidates.entries()) {
      if (selected.has(i)) await saveRule(rule, "import");
    }
    onImported();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-line bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[13px] font-medium text-ink">Import rules</p>
            <p className="text-xs text-ink-muted">
              {phase === "review"
                ? `Parsed from ${sourceLabel} — review before adding`
                : "From a connected system or an existing policy document"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-muted transition-colors hover:bg-zinc-100 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {phase === "choose" && (
          <div className="space-y-2 p-4">
            <button
              onClick={importFromSystem}
              className="flex w-full items-start gap-3 rounded-lg border border-line p-3.5 text-left transition-colors hover:border-line-strong hover:bg-zinc-50"
            >
              <PlugZap className="mt-0.5 h-4 w-4 shrink-0 text-ink-secondary" />
              <span>
                <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                  From connected system
                  {connections.fsm && (
                    <span className="flex items-center gap-1.5 text-xs font-normal text-ink-secondary">
                      <StatusDot tone="ok" />
                      {connections.fsm}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  Pull dispatch policies already configured in your field
                  service system.
                </span>
              </span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-start gap-3 rounded-lg border border-line p-3.5 text-left transition-colors hover:border-line-strong hover:bg-zinc-50"
            >
              <FileUp className="mt-0.5 h-4 w-4 shrink-0 text-ink-secondary" />
              <span>
                <span className="block text-[13px] font-medium text-ink">
                  Upload a policy document
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  CSV, text or markdown — one policy per line. Each line is
                  parsed into a checkable rule.
                </span>
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,.md,text/plain,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </div>
        )}

        {phase === "parsing" && (
          <p className="px-5 py-8 text-center text-[13px] text-ink-secondary">
            Parsing policies from {sourceLabel}…
          </p>
        )}

        {(phase === "review" || phase === "saving") && (
          <>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {candidates.length === 0 && (
                <p className="py-6 text-center text-[13px] text-ink-muted">
                  No parseable policies found in {sourceLabel}.
                </p>
              )}
              {candidates.map((c, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setSelected((s) => {
                      const next = new Set(s);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    })
                  }
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    selected.has(i)
                      ? "border-accent-border bg-accent-soft/40"
                      : "border-line opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      selected.has(i)
                        ? "border-accent bg-accent text-white"
                        : "border-zinc-300 bg-surface"
                    )}
                  >
                    {selected.has(i) && (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-relaxed text-ink">
                      {c.naturalLanguage}
                    </span>
                    <pre className="mt-1.5 overflow-x-auto font-mono text-[10.5px] leading-relaxed text-ink-muted">
                      {c.structured}
                    </pre>
                    <span className="mt-1 block text-xxs text-ink-muted">
                      Scope: {c.scope}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={save}
                disabled={selected.size === 0 || phase === "saving"}
              >
                {phase === "saving"
                  ? "Adding…"
                  : `Add ${selected.size} rule${selected.size === 1 ? "" : "s"}`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
