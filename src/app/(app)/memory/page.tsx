import { PageHeader } from "@/components/ui/PageHeader";
import { getRepositories } from "@/lib/repositories";
import { relativeTime } from "@/lib/utils";
import { Brain, Repeat } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const repos = getRepositories();
  const entries = await repos.memory.list();

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge"
        title="Operational Memory"
        description="Reusable incident knowledge the agent retrieves to inform recommendations."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {entries.map((m) => (
          <div key={m.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Brain className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink">{m.title}</div>
                  <div className="text-[11px] text-ink-subtle">
                    {m.incidentType.replace(/_/g, " ")} · {relativeTime(m.createdAt)}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-[11px] font-semibold text-ink-muted">
                <Repeat className="h-3 w-3" />
                {m.reuseCount}×
              </span>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              <span className="font-semibold text-ink">Context · </span>
              {m.context}
            </p>
            <p className="mt-2 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-xs text-brand-900">
              <span className="font-semibold">Recommendation · </span>
              {m.recommendation}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {m.tags.map((t) => (
                <span key={t} className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
