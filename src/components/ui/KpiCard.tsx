import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  tone?: "brand" | "accent" | "warn" | "neutral";
  hint?: string;
}

const toneMap: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-50 text-accent-700",
  warn: "bg-amber-50 text-amber-700",
  neutral: "bg-slate-100 text-slate-600",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  tone = "neutral",
  hint,
}: KpiCardProps) {
  return (
    <div className="card card-hover p-4">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            toneMap[tone]
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              delta.direction === "up" && "text-status-pass",
              delta.direction === "down" && "text-status-fail",
              delta.direction === "flat" && "text-ink-subtle"
            )}
          >
            {delta.direction === "up" && <ArrowUpRight className="h-3.5 w-3.5" />}
            {delta.direction === "down" && (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {delta.value}
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <div className="font-display text-2xl font-bold text-ink">{value}</div>
        <div className="mt-0.5 text-[13px] font-medium text-ink-muted">
          {label}
        </div>
        {hint ? (
          <div className="mt-1 text-[11px] text-ink-subtle">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}
