import { PageHeader } from "@/components/ui/PageHeader";
import { isMinimaxConfigured } from "@/lib/llm";
import { Cpu, Database, ShieldCheck, Workflow } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const llmConfigured = isMinimaxConfigured();
  const model = process.env.MINIMAX_MODEL || "MiniMax-M3";
  const z3Enabled = process.env.DISABLE_Z3 !== "1";

  const rows: { icon: typeof Cpu; label: string; value: string; ok: boolean; note: string }[] = [
    {
      icon: Cpu,
      label: "Language model (intent parsing)",
      value: llmConfigured ? model : "Deterministic fallback",
      ok: llmConfigured,
      note: llmConfigured
        ? "Used only for intent + entity extraction. Never decides outcomes."
        : "MINIMAX_API_KEY not set — using deterministic parser.",
    },
    {
      icon: ShieldCheck,
      label: "Constraint solver",
      value: z3Enabled ? "z3-solver (WASM)" : "Deterministic fallback",
      ok: true,
      note: "All operational decisions are made by the deterministic solver.",
    },
    {
      icon: Database,
      label: "Data layer",
      value: "InMemoryMockRepository",
      ok: true,
      note: "Repository pattern — swappable for PostgreSQL with no caller changes.",
    },
    {
      icon: Workflow,
      label: "Performance budget",
      value: "< 4s deterministic core",
      ok: true,
      note: "Tool calls + validation + reasoning complete well under budget.",
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Platform architecture and runtime configuration."
      />
      <div className="card divide-y divide-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                <r.icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">{r.label}</div>
                <div className="mt-0.5 text-xs text-ink-muted">{r.note}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-ink">{r.value}</span>
              <span
                className={`h-2 w-2 rounded-full ${r.ok ? "bg-status-pass" : "bg-status-warn"}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
