"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/pages/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import {
  listRules,
  parseRule,
  saveRule,
  type ParsedRule,
  type Rule,
} from "@/lib/engine";
import { ImportRulesModal } from "./ImportRulesModal";

type AddPhase = "closed" | "input" | "parsing" | "confirm" | "saving";

export function Rulebook() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [phase, setPhase] = useState<AddPhase>("closed");
  const [draft, setDraft] = useState("");
  const [parsed, setParsed] = useState<ParsedRule | null>(null);
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(() => {
    listRules().then(setRules);
  }, []);

  useEffect(refresh, [refresh]);

  async function handleParse() {
    if (!draft.trim()) return;
    setPhase("parsing");
    const result = await parseRule(draft.trim());
    setParsed(result);
    setPhase("confirm");
  }

  async function handleSave() {
    if (!parsed) return;
    setPhase("saving");
    await saveRule(parsed);
    setDraft("");
    setParsed(null);
    setPhase("closed");
    refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <PageHeader
        title="Rulebook"
        description="Business rules written in plain English, translated into a machine-checkable form. The solver applies every active rule to every decision."
        action={
          phase === "closed" ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImporting(true)}>
                <Download className="h-3.5 w-3.5" strokeWidth={2} />
                Import
              </Button>
              <Button variant="primary" onClick={() => setPhase("input")}>
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                Add rule
              </Button>
            </div>
          ) : undefined
        }
      />

      {phase !== "closed" && (
        <Card className="mb-6">
          <div className="px-5 py-4">
            <p className="text-[13px] font-medium text-ink">New rule</p>
            <p className="mt-0.5 text-xs text-ink-secondary">
              Write the rule the way you would explain it to a colleague.
            </p>
            <Textarea
              rows={2}
              className="mt-3"
              value={draft}
              autoFocus
              placeholder="e.g. Emergency callouts at daycare sites must be staffed before 15:00."
              onChange={(e) => setDraft(e.target.value)}
              disabled={phase === "parsing" || phase === "saving"}
            />
            {parsed && phase === "confirm" && (
              <div className="mt-3 rounded-md border border-line bg-page p-3.5">
                <p className="text-xxs font-medium uppercase tracking-wide text-ink-muted">
                  Derived structure — confirm before saving
                </p>
                <pre className="mt-2 overflow-x-auto font-mono text-xs leading-relaxed text-ink">
                  {parsed.structured}
                </pre>
                <p className="mt-2 text-xs text-ink-muted">
                  Scope: {parsed.scope}
                </p>
              </div>
            )}
            <div className="mt-3.5 flex items-center gap-2">
              {phase === "confirm" ? (
                <>
                  <Button variant="primary" size="sm" onClick={handleSave}>
                    Save rule
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleParse}>
                    Re-parse
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleParse}
                  disabled={!draft.trim() || phase === "parsing"}
                >
                  {phase === "parsing" ? "Parsing" : "Parse rule"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPhase("closed");
                  setParsed(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-xxs font-medium uppercase tracking-wide text-ink-muted">
              <th className="px-5 py-3">Rule</th>
              <th className="w-[38%] px-5 py-3">Structured form</th>
              <th className="w-36 px-5 py-3">Scope</th>
              <th className="w-32 px-5 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr
                key={rule.id}
                className="border-b border-line transition-colors last:border-b-0 hover:bg-page"
              >
                <td className="px-5 py-4 align-top">
                  <span className="mr-2 font-mono text-xs text-ink-muted">
                    {rule.id}
                  </span>
                  <span className="text-[13px] leading-relaxed text-ink">
                    {rule.naturalLanguage}
                  </span>
                  {rule.source && rule.source !== "workspace" && (
                    <span className="ml-2 rounded-full border border-line bg-page px-1.5 py-0.5 align-middle text-[10px] text-ink-muted">
                      {rule.source === "chat" ? "learned in chat" : "imported"}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 align-top">
                  <pre className="overflow-x-auto font-mono text-xxs leading-relaxed text-ink-secondary">
                    {rule.structured}
                  </pre>
                </td>
                <td className="px-5 py-4 align-top text-xs text-ink-secondary">
                  {rule.scope}
                </td>
                <td className="px-5 py-4 align-top text-xs text-ink-muted">
                  {formatDateTime(rule.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {importing && (
        <ImportRulesModal
          onClose={() => setImporting(false)}
          onImported={refresh}
        />
      )}
    </div>
  );
}
