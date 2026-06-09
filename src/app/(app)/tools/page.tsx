import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/primitives";
import { getRepositories } from "@/lib/repositories";
import { CONNECTED_SYSTEMS, TOOLS } from "@/lib/tools";
import { formatLatency, formatTime } from "@/lib/utils";
import { Server, Boxes } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const repos = getRepositories();
  const calls = (await repos.toolCalls.list()).slice(0, 12);
  const descFor = (name: string) => TOOLS.find((t) => t.name === name)?.description ?? "";

  return (
    <div>
      <PageHeader
        eyebrow="Integrations"
        title="Connected Systems"
        description="Operational services the agent orchestrates. Each call is measured and logged."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CONNECTED_SYSTEMS.map((s) => (
          <div key={s.tool} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Server className="h-[18px] w-[18px]" />
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-status-pass">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-status-pass" />
                Online · Healthy
              </span>
            </div>
            <div className="mt-3 text-sm font-semibold text-ink">{s.name}</div>
            <div className="mt-0.5 font-mono text-[11px] text-ink-subtle">{s.tool}</div>
            <p className="mt-2 text-xs text-ink-muted">{descFor(s.tool)}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-7 flex items-center gap-2 text-sm font-semibold text-ink">
        <Boxes className="h-4 w-4 text-brand-600" /> Recent tool calls
      </h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-subtle text-[11px] uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-3 font-semibold">Tool</th>
                <th className="px-5 py-3 font-semibold">Latency</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {calls.map((c) => (
                <tr key={c.id} className="hover:bg-surface-subtle">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-ink">{c.toolName}</td>
                  <td className="px-5 py-3 text-ink-muted">{formatLatency(c.latencyMs)}</td>
                  <td className="px-5 py-3"><StatusBadge label={c.status} /></td>
                  <td className="px-5 py-3 text-ink-subtle">{formatTime(c.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
