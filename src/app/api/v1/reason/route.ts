import { NextResponse } from "next/server";
import { isMinimaxConfigured, minimaxChat, extractJson } from "@/lib/llm/minimax";
import { evaluateConstraints } from "@/lib/validation/z3engine";
import type { Constraint } from "@/lib/validation/types";
import {
  fallbackDecision,
  scenarios,
  seedEntities,
  seedRules,
} from "@/lib/engine-core/seed";
import type {
  Decision,
  DecisionWidget,
  Reference,
  ReasoningStep,
  WidgetStat,
} from "@/lib/engine-core/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// ────────────────────────────────────────────────────────────────────────────
// POST /api/v1/reason  { task } → Decision
// Live engine: the LLM reads the workspace snapshot and drafts the analysis,
// the Z3 solver verifies every numeric constraint check, and the response is
// the same Decision shape the mock engine produces. Any failure degrades to
// the scripted scenario engine so the product keeps working.
// ────────────────────────────────────────────────────────────────────────────

const KNOWN = new Map(
  [
    ...seedRules.map((r) => ({ id: r.id, type: "rule" as const })),
    ...seedEntities.map((e) => ({ id: e.id, type: e.type })),
  ].map((k) => [k.id.toLowerCase(), k])
);

function detectReferences(text: string): Reference[] {
  const t = text.toLowerCase();
  const refs: Reference[] = [];
  for (const [needle, k] of KNOWN) {
    if (t.includes(needle)) refs.push({ id: k.id, type: k.type });
  }
  return refs.slice(0, 4);
}

function validRefs(ids: unknown): Reference[] {
  if (!Array.isArray(ids)) return [];
  const refs: Reference[] = [];
  for (const id of ids) {
    const k = typeof id === "string" ? KNOWN.get(id.toLowerCase()) : undefined;
    if (k) refs.push({ id: k.id, type: k.type });
  }
  return refs.slice(0, 4);
}

// ── Workspace snapshot fed to the model ──────────────────────────────────────

function snapshot(): string {
  const rules = seedRules.map((r) => `${r.id}: ${r.naturalLanguage}`);
  const ent = seedEntities.map((e) => {
    const pos = e.lat ? ` @(${e.lat},${e.lng})` : "";
    const attrs = Object.entries(e.attrs)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    return `[${e.type}] ${e.id}${pos} — ${attrs}`;
  });
  return `RULES:\n${rules.join("\n")}\n\nENTITIES:\n${ent.join("\n")}`;
}

const SYSTEM_PROMPT = `You are the reasoning layer of Vera, the operations agent for Takapulpetti Oy, a Finnish building-systems field service company. You are given the live workspace snapshot (rules, technicians, vans, depots, sites, customers, parts, today's work orders) and an operator's task.

Analyse the task against the snapshot ONLY — never invent technicians, jobs, sites or rule numbers. Respond ONLY with JSON:
{
 "kind": "task" | "policy",                       // "policy" if the message states a standing rule rather than asking for work
 "summary": "<one-paragraph outcome summary>",
 "action": "<one imperative sentence: the concrete recommended action>",
 "status": "recommended" | "informational",       // informational for questions/reports
 "steps": [{"text": "<concrete reasoning step citing real ids and numbers>", "refs": ["<entity or rule id>"]}],   // 3-6 steps
 "checks": [{"rule": "<rule id>", "label": "<what is checked>", "actual": <number>, "operator": "<=" | ">=" | "==" | "!=", "expected": <number>, "unit": "<h|km|min|count>"}],   // 1-5 numeric constraint checks derived from the rules; realistic numbers
 "widget": <optional, concrete outcome>,
 "rule": {"naturalLanguage": "...", "structured": "rule R_new: <cond> -> <consequence>", "scope": "<Certifications|Service level|Workforce compliance|Parts & inventory|Customer communication|Safety|Cost control|General>"}   // only when kind=policy
}

Widget shapes (pick at most one, matching the task):
- route (route changes, dispatch): {"kind":"route","title":"...","stops":[{"label":"...","lat":60.1,"lng":24.9,"order":1,"kind":"site|depot|technician"}],"oldPath":[[lat,lng],...],"newPath":[[lat,lng],...],"stats":[{"label":"...","before":"...","after":"..."}]}  — use ONLY coordinates present in the snapshot.
- assignments (reassigning jobs): {"kind":"assignments","title":"...","rows":[{"job":"WO-...","site":"...","from":"...","to":"...","window":"HH:MM–HH:MM","note":"..."}],"stats":[...]}
- table (reports/overviews): {"kind":"table","title":"...","columns":[...],"rows":[[...],...]}

Style: plain, factual operations language. No emojis, no markdown. Finnish names and ids exactly as in the snapshot.`;

