import { KpiCard } from "@/components/ui/KpiCard";
import {
  Activity,
  AlertTriangle,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  FileWarning,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Analyze Cargo Voyage-402 and determine whether it can safely transit the Brenner Pass route after the reported disruption.",
  "Which shipments are affected by the Rotterdam port disruption?",
  "Which deliveries violate thermal constraints today?",
  "Show all affected customers if Route Alpha becomes unavailable.",
];

export default function OverviewPage() {
  return (
    <div className="space-y-7">
      {/* Hero — Task Console */}
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

          {/* Task box (wired up in a later milestone) */}
          <div className="mt-5 rounded-2xl border border-line bg-surface p-3 shadow-card">
            <textarea
              rows={3}
              placeholder="Enter a logistics task, disruption analysis request, operational question, or planning objective."
              className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <div className="flex items-center gap-2 text-[11px] text-ink-subtle">
                <BrainCircuit className="h-3.5 w-3.5 text-brand-600" />
                LLM parses intent · solver decides outcome
              </div>
              <button className="btn-primary" disabled>
                Run Task
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Example prompts */}
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                className="max-w-full truncate rounded-full border border-line bg-surface-subtle px-3 py-1.5 text-left text-xs font-medium text-ink-muted transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                title={p}
              >
                {p.length > 64 ? p.slice(0, 64) + "…" : p}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Operational summary</h2>
          <span className="text-xs text-ink-subtle">Last 24 hours</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Tasks Processed"
            value="248"
            icon={Activity}
            tone="accent"
            delta={{ value: "12%", direction: "up" }}
          />
          <KpiCard
            label="Success Rate"
            value="96.4%"
            icon={CheckCircle2}
            tone="brand"
            delta={{ value: "1.2%", direction: "up" }}
          />
          <KpiCard
            label="Tool Calls"
            value="1,084"
            icon={Boxes}
            tone="neutral"
            delta={{ value: "8%", direction: "up" }}
          />
          <KpiCard
            label="Memory Hits"
            value="312"
            icon={BrainCircuit}
            tone="brand"
            delta={{ value: "5%", direction: "up" }}
          />
          <KpiCard
            label="Active Risks"
            value="7"
            icon={AlertTriangle}
            tone="warn"
            delta={{ value: "2", direction: "down" }}
          />
          <KpiCard
            label="Open Exceptions"
            value="3"
            icon={FileWarning}
            tone="warn"
            delta={{ value: "0", direction: "flat" }}
          />
        </div>
      </section>

      {/* Placeholder operational note */}
      <section className="card p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Activity className="h-4 w-4 text-brand-600" />
          Live execution console
        </div>
        <p className="mt-1.5 text-sm text-ink-muted">
          Run a task above to see real-time parsing, tool orchestration,
          deterministic validation traces, memory retrieval, and the audit trail.
        </p>
      </section>
    </div>
  );
}
