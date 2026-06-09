"use client";

import { useState } from "react";
import type { RunResult } from "@/lib/orchestrator/types";
import { Panel, Verdict, StatusBadge, KeyValue } from "@/components/ui/primitives";
import { formatLatency, formatTime } from "@/lib/utils";
import {
  Workflow,
  ShieldCheck,
  Boxes,
  Brain,
  ScrollText,
  CheckCircle2,
  XCircle,
  Gauge,
  Code2,
  Lightbulb,
  ArrowRight,
  CircleDot,
} from "lucide-react";

function decisionTone(d: string) {
  if (d === "approved") return { icon: CheckCircle2, color: "text-status-pass", ring: "ring-brand-200 bg-brand-50" };
  if (d === "rejected") return { icon: XCircle, color: "text-status-fail", ring: "ring-red-200 bg-red-50" };
  if (d === "review_required") return { icon: ShieldCheck, color: "text-amber-600", ring: "ring-amber-200 bg-amber-50" };
  return { icon: Lightbulb, color: "text-accent-600", ring: "ring-accent-200 bg-accent-50" };
}

export function ResultView({ result }: { result: RunResult }) {
  const { recommendation: rec, validation, timings } = result;
  const tone = decisionTone(rec.decision);
  const DIcon = tone.icon;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Recommendation headline */}
      <section className={`rounded-2xl border p-5 ring-1 ring-inset ${tone.ring}`}>
        <div className="flex items-start gap-3">
          <DIcon className={`mt-0.5 h-6 w-6 shrink-0 ${tone.color}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={rec.decision} />
              <span className="text-[11px] font-medium text-ink-subtle">
                Decision issued by deterministic solver
              </span>
            </div>
            <h3 className="mt-2 text-lg font-bold text-ink">{rec.headline}</h3>
            <p className="mt-1 text-sm text-ink-muted">{rec.rationale}</p>
            {rec.actions.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {rec.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Performance budget */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PerfStat label="Total" value={formatLatency(timings.totalMs)} icon={Gauge} />
        <PerfStat
          label="Deterministic core"
          value={formatLatency(timings.deterministicCoreMs)}
          icon={ShieldCheck}
          good={timings.deterministicCoreMs < 4000}
          hint="< 4s budget"
        />
        <PerfStat label="LLM extraction" value={formatLatency(timings.parseMs)} icon={Brain} />
        <PerfStat label="Validation" value={formatLatency(timings.validationMs)} icon={CheckCircle2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Agent execution */}
        <Panel title="Agent Execution" icon={Workflow} accent meta={`run ${result.run.id.slice(-6)}`}>
          <ol className="relative space-y-3">
            {result.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ring-2 ${
                      s.status === "error"
                        ? "bg-red-50 text-status-fail ring-red-200"
                        : "bg-brand-50 text-brand-700 ring-brand-200"
                    }`}
                  >
                    {s.status === "error" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                  </span>
                  {i < result.steps.length - 1 && <span className="my-0.5 w-px flex-1 bg-line" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                      {s.kind.replace(/_/g, " ")}
                    </span>
                    {typeof s.durationMs === "number" && (
                      <span className="text-[10px] font-medium text-ink-subtle">
                        {formatLatency(s.durationMs)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-ink">{s.label}</div>
                  {s.detail && <div className="mt-0.5 text-xs text-ink-muted">{s.detail}</div>}
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        {/* Reasoning trace */}
        <Panel
          title="Reasoning Trace"
          icon={ShieldCheck}
          accent
          meta={validation ? validation.engine : "—"}
        >
          {validation ? (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-[10px] uppercase tracking-wide text-ink-subtle">
                      <th className="pb-2 pr-2 font-semibold">Constraint</th>
                      <th className="pb-2 pr-2 font-semibold">Expected</th>
                      <th className="pb-2 pr-2 font-semibold">Actual</th>
                      <th className="pb-2 font-semibold">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {validation.constraints.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2 pr-2">
                          <div className="font-medium text-ink">{c.label}</div>
                          <div className="text-[10px] text-ink-subtle">
                            {c.criticality === "hard" ? "Hard" : "Advisory"}
                          </div>
                        </td>
                        <td className="py-2 pr-2 font-mono text-ink-muted">{c.expectedDisplay}</td>
                        <td className="py-2 pr-2 font-mono text-ink">{c.actualDisplay}</td>
                        <td className="py-2">
                          <Verdict value={c.result} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border border-line bg-surface-subtle px-3 py-2 text-xs text-ink-muted">
                <span className="font-semibold text-ink">Proof · </span>
                {validation.proof}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-subtle">No constraint validation for this intent.</p>
          )}
        </Panel>

        {/* Tool execution */}
        <Panel title="Tool Execution" icon={Boxes} meta={`${result.toolCalls.length} calls`}>
          <div className="space-y-2">
            {result.toolCalls.map((t) => (
              <ToolRow key={t.id} call={t} />
            ))}
          </div>
        </Panel>

        {/* Memory */}
        <Panel title="Memory Retrieval" icon={Brain} meta={`${result.memoryHits.length} hits`}>
          {result.memoryHits.length ? (
            <div className="space-y-2">
              {result.memoryHits.map((m) => (
                <div key={m.id} className="rounded-xl border border-line bg-surface-subtle p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{m.title}</span>
                    <span className="chip text-[10px]">{m.reuseCount}× reused</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{m.recommendation}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-subtle">No matching operational memory.</p>
          )}
        </Panel>
      </div>

      {/* Human approval */}
      {rec.needsApproval && <ApprovalRow result={result} />}

      {/* Structured parse + audit */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StructuredParse result={result} />
        <Panel title="Audit Trail" icon={ScrollText} meta={`${result.audit.length} events`}>
          <div className="space-y-1.5">
            {result.audit.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 border-b border-line py-1.5 last:border-0">
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-ink">{a.event}</div>
                  <div className="truncate text-[11px] text-ink-subtle">{a.action}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge label={a.outcome} />
                  <span className="text-[10px] text-ink-subtle">{formatTime(a.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PerfStat({
  label,
  value,
  icon: Icon,
  good,
  hint,
}: {
  label: string;
  value: string;
  icon: typeof Gauge;
  good?: boolean;
  hint?: string;
}) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-subtle">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-bold text-ink">{value}</div>
      {hint && (
        <div className={`text-[10px] font-medium ${good ? "text-status-pass" : "text-ink-subtle"}`}>
          {good ? "✓ " : ""}
          {hint}
        </div>
      )}
    </div>
  );
}

function ToolRow({ call }: { call: RunResult["toolCalls"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <CircleDot
            className={`h-3.5 w-3.5 ${call.status === "success" ? "text-status-pass" : "text-status-fail"}`}
          />
          <span className="font-mono text-xs font-medium text-ink">{call.toolName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-ink-subtle">{formatLatency(call.latencyMs)}</span>
          <StatusBadge label={call.status} />
        </div>
      </button>
      {open && (
        <div className="grid gap-2 border-t border-line px-3 py-2 sm:grid-cols-2">
          <div>
            <div className="text-[10px] font-semibold uppercase text-ink-subtle">Input</div>
            <pre className="mt-1 overflow-x-auto rounded-md bg-surface-subtle p-2 text-[10px] text-ink-muted">
              {JSON.stringify(call.input, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-ink-subtle">Output</div>
            <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-surface-subtle p-2 text-[10px] text-ink-muted">
              {JSON.stringify(call.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function StructuredParse({ result }: { result: RunResult }) {
  return (
    <Panel
      title="Structured Logic (LLM Extraction)"
      icon={Code2}
      meta={`${result.parse.source} · ${formatLatency(result.parse.latencyMs)}`}
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        <span className="chip border-brand-200 bg-brand-50 text-brand-700">
          intent: {result.parse.parsed.intent}
        </span>
        <span className="chip">confidence: {(result.parse.parsed.confidence * 100).toFixed(0)}%</span>
      </div>
      <pre className="max-h-60 overflow-auto rounded-lg bg-ink p-3 text-[11px] leading-relaxed text-brand-100">
        {JSON.stringify(result.parse.rawJson, null, 2)}
      </pre>
      <p className="mt-2 text-[11px] text-ink-subtle">
        The language model extracts intent and entities only. It never determines
        the outcome — that is decided by the deterministic solver above.
      </p>
    </Panel>
  );
}

function ApprovalRow({ result }: { result: RunResult }) {
  const [state, setState] = useState<"pending" | "approved" | "rejected">("pending");
  return (
    <Panel title="Human Approval Workflow" icon={ShieldCheck} accent>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge label={state} tone={state === "approved" ? "approved" : state === "rejected" ? "rejected" : "needs_approval"} />
          <span className="text-sm text-ink-muted">
            {state === "pending"
              ? "This recommendation requires operations sign-off before dispatch."
              : state === "approved"
                ? `Approved — ${result.recommendation.alternative?.name ?? "action"} authorised.`
                : "Rejected — escalated to operations control."}
          </span>
        </div>
        {state === "pending" && (
          <div className="flex gap-2">
            <button className="btn-ghost text-status-fail" onClick={() => setState("rejected")}>
              Reject
            </button>
            <button className="btn-primary" onClick={() => setState("approved")}>
              Approve
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}
