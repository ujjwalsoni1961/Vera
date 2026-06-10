import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-[12px] font-semibold text-white">
        V
      </div>
      <span className="text-[14px] font-semibold tracking-tight text-ink">
        Vera
      </span>
    </div>
  );
}
