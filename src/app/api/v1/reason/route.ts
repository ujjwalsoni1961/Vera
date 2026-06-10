import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";
import { runTask } from "@/lib/orchestrator";
import type {
  Decision,
  Reference,
  ReasoningStep,
} from "@/lib/engine-core/types";
import { seedEntities, seedRules } from "@/lib/engine-core/seed";

export const runtime = "nodejs";
export const maxDuration = 60;

// ────────────────────────────────────────────────────────────────────────────
// POST /api/v1/reason  { task, context } → Decision
// Live engine: LLM parses the task into structured intent; the Z3 constraint
// solver decides; the result is adapted to the shared Decision type.
// ────────────────────────────────────────────────────────────────────────────

const KNOWN_IDS = [
  ...seedRules.map((r) => ({ id: r.id, type: "rule" as const })),
  ...seedEntities.map((e) => ({ id: e.id, type: e.type })),
];

/** Find seed entity/rule references mentioned in a free-text step. */
function detectReferences(text: string): Reference[] {
  const t = text.toLowerCase();
  const refs: Reference[] = [];
  for (const k of KNOWN_IDS) {
    const plain = k.id.toLowerCase();
    const spaced = plain.replace(/-/g, " ");
    if (t.includes(plain) || t.includes(spaced)) {
      refs.push({ id: k.id, type: k.type });
    }
  }
  return refs.slice(0, 4);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const task = typeof body.task === "string" ? body.task.trim() : "";
    if (!task) {
      return NextResponse.json({ error: "Missing 'task'." }, { status: 400 });
    }

    const repos = getRepositories();
    const result = await runTask(task, repos, "engine-api");

    const steps: ReasoningStep[] = [];

    steps.push({
      text: result.parse.parsed.explanation,
      references: detectReferences(result.parse.parsed.explanation),
    });

    if (result.toolCalls.length > 0) {
      const tools = result.toolCalls.map((c) => c.toolName).join(", ");
      steps.push({
        text: `Queried operational state: ${tools}.`,
        references: [],
      });
    }

    if (result.validation) {
      for (const c of result.validation.constraints) {
        const verdict =
          c.result === "PASS" ? "satisfied" : "violated";
        const text = `${c.label}: ${c.actualDisplay} against limit ${c.expectedDisplay}; constraint ${verdict}.`;
        steps.push({ text, references: detectReferences(c.label) });
      }
    }

    steps.push({
      text: result.recommendation.rationale,
      references: detectReferences(result.recommendation.rationale),
    });

    const decision: Decision = {
      summary: result.recommendation.rationale,
      action: result.recommendation.headline,
      references: Array.from(
        new Map(
          steps.flatMap((s) => s.references).map((r) => [r.id, r])
        ).values()
      ).slice(0, 5),
      steps,
      status:
        result.recommendation.decision === "informational"
          ? "informational"
          : "recommended",
    };

    return NextResponse.json(decision);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reasoning failed" },
      { status: 500 }
    );
  }
}
