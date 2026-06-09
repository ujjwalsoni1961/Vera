import { PageHeader } from "@/components/ui/PageHeader";

export default function MemoryPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Memory"
        description="This module is being provisioned and will populate as operational data flows in."
      />
      <div className="card flex h-64 items-center justify-center p-8 text-sm text-ink-subtle">
        Module coming online…
      </div>
    </div>
  );
}
