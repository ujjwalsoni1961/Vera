import { NextResponse } from "next/server";
import { seedEdges, seedEntities, seedRules } from "@/lib/engine-core/seed";
import type { Entity, MemoryGraph } from "@/lib/engine-core/types";

export const runtime = "nodejs";

export async function GET() {
  const ruleNodes: Entity[] = seedRules.map((r) => ({
    id: r.id,
    type: "rule",
    attrs: { rule: r.naturalLanguage, scope: r.scope },
  }));
  const graph: MemoryGraph = {
    nodes: [...seedEntities, ...ruleNodes],
    edges: seedEdges,
  };
  return NextResponse.json(graph);
}
