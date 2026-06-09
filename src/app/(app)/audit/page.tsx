import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/primitives";
import { getRepositories } from "@/lib/repositories";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const repos = getRepositories();
  const logs = await repos.auditLogs.list();

  return (
    <div>
      <PageHeader
        eyebrow="Governance"
        title="Audit Logs"
        description="Immutable, timestamped record of every parse, validation, decision, and approval."
      />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-subtle text-[11px] uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Event</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Outcome</th>
                <th className="px-5 py-3 font-semibold">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((a) => (
                <tr key={a.id} className="hover:bg-surface-subtle">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-ink-subtle">
                    {formatDateTime(a.timestamp)}
                  </td>
                  <td className="px-5 py-3 font-medium text-ink">{a.event}</td>
                  <td className="px-5 py-3 text-ink-muted">{a.action}</td>
                  <td className="px-5 py-3"><StatusBadge label={a.outcome} /></td>
                  <td className="px-5 py-3 text-ink-muted">{a.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