// ── Sanitizers ───────────────────────────────────────────────────────────────

const s = (v: unknown, max = 500): string =>
  typeof v === "string" ? v.slice(0, max) : "";
const n = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

function sanitizeSteps(raw: unknown): ReasoningStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 7)
    .map((st) => {
      const o = st as Record<string, unknown>;
      const text = s(o?.text, 450);
      if (!text) return null;
      const refs = validRefs(o?.refs);
      return { text, references: refs.length ? refs : detectReferences(text) };
    })
    .filter((x): x is ReasoningStep => x !== null);
}

function sanitizeChecks(raw: unknown): Constraint[] {
  if (!Array.isArray(raw)) return [];
  const ops = new Set(["<=", ">=", "==", "!="]);
  const out: Constraint[] = [];
  for (const [i, c] of raw.slice(0, 6).entries()) {
    const o = c as Record<string, unknown>;
    const actual = n(o?.actual);
    const expected = n(o?.expected);
    const operator = s(o?.operator, 2);
    const label = s(o?.label, 120);
    if (actual === null || expected === null || !ops.has(operator) || !label)
      continue;
    const unit = s(o?.unit, 8);
    out.push({
      id: `chk-${i + 1}`,
      kind: "rule_check",
      label: `${s(o?.rule, 8) || "rule"} — ${label}`,
      requirement: `${operator} ${expected}${unit ? ` ${unit}` : ""}`,
      operator: operator as Constraint["operator"],
      expected,
      actual,
      expectedDisplay: `${expected}${unit ? ` ${unit}` : ""}`,
      actualDisplay: `${actual}${unit ? ` ${unit}` : ""}`,
      unit,
      criticality: "hard",
    });
  }
  return out;
}

function sanitizePath(raw: unknown): [number, number][] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const pts = raw
    .slice(0, 12)
    .map((p) =>
      Array.isArray(p) && n(p[0]) !== null && n(p[1]) !== null
        ? ([p[0], p[1]] as [number, number])
        : null
    )
    .filter((p): p is [number, number] => p !== null);
  return pts.length >= 2 ? pts : undefined;
}

