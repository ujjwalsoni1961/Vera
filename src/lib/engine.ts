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
    try {
      return await http<Decision>("/v1/reason", {
        method: "POST",
        body: JSON.stringify({ task, context: context ?? {} }),
      });
    } catch {
      // Engine unreachable: degrade to the local snapshot so work continues.
    }
  }
  await delay(450 + Math.random() * 350);
  return mockReason(task);
}

function mockReason(task: string): Decision {
  const q = task.toLowerCase();
  const hit = scenarios.find((s) => s.match.some((m) => q.includes(m)));
  if (hit) return structuredClone(hit.decision);
  if (looksLikePolicy(task)) return policyDecision(task);
  return structuredClone(fallbackDecision);
}

/** A task that states an operating policy rather than asking for work. */
function looksLikePolicy(text: string): boolean {
  if (text.includes("?") || text.length > 260) return false;
  return /\b(always|never|must|require[sd]?|from now on|going forward|new (rule|policy)|policy)\b/i.test(
    text
  );
}

function policyDecision(task: string): Decision {
  const parsed = mockParseRule(task);
  return {
    status: "informational",
    summary:
      "This reads as an operating policy rather than a one-off task, so I drafted it as a rule. Confirm below and it will constrain every future decision.",
    action: "Add the stated policy to the rulebook.",
    references: [],
    learnedRule: parsed,
    steps: [
      {
        text: "Classified the message as a standing policy: it states a condition that should hold in general, not a change to today's board.",
        references: [],
      },
      {
        text: `Parsed it into a machine-checkable form under scope “${parsed.scope}” and checked for conflicts with the existing rulebook — none found.`,
        references: [],
      },
      {
        text: "Once confirmed, the solver applies it to every future decision alongside the existing rules.",
        references: [],
      },
    ],
  };
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
export async function saveRule(
  parsed: ParsedRule,
  source: Rule["source"] = "workspace"
): Promise<Rule> {
  const added = readLocal<Rule>(RULES_KEY);
  const rule: Rule = {
    id: `R${seedRules.length + added.length + 1}`,
    ...parsed,
    updatedAt: new Date().toISOString(),
    source,
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
  if (/(cert|permit|tukes|f-gas|fgas|refriger|s2|electric)/.test(t))
    scope = "Certifications";
  else if (/(hour|working time|overtime|shift|rest)/.test(t))
    scope = "Workforce compliance";
  else if (/(sla|response|emergency|p1|priority|breach)/.test(t))
    scope = "Service level";
  else if (/(part|stock|inventory|van|depot)/.test(t))
    scope = "Parts & inventory";
  else if (/(notify|notification|customer|resident|confirm|window)/.test(t))
    scope = "Customer communication";
  else if (/(safety|live|pair|two people|alone)/.test(t)) scope = "Safety";
  else if (/(cost|euro|eur|€|budget|approval)/.test(t)) scope = "Cost control";

  const num = (re: RegExp): string | null => {
    const m = t.match(re);
    return m ? m[1].replace(/[,. ](?=\d{3})/g, "") : null;
  };

  const hours = num(/(\d+(?:\.\d+)?)\s*(?:hours|hour|h)\b/);
  const minutes = num(/(\d+)\s*(?:minutes|min)\b/);
  const euros = num(/([\d,. ]*\d)\s*(?:euros|eur|€)/);
  const days = num(/(\d+)\s*(?:business )?days?\b/);

  const conditions: string[] = [];
  if (/(p1|emergency|fault|alarm)/.test(t)) conditions.push("job.priority = P1");
  if (/gold/.test(t)) conditions.push("job.site.customer.sla = gold");
  if (/(daycare|school|päiväkoti)/.test(t))
    conditions.push("job.site.kind = daycare");
  if (/residen/.test(t)) conditions.push("job.site.kind = residential");
  if (/(gas|boiler)/.test(t)) conditions.push("job.equipment.fuel = gas");
  if (/(refriger|cooler|f-gas|fgas)/.test(t))
    conditions.push("job.tasks includes refrigerant_handling");

  const consequences: string[] = [];
  if (hours && /(within|respond|response|on site)/.test(t))
    consequences.push(`job.response_hours <= ${hours}`);
  else if (hours) consequences.push(`technician.day_hours <= ${hours}`);
  if (minutes && /(assign|dispatch)/.test(t))
    consequences.push(`job.assign_minutes <= ${minutes}`);
  if (days) consequences.push(`job.rebook_days <= ${days}`);
  if (/(cert|permit|tukes)/.test(t) && /gas/.test(t))
    consequences.push("job.technician.certs includes tukes_gas");
  if (/(f-gas|fgas|refriger)/.test(t))
    consequences.push("job.technician.certs includes f_gas");
  if (/(notify|notification|inform|confirm)/.test(t))
    consequences.push("require notify(job.customer)");
  if (/(approval|approve|sign[- ]?off)/.test(t))
    consequences.push("require approval(service_manager)");
  if (/(two people|second person|pair|not.*alone)/.test(t))
    consequences.push("job.crew_size >= 2");
  if (euros && /(above|over|exceed|more than)/.test(t))
    consequences.push(`require approval if job.parts_cost_eur > ${euros}`);
  if (/before 15|by 15:00|before 3 ?pm/.test(t))
    consequences.push("job.start_time <= 15:00");

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
