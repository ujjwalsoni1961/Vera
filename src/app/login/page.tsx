import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { VeraMark } from "@/components/layout/Logo";

export const metadata: Metadata = {
  title: "Sign in · Vera",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex flex-col items-center text-center">
            <VeraMark size={36} />
            <h1 className="mt-5 text-[20px] font-semibold tracking-tight text-ink">
              Sign in to Vera
            </h1>
            <p className="mt-1.5 text-[13px] text-ink-secondary">
              Takapulpetti Oy workspace · Field Service · EU-North
            </p>
          </div>

          <div className="rounded-card border border-line bg-surface p-6 shadow-card-hover">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-xxs text-ink-muted">
            Access is limited to authorized operators of this workspace.
            <br />
            Need access? Contact your workspace administrator.
          </p>
        </div>
      </main>

      <footer className="flex items-center justify-center gap-3 pb-6 text-xxs text-ink-muted">
        <span>Vera by Nex0 Oy</span>
        <span className="text-ink-faint">·</span>
        <span>EU-region hosting</span>
        <span className="text-ink-faint">·</span>
        <span>GDPR-compliant</span>
      </footer>
    </div>
  );
}
