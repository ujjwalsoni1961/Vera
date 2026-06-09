import type { Repositories } from "@/lib/repositories";
import type { IntentType, ParsedIntent, ParseResult } from "./types";
import { minimaxChat, extractJson, isMinimaxConfigured, MinimaxError } from "./minimax";
import { heuristicParse, buildVocab } from "./heuristicParser";

const VALID_INTENTS: IntentType[] = [
  "route_feasibility",
  "disruption_impact",
  "thermal_compliance",
  "risk_assessment",
  "customer_impact",
  "shipment_lookup",
  "general_query",
];

function buildSystemPrompt(vocab: {
  shipments: { name: string }[];
  routes: { name: string }[];
  disruptions: { name: string }[];
  customers: { name: string }[];
}): string {
  return [
    "You are the intent-parsing component of an enterprise logistics platform.",
    "Your ONLY job is to extract structured intent and entities. You must NOT make any operational decision, judgement, approval, or recommendation.",
    "Respond with ONLY minified JSON. No prose, no markdown, no deliberation.",
    "",
    "JSON schema:",
    '{"intent": one of ["route_feasibility","disruption_impact","thermal_compliance","risk_assessment","customer_impact","shipment_lookup","general_query"],',
    '"entities": {"shipmentName": string|null, "routeName": string|null, "disruptionName": string|null, "customerName": string|null, "cargoType": string|null, "zone": string|null},',
    '"statedConstraints": {"maxTransitHours": number|null, "maxTempC": number|null, "prohibitedZones": string[]|null},',
    '"explanation": string (one sentence, plain language restatement of the request),',
    '"confidence": number between 0 and 1}',
    "",
    "Map entities to these known records when applicable (use the exact names):",
    `Shipments: ${vocab.shipments.map((s) => s.name).join(", ")}`,
    `Routes: ${vocab.routes.map((r) => r.name).join(", ")}`,
    `Disruptions: ${vocab.disruptions.map((d) => d.name).join(", ")}`,
    `Customers: ${vocab.customers.map((c) => c.name).join(", ")}`,
  ].join("\n");
}

function normalizeName(
  value: string | null | undefined,
  options: { name: string }[]
): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  // exact
  const exact = options.find((o) => o.name.toLowerCase() === v);
  if (exact) return exact.name;
  // contains either direction
  const partial = options.find(
    (o) => o.name.toLowerCase().includes(v) || v.includes(o.name.toLowerCase())
  );
  return partial?.name ?? value;
}

function coerceParsed(
  raw: Record<string, unknown>,
  vocab: Awaited<ReturnType<typeof buildVocab>>
): ParsedIntent {
  const intent = VALID_INTENTS.includes(raw.intent as IntentType)
    ? (raw.intent as IntentType)
    : "general_query";
  const e = (raw.entities as Record<string, unknown>) ?? {};
  const sc = (raw.statedConstraints as Record<string, unknown>) ?? {};
  return {
    intent,
    entities: {
      shipmentName: normalizeName(e.shipmentName as string, vocab.shipments),
      routeName: normalizeName(e.routeName as string, vocab.routes),
      disruptionName: normalizeName(e.disruptionName as string, vocab.disruptions),
      customerName: normalizeName(e.customerName as string, vocab.customers),
      cargoType: (e.cargoType as string) ?? null,
      zone: (e.zone as string) ?? null,
    },
    statedConstraints: {
      maxTransitHours:
        typeof sc.maxTransitHours === "number" ? sc.maxTransitHours : null,
      maxTempC: typeof sc.maxTempC === "number" ? sc.maxTempC : null,
      prohibitedZones: Array.isArray(sc.prohibitedZones)
        ? (sc.prohibitedZones as string[])
        : null,
    },
    explanation:
      typeof raw.explanation === "string" ? raw.explanation : "Request parsed.",
    confidence:
      typeof raw.confidence === "number"
        ? Math.max(0, Math.min(1, raw.confidence))
        : 0.85,
  };
}

/**
 * Parse a natural-language request into structured logic.
 * Uses MiniMax-M3 as the primary parser and falls back to a deterministic
 * parser on error, timeout, or missing configuration. The fallback guarantees
 * the pipeline always produces a valid, fast result.
 */
export async function parseRequest(
  prompt: string,
  repos: Repositories,
  opts: { timeoutMs?: number } = {}
): Promise<ParseResult> {
  const start = Date.now();
  const vocab = await buildVocab(repos);

  if (!isMinimaxConfigured()) {
    const parsed = await heuristicParse(prompt, repos);
    return {
      parsed,
      source: "deterministic-fallback",
      latencyMs: Date.now() - start,
      rawJson: parsed as unknown as Record<string, unknown>,
      note: "LLM not configured — deterministic parser used.",
    };
  }

  try {
    const content = await minimaxChat(
      [
        { role: "system", content: buildSystemPrompt(vocab) },
        { role: "user", content: `Query: "${prompt}"` },
      ],
      { timeoutMs: opts.timeoutMs ?? Number(process.env.LLM_TIMEOUT_MS ?? 12000) }
    );
    const raw = extractJson(content);
    const parsed = coerceParsed(raw, vocab);
    return {
      parsed,
      source: "minimax-m3",
      latencyMs: Date.now() - start,
      rawJson: raw,
    };
  } catch (err) {
    const parsed = await heuristicParse(prompt, repos);
    const reason =
      err instanceof MinimaxError ? err.message : "LLM unavailable";
    return {
      parsed,
      source: "deterministic-fallback",
      latencyMs: Date.now() - start,
      rawJson: parsed as unknown as Record<string, unknown>,
      note: `Fell back to deterministic parser (${reason}).`,
    };
  }
}
