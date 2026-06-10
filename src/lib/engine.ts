// ────────────────────────────────────────────────────────────────────────────
// Typed engine API. Two modes, identical types:
//   mock — seeded in-process engine; the demo always works.
//   live — HTTP calls to the Vera engine API (NEXT_PUBLIC_ENGINE_API_URL,
//          defaults to this app's own /api, which runs the LLM + Z3 pipeline).
// Select with NEXT_PUBLIC_ENGINE_MODE=mock|live.
// ────────────────────────────────────────────────────────────────────────────

import type {
  AuditEntry,
  Decision,
  EngineMode,
  Entity,
  MemoryGraph,
  ParsedRule,
  Rule,
} from "./engine-core/types";
import {
  fallbackDecision,
  scenarios,
  seedAuditEntries,
  seedEdges,
  seedEntities,
  seedRules,
} from "./engine-core/seed";

export type {
  AuditEntry,
  Decision,
  DecisionStatus,
  EngineMode,
  Entity,
  GraphEdge,
  MemoryGraph,
  ParsedRule,
  Reference,
  ReferenceType,
  ReasoningStep,
  Rule,
} from "./engine-core/types";

export function getEngineMode(): EngineMode {
  return process.env.NEXT_PUBLIC_ENGINE_MODE === "live" ? "live" : "mock";
}

function apiBase(): string {
  return process.env.NEXT_PUBLIC_ENGINE_API_URL || "/api";
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`Engine API ${path} responded ${res.status}`);
  }
  return (await res.json()) as T;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Local (browser) state: user-added rules and executed decisions ──────────

const RULES_KEY = "vera.rules.added";
const AUDIT_KEY = "vera.audit.added";

function readLocal<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

// ── API surface ──────────────────────────────────────────────────────────────

/** Run a task through the engine and return the full decision with trace. */
export async function reason(
  task: string,
  context?: Record<string, unknown>
): Promise<Decision> {
  if (getEngineMode() === "live") {
    return http<Decision>("/v1/reason", {
      method: "POST",
      body: JSON.stringify({ task, context: context ?? {} }),
    });
  }
  await delay(450 + Math.random() * 350);
  const q = task.toLowerCase();
  const hit = scenarios.find((s) => s.match.some((m) => q.includes(m)));
  return structuredClone(hit ? hit.decision : fallbackDecision);
}

