/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

export function VeraMark({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/vera-mark.png"
      alt="Vera"
      width={size}
      height={size}
      draggable={false}
      className={cn("select-none", className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <VeraMark size={22} />
      <span className="text-[14px] font-semibold tracking-tight text-ink">
        Vera
      </span>
    </div>
  );
}

/** Pulsing mark used as the agent's thinking / loading indicator. */
export function VeraThinking({
  size = 16,
  label,
  className,
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <VeraMark size={size} className="vera-breathe" />
      {label ? (
        <span className="text-[12.5px] text-ink-tertiary">{label}</span>
      ) : null}
    </div>
  );
}
