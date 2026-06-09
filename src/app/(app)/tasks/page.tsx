import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/primitives";
import { getRepositories } from "@/lib/repositories";
import { relativeTime } from "@/lib/utils";
import { ListChecks } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const repos = getRepositories();
  const tasks = await repos.tasks.list();

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Tasks"
        description="Operational tasks submitted to the platform, with their resolution status."
      />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-subtle text-[11px] uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-3 font-semibold">Task</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Submitted by</th>
                <th className="px-5 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-surface-subtle">
                  <td className="px-5 py-3">
                    <div className="flex items-start gap-2">
                      <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" />
                      <div className="min-w-0">
                        <div className="font-medium text-ink">{t.summary ?? t.prompt}</div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-ink-subtle">{t.prompt}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><StatusBadge label={t.status} /></td>
                  <td className="px-5 py-3 text-ink-muted">{t.createdBy}</td>
                  <td className="px-5 py-3 text-ink-subtle">{relativeTime(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