/** Parse a plain-English rule into its structured form for confirmation. */
export async function parseRule(text: string): Promise<ParsedRule> {
  if (getEngineMode() === "live") {
    return http<ParsedRule>("/v1/rules/parse", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }
  await delay(350 + Math.random() * 250);
  return mockParseRule(text);
}

export async function listRules(): Promise<Rule[]> {
  if (getEngineMode() === "live") {
    return http<Rule[]>("/v1/rules");
  }
  await delay(120);
  return [...seedRules, ...readLocal<Rule>(RULES_KEY)];
}

/** Persist a confirmed rule (mock mode: browser-local). */
export async function saveRule(parsed: ParsedRule): Promise<Rule> {
  const added = readLocal<Rule>(RULES_KEY);
  const rule: Rule = {
    id: `R${seedRules.length + added.length + 1}`,
    ...parsed,
    updatedAt: new Date().toISOString(),
  };
  if (getEngineMode() === "live") {
    return http<Rule>("/v1/rules", {
      method: "POST",
      body: JSON.stringify(parsed),
    });
  }
  writeLocal(RULES_KEY, [...added, rule]);
  return rule;
}

export async function getMemoryGraph(): Promise<MemoryGraph> {
  if (getEngineMode() === "live") {
    return http<MemoryGraph>("/v1/memory/graph");
  }
  await delay(120);
  const ruleNodes: Entity[] = seedRules.map((r) => ({
    id: r.id,
    type: "rule",
    attrs: { rule: r.naturalLanguage, scope: r.scope },
  }));
  return { nodes: [...seedEntities, ...ruleNodes], edges: seedEdges };
}

export async function listAuditEntries(): Promise<AuditEntry[]> {
  const local = readLocal<AuditEntry>(AUDIT_KEY);
  if (getEngineMode() === "live") {
    const remote = await http<AuditEntry[]>("/v1/audit");
    return [...local, ...remote].sort((a, b) => b.ts.localeCompare(a.ts));
  }
  await delay(120);
  return [...local, ...seedAuditEntries].sort((a, b) =>
    b.ts.localeCompare(a.ts)
  );
}

/** Record an approved decision to the audit trail (mock mode: browser-local). */
export async function recordAuditEntry(
  task: string,
  decision: Decision
): Promise<AuditEntry> {
  const entry: AuditEntry = {
    id: `AUD-${Date.now().toString().slice(-6)}`,
    ts: new Date().toISOString(),
    task,
    decision: { ...decision, status: "executed" },
  };
  if (getEngineMode() === "live") {
    return http<AuditEntry>("/v1/audit", {
      method: "POST",
      body: JSON.stringify(entry),
    });
  }
  writeLocal(AUDIT_KEY, [entry, ...readLocal<AuditEntry>(AUDIT_KEY)]);
  return entry;
}

// ── Deterministic mock rule parser ───────────────────────────────────────────

export function mockParseRule(text: string): ParsedRule {
  const t = text.toLowerCase();
  const cleaned = text.trim().replace(/\s+/g, " ");

  let scope = "General";
  if (/(temp|refriger|cold|reefer|degree)/.test(t)) scope = "Cold chain";
  else if (/(hazard|hazmat|dangerous|adr|residential)/.test(t))
    scope = "Hazmat routing";
  else if (/(notify|notification|customer|inform)/.test(t))
    scope = "Customer communication";
  else if (/(driver|duty|rest|hours of service)/.test(t))
    scope = "Workforce compliance";
  else if (/(cost|euro|eur|budget|approval)/.test(t)) scope = "Cost control";
  else if (/(insur|carrier|tier)/.test(t)) scope = "Carrier compliance";
  else if (/(window|deliver|eta|hour)/.test(t)) scope = "Service level";

  const num = (re: RegExp): string | null => {
    const m = t.match(re);
    return m ? m[1].replace(/[,. ](?=\d{3})/g, "") : null;
  };

  const hours = num(/(\d+)\s*(?:hours|hour|h)\b/);
  const degrees = num(/(\d+(?:\.\d+)?)\s*(?:degrees|°c|c\b)/);
  const euros = num(/([\d,. ]*\d)\s*(?:euros|eur|€)/);

  const conditions: string[] = [];
  if (/(hazard|hazmat|dangerous)/.test(t))
    conditions.push("shipment.cargo_class = hazardous");
  if (/refriger|reefer|cold/.test(t))
    conditions.push("shipment.cargo_class = refrigerated");
  if (/priority/.test(t)) conditions.push("shipment.customer.priority = true");
  if (euros && /(above|over|exceed|more than)/.test(t))
    conditions.push(`shipment.declared_value_eur > ${euros}`);

  const consequences: string[] = [];
  if (degrees) consequences.push(`shipment.max_recorded_temp_c <= ${degrees}`);
  if (hours && /(within|window|deliver)/.test(t))
    consequences.push(`shipment.eta_hours_from_dispatch <= ${hours}`);
  if (/not.*(residential|school|city centre|city center)/.test(t))
    consequences.push(
      "not exists z in shipment.route.zones : z.classification = residential"
    );
  if (/notify|notification|inform/.test(t))
    consequences.push("require notify(shipment.customer)");
  if (/approval|approve|sign[- ]?off/.test(t))
    consequences.push("require approval(ops_manager)");
  if (/tier[- ]?1|insur/.test(t) && euros)
    consequences.push("shipment.carrier.insurance_tier = 1");

  const head = conditions.length ? conditions.join("\n  and ") : "true";
  const body = consequences.length
    ? consequences.join("\n  and ")
    : `satisfies("${cleaned}")`;

  return {
    naturalLanguage: cleaned,
    structured: `rule R_new: ${head}\n  -> ${body}`,
    scope,
  };
}
