import { NextResponse } from "next/server";
import { seedAuditEntries } from "@/lib/engine-core/seed";
import type { AuditEntry } from "@/lib/engine-core/types";

export const runtime = "nodejs";

/** Ephemeral per-instance store for entries recorded in live mode. */
const addedEntries: AuditEntry[] = [];

export async function GET() {
  return NextResponse.json(
    [...addedEntries, ...seedAuditEntries].sort((a, b) =>
      b.ts.localeCompare(a.ts)
    )
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.task || !body.decision) {
    return NextResponse.json(
      { error: "Missing 'task' or 'decision'." },
      { status: 400 }
    );
  }
  const entry: AuditEntry = {
    id: String(body.id || `AUD-${Date.now()}`),
    ts: String(body.ts || new Date().toISOString()),
    task: String(body.task),
    decision: body.decision,
  };
  addedEntries.unshift(entry);
  return NextResponse.json(entry);
}
