"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const next = params.get("next");
        router.replace(next && next.startsWith("/") ? next : "/");
        router.refresh();
        return;
      }
      setError("That email and password combination is incorrect.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-[12.5px] font-medium text-ink"
        >
          Work email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="h-9 w-full rounded-md border border-line bg-page px-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-accent-border focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-[12.5px] font-medium text-ink"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-9 w-full rounded-md border border-line bg-page px-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-accent-border focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {error ? (
        <p className="rounded-md border border-bad/20 bg-bad/5 px-3 py-2 text-[12.5px] text-bad">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-accent text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
