import { NextResponse } from "next/server";
import { seedRules } from "@/lib/engine-core/seed";
import type { Rule } from "@/lib/engine-core/types";

export const runtime = "nodejs";

/** Ephemeral per-instance store for rules added in live mode. */
const addedRules: Rule[] = [];

export async function GET() {
  return NextResponse.json([...seedRules, ...addedRules]);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.naturalLanguage || !body.structured) {
    return NextResponse.json(
      { error: "Missing 'naturalLanguage' or 'structured'." },
      { status: 400 }
    );
  }
  const rule: Rule = {
    id: `R${seedRules.length + addedRules.length + 1}`,
    naturalLanguage: String(body.naturalLanguage),
    structured: String(body.structured),
    scope: String(body.scope || "General"),
    updatedAt: new Date().toISOString(),
  };
  addedRules.push(rule);
  return NextResponse.json(rule);
}
