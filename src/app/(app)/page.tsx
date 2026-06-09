import { KpiCard } from "@/components/ui/KpiCard";
import { TaskConsole } from "@/components/console/TaskConsole";
import { getDashboardStats } from "@/lib/dashboardStats";
import {
  Activity,
  AlertTriangle,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  FileWarning,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-7">
      <TaskConsole />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Operational summary</h2>
          <span className="text-xs text-ink-subtle">Last 24 hours</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Tasks Processed" value={stats.tasksProcessed.toLocaleString()} icon={Activity} tone="accent" delta={{ value: "12%", direction: "up" }} />
          <KpiCard label="Success Rate" value={`${stats.successRatePct}%`} icon={CheckCircle2} tone="brand" delta={{ value: "1.2%", direction: "up" }} />
          <KpiCard label="Tool Calls" value={stats.toolCalls.toLocaleString()} icon={Boxes} tone="neutral" delta={{ value: "8%", direction: "up" }} />
          <KpiCard label="Memory Hits" value={stats.memoryHits.toLocaleString()} icon={BrainCircuit} tone="brand" delta={{ value: "5%", direction: "up" }} />
          <KpiCard label="Active Risks" value={stats.activeRisks} icon={AlertTriangle} tone="warn" delta={{ value: "2", direction: "down" }} />
          <KpiCard label="Open Exceptions" value={stats.openExceptions} icon={FileWarning} tone="warn" delta={{ value: "0", direction: "flat" }} />
        </div>
      </section>
    </div>
  );
}
