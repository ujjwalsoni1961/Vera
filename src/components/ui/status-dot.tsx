import { cn } from "@/lib/utils";

export type DotTone = "ok" | "warn" | "bad" | "neutral" | "accent";

const tones: Record<DotTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  neutral: "bg-ink-muted",
  accent: "bg-accent",
};

export function StatusDot({
  tone = "neutral",
  className,
  pulse = false,
}: {
  tone?: DotTone;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex h-1.5 w-1.5", className)}>
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-40",
            tones[tone]
          )}
        />
      )}
      <span
        className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", tones[tone])}
      />
    </span>
  );
}
