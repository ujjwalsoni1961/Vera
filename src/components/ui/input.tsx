"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-8 w-full rounded-md border border-line-strong bg-surface px-3 text-[13px] text-ink",
      "placeholder:text-ink-muted",
      "focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent-border",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full resize-none rounded-md border border-line-strong bg-surface px-3 py-2.5 text-[13px] text-ink leading-relaxed",
      "placeholder:text-ink-muted",
      "focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent-border",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
