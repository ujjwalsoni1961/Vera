import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/primitives";
import { getRepositories } from "@/lib/repositories";
import { relativeTime, formatLatency } from "@/lib/utils";
import { Workflow, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentRunsPage() {
  const repos = getRepositories();
  const [runs, tasks] = await Promise.all([repos.agentRuns.list(), repos.tasks.list()]);
  const taskOf = (id: string) => tasks.find((t) => t.id === id);

  return (
    <div>
      <PageHeader
        eyebrow="Execution"
        title="Agent Runs"
        description="Execution traces for every task: parsing, tool orchestration, validation, and recommendation."
      />
      <div className="space-y-3">
        {runs.map((run) => {
          const task = taskOf(run.taskId);
          return (
            <div key={run.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Workflow className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {task?.summary ?? task?.prompt ?? run.id}
                    </div>
                    <div className="font-mono text-[11px] text-ink-subtle">{run.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={run.status} tone="completed" />
                  {run.durationMs != null && (
                    <span className="chip text-[11px]">{formatLatency(run.durationMs)}</span>
                  )}
                  <span className="text-[11px] text-ink-subtle">{relativeTime(run.startedAt)}</span>
                </div>
              </div>
              {run.steps.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {run.steps.map((s, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                        s.status === "error"
                          ? "bg-red-50 text-status-fail"
                          : "bg-surface-muted text-ink-muted"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {s.kind.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
