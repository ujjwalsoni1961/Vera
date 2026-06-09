import type { Repositories } from "@/lib/repositories";
import type { IntentType, ParsedIntent } from "./types";

// Deterministic, dependency-free parser. Always available and instant.
// Serves as the resilient fallback when the LLM is unavailable or slow, and
// guarantees the pipeline never breaks.

interface Vocab {
  shipments: { id: string; name: string }[];
  routes: { id: string; name: string }[];
  disruptions: { id: string; name: string }[];
  customers: { id: string; name: string }[];
}

export async function buildVocab(repos: Repositories): Promise<Vocab> {
  const [shipments, routes, disruptions, customers] = await Promise.all([
    repos.shipments.list(),
    repos.routes.list(),
    repos.disruptions.list(),
    repos.customers.list(),
  ]);
  return {
    shipments: shipments.map((s) => ({ id: s.id, name: s.name })),
    routes: routes.map((r) => ({ id: r.id, name: r.name })),
    disruptions: disruptions.map((d) => ({ id: d.id, name: d.name })),
    customers: customers.map((c) => ({ id: c.id, name: c.name })),
  };
}

function findEntity(
  text: string,
  entities: { name: string }[]
): string | null {
  const lower = text.toLowerCase();
  // Prefer the longest matching name.
  const matches = entities
    .filter((e) => lower.includes(e.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length);
  return matches[0]?.name ?? null;
}

function detectShipment(text: string, vocab: Vocab): string | null {
  const direct = findEntity(text, vocab.shipments);
  if (direct) return direct;
  // Match "Voyage-402" style tokens not in vocab.
  const m = text.match(/voyage[-\s]?(\w+)/i);
  if (m) {
    const candidate = `Voyage-${m[1]}`;
    const hit = vocab.shipments.find(
      (s) => s.name.toLowerCase() === candidate.toLowerCase()
    );
    return hit?.name ?? candidate;
  }
  return null;
}

export function classifyIntent(text: string): IntentType {
  const t = text.toLowerCase();
  if (/(thermal|temperature|cold|reefer|frozen|°c|degrees)/.test(t))
    return "thermal_compliance";
  if (/(affected customer|customer|sla|service level)/.test(t) && /(affect|impact|unavailable)/.test(t))
    return "customer_impact";
  if (/(affected|impact|disruption|disrupt)/.test(t) && /(shipment|deliver|customer|route)/.test(t))
    return "disruption_impact";
  if (/(risk|hazard|danger|exposure)/.test(t)) return "risk_assessment";
  if (/(can|safely|feasible|transit|reroute|alternative route|approve|viable|through .*route|route .*through)/.test(t))
    return "route_feasibility";
  if (/(status|where is|eta|lookup|show .*shipment|details of)/.test(t))
    return "shipment_lookup";
  return "general_query";
}

export async function heuristicParse(
  prompt: string,
  repos: Repositories
): Promise<ParsedIntent> {
  const vocab = await buildVocab(repos);
  const intent = classifyIntent(prompt);
  const shipmentName = detectShipment(prompt, vocab);
  const routeName = findEntity(prompt, vocab.routes);
  const disruptionName = findEntity(prompt, vocab.disruptions);
  const customerName = findEntity(prompt, vocab.customers);

  // Stated numeric constraints (hints only — authoritative values come from data).
  const transitMatch = prompt.match(/(\d+)\s*(?:h|hr|hour|hours)/i);
  const tempMatch = prompt.match(/(-?\d+)\s*°?\s*c\b/i);

  return {
    intent,
    entities: {
      shipmentName,
      routeName,
      disruptionName,
      customerName,
      cargoType: /temperature|thermal|reefer/.test(prompt.toLowerCase())
        ? "temperature_sensitive"
        : null,
      zone: null,
    },
    statedConstraints: {
      maxTransitHours: transitMatch ? Number(transitMatch[1]) : null,
      maxTempC: tempMatch ? Number(tempMatch[1]) : null,
      prohibitedZones: null,
    },
    explanation: `Interpreted as a ${intent.replace(/_/g, " ")} request${
      shipmentName ? ` for ${shipmentName}` : ""
    }${routeName ? ` on ${routeName}` : ""}.`,
    confidence: 0.62,
  };
}
