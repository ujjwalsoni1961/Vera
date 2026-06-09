import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Panel({
  title,
  icon: Icon,
  meta,
  children,
  className,
  accent,
}: {
  title: string;
  icon?: LucideIcon;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2">
          {Icon ? (
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                accent ? "bg-brand-50 text-brand-700" : "bg-surface-muted text-ink-muted"
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
        </div>
        {meta ? <div className="text-xs text-ink-subtle">{meta}</div> : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Verdict({ value }: { value: "PASS" | "FAIL" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        value === "PASS"
          ? "bg-brand-50 text-status-pass ring-1 ring-inset ring-brand-200"
          : "bg-red-50 text-status-fail ring-1 ring-inset ring-red-200"
      )}
    >
      {value}
    </span>
  );
}

const decisionStyles: Record<string, string> = {
  approved: "bg-brand-50 text-brand-700 ring-brand-200",
  rejected: "bg-red-50 text-status-fail ring-red-200",
  review_required: "bg-amber-50 text-amber-700 ring-amber-200",
  informational: "bg-accent-50 text-accent-700 ring-accent-200",
  needs_approval: "bg-amber-50 text-amber-700 ring-amber-200",
  completed: "bg-brand-50 text-brand-700 ring-brand-200",
  blocked: "bg-red-50 text-status-fail ring-red-200",
  success: "bg-brand-50 text-brand-700 ring-brand-200",
  approved_outcome: "bg-brand-50 text-brand-700 ring-brand-200",
  info: "bg-slate-100 text-slate-600 ring-slate-200",
  online: "bg-brand-50 text-brand-700 ring-brand-200",
};

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone?: string;
}) {
  const key = (tone ?? label).toLowerCase().replace(/\s+/g, "_");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset",
        decisionStyles[key] ?? "bg-slate-100 text-slate-600 ring-slate-200"
      )}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

export function KeyValue({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-xs text-ink-subtle">{k}</span>
      <span className="text-xs font-medium text-ink">{v}</span>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface-subtle px-4 py-8 text-center text-sm text-ink-subtle">
      {children}
    </div>
  );
}