function sanitizeWidget(raw: unknown): DecisionWidget | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const w = raw as Record<string, unknown>;
  const title = s(w.title, 80) || "Result";

  if (w.kind === "route") {
    const stops = Array.isArray(w.stops)
      ? w.stops
          .slice(0, 8)
          .map((st) => {
            const o = st as Record<string, unknown>;
            const lat = n(o?.lat);
            const lng = n(o?.lng);
            const label = s(o?.label, 60);
            if (lat === null || lng === null || !label) return null;
            const kind = ["depot", "site", "technician"].includes(
              s(o?.kind, 12)
            )
              ? (s(o?.kind, 12) as "depot" | "site" | "technician")
              : undefined;
            return { label, lat, lng, order: n(o?.order) ?? undefined, kind };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
      : [];
    const newPath = sanitizePath(w.newPath);
    if (stops.length < 2 || !newPath) return undefined;
    return {
      kind: "route",
      title,
      stops,
      oldPath: sanitizePath(w.oldPath),
      newPath,
      stats: sanitizeStats(w.stats),
    };
  }

  if (w.kind === "assignments") {
    const rows = Array.isArray(w.rows)
      ? w.rows
          .slice(0, 6)
          .map((r) => {
            const o = r as Record<string, unknown>;
            const job = s(o?.job, 20);
            if (!job) return null;
            return {
              job,
              site: s(o?.site, 60),
              from: s(o?.from, 40),
              to: s(o?.to, 40),
              window: s(o?.window, 24),
              note: s(o?.note, 48) || undefined,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
      : [];
    if (rows.length === 0) return undefined;
    return { kind: "assignments", title, rows, stats: sanitizeStats(w.stats) };
  }

  if (w.kind === "table") {
    const columns = Array.isArray(w.columns)
      ? w.columns.slice(0, 6).map((c) => s(c, 32)).filter(Boolean)
      : [];
    const rows = Array.isArray(w.rows)
      ? w.rows
          .slice(0, 12)
          .map((r) =>
            Array.isArray(r)
              ? r.slice(0, columns.length).map((c) => s(c, 80))
              : null
          )
          .filter((r): r is string[] => r !== null && r.length > 0)
      : [];
    if (columns.length < 2 || rows.length === 0) return undefined;
    return { kind: "table", title, columns, rows };
  }

  return undefined;
}

function sanitizeStats(raw: unknown): WidgetStat[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 4)
    .map((st) => {
      const o = st as Record<string, unknown>;
      const label = s(o?.label, 40);
      const after = s(o?.after, 32);
      if (!label || !after) return null;
      return { label, before: s(o?.before, 32) || undefined, after };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

// ── Scripted fallback (engine must never go dark in a demo) ─────────────────

function scriptedDecision(task: string): Decision {
  const q = task.toLowerCase();
  const hit = scenarios.find((sc) => sc.match.some((m) => q.includes(m)));
  return JSON.parse(JSON.stringify(hit ? hit.decision : fallbackDecision));
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const task = typeof body.task === "string" ? body.task.trim() : "";
  if (!task) {
    return NextResponse.json({ error: "Missing 'task'." }, { status: 400 });
  }

  // Curated scenarios answer instantly and deterministically; the LLM handles
  // everything else against the same snapshot.
  const q = task.toLowerCase();
  if (
    !isMinimaxConfigured() ||
    scenarios.some((sc) => sc.match.some((m) => q.includes(m)))
  ) {
    return NextResponse.json(scriptedDecision(task));
  }

  try {
    const raw = await minimaxChat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${snapshot()}\n\nCurrent local time: ${new Date().toLocaleString("en-GB", { timeZone: "Europe/Helsinki" })}\n\nTASK: ${task}`,
        },
      ],
      { maxTokens: 2500, temperature: 0.15, timeoutMs: 50000 }
    );
    const json = extractJson(raw) as Record<string, unknown>;

    const summary = s(json.summary, 600);
    const action = s(json.action, 300);
    const steps = sanitizeSteps(json.steps);
    if (!summary || !action || steps.length === 0) {
      return NextResponse.json(scriptedDecision(task));
    }

    // Policy statements become confirmable rulebook additions.
    if (json.kind === "policy" && json.rule) {
      const r = json.rule as Record<string, unknown>;
      const naturalLanguage = s(r.naturalLanguage, 300) || task;
      const structured = s(r.structured, 400);
      if (structured) {
        const decision: Decision = {
          status: "informational",
          summary,
          action,
          references: [],
          steps,
          learnedRule: {
            naturalLanguage,
            structured,
            scope: s(r.scope, 40) || "General",
          },
        };
        return NextResponse.json(decision);
      }
    }

    // Z3 verifies every numeric check the model proposed.
    const checks = sanitizeChecks(json.checks);
    if (checks.length > 0) {
      const { results, engine } = await evaluateConstraints(checks);
      const lines = results.map(
        (c) =>
          `${c.label}: ${c.actualDisplay} against ${c.requirement} — ${
            c.result === "PASS" ? "satisfied" : "violated"
          }`
      );
      steps.push({
        text: `Solver verification (${engine}): ${lines.join("; ")}.`,
        references: results
          .map((c) => detectReferences(c.label))
          .flat()
          .slice(0, 4),
      });
    }

    const decision: Decision = {
      status: json.status === "informational" ? "informational" : "recommended",
      summary,
      action,
      references: detectReferences(`${action} ${summary}`),
      steps,
      widget: sanitizeWidget(json.widget),
    };
    return NextResponse.json(decision);
  } catch {
    return NextResponse.json(scriptedDecision(task));
  }
}
