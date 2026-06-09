import { PageHeader } from "@/components/ui/PageHeader";

export default function TasksPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Tasks"
        description="This module is being provisioned and will populate as operational data flows in."
      />
      <div className="card flex h-64 items-center justify-center p-8 text-sm text-ink-subtle">
        Module coming online…
      </div>
    </div>
  );
}
