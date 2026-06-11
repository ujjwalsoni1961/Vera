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
  const ring = Math.round(size * 1.9);
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: ring, height: ring }}
      >
        <svg viewBox="0 0 40 40" className="absolute inset-0 vera-spin" aria-hidden>
          <circle cx="20" cy="20" r="18" fill="none" stroke="#E3EAF3" strokeWidth="2.4" />
          <circle
            cx="20" cy="20" r="18" fill="none"
            stroke="#002F6C" strokeWidth="2.4" strokeLinecap="round"
            strokeDasharray="30 84"
          />
        </svg>
        <VeraMark size={size} className="vera-breathe" />
      </span>
      {label ? (
        <span className="text-[12.5px] text-ink-tertiary">{label}</span>
      ) : null}
    </div>
  );
}
