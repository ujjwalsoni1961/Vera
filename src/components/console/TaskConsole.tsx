"use client";

import { useState } from "react";
import type { RunResult } from "@/lib/orchestrator/types";
import { ResultView } from "./ResultView";
import {
  ArrowRight,
  BrainCircuit,
  Loader2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Analyze Cargo Voyage-402 and determine whether it can safely transit the Brenner Pass route after the reported disruption.",
  "Which shipments are affected by the Rotterdam port disruption?",
  "Which deliveries violate thermal constraints today?",
  "Show all affected customers if Route Alpha becomes unavailable.",
];

const RUN_STAGES = [
  "Parsing intent (LLM)",
  "Selecting tools",
  "Querying connected systems",
  "Retrieving memory",
  "Validating constraints (z3)",
  "Composing recommendation",
];

export function TaskConsole() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);

  async function run(p: string) {
    const text = p.trim();
    if (!text || running) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setStage(0);
    const ticker = setInterval(
      () => setStage((s) => Math.min(s + 1, RUN_STAGES.length - 1)),
      650
    );
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data: RunResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      clearInterval(ticker);
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="relative p-6 lg:p-8">
          <div className="flex items-center gap-2">
            <span className="chip border-brand-200 bg-brand-50 text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              Neuro-symbolic engine
            </span>
            <span className="chip">
              <span className="inline-flex h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-500" />
              4 services connected
            </span>
          </div>

          <h1 className="mt-4 max-w-2xl text-2xl font-bold text-ink lg:text-[30px]">
            What logistics decision can we validate for you?
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Describe an operational task in plain language. Vera parses it,
            orchestrates connected systems, and validates every constraint with a
            deterministic solver — with a full audit trail.
          </p>

          <div className="mt-5 rounded-2xl border border-line bg-surface p-3 shadow-card">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run(prompt);
              }}
              disabled={running}
              placeholder="Enter a logistics task, disruption analysis request, operational question, or planning objective."
              className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none disabled:opacity-60"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <div className="flex items-center gap-2 text-[11px] text-ink-subtle">
                <BrainCircuit className="h-3.5 w-3.5 text-brand-600" />
                LLM parses intent · solver decides outcome
                <span className="hidden sm:inline">· ⌘↵ to run</span>
              </div>
              <button
                className="btn-primary"
                onClick={() => run(prompt)}
                disabled={running || !prompt.trim()}
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running
                  </>
                ) : (
                  <>
                    Run Task
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPrompt(p);
                  run(p);
                }}
                disabled={running}
                className="max-w-full truncate rounded-full border border-line bg-surface-subtle px-3 py-1.5 text-left text-xs font-medium text-ink-muted transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60"
                title={p}
              >
                {p.length > 64 ? p.slice(0, 64) + "…" : p}
              </button>
            ))}
          </div>
        </div>
      </section>

      {running && (
        <section className="card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            Executing pipeline
          </div>
          <ol className="mt-3 space-y-2">
            {RUN_STAGES.map((s, i) => (
              <li
                key={s}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  i < stage ? "text-ink" : i === stage ? "text-brand-700" : "text-ink-subtle"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    i < stage ? "bg-status-pass" : i === stage ? "animate-pulse-dot bg-brand-500" : "bg-line-strong"
                  }`}
                />
                {s}
              </li>
            ))}
          </ol>
        </section>
      )}

      {error && (
        <section className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-status-fail">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </section>
      )}

      {result && !running && <ResultView result={result} />}
    </div>
  );
}
