import { NextResponse } from "next/server";
import { isMinimaxConfigured, minimaxChat, extractJson } from "@/lib/llm/minimax";
import { mockParseRule } from "@/lib/engine";
import type { ParsedRule } from "@/lib/engine-core/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You translate plain-English field-service business rules into a structured, machine-checkable form. Respond ONLY with JSON:
{"structured": "<rule in the form 'rule R_new: <conditions> -> <consequences>' using attribute paths like job.priority, job.site.customer.sla, job.technician.certs, job.response_hours, technician.day_hours, require notify(...), require approval(...)>", "scope": "<one of: Certifications, Service level, Workforce compliance, Parts & inventory, Customer communication, Safety, Cost control, General>"}
Keep the structured form short, deterministic, and faithful to the text. Do not invent thresholds.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
  }

  if (isMinimaxConfigured()) {
    try {
      const raw = await minimaxChat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        { temperature: 0 }
      );
      const json = extractJson(raw);
      if (typeof json.structured === "string" && json.structured.length > 0) {
        const parsed: ParsedRule = {
          naturalLanguage: text,
          structured: json.structured,
          scope: typeof json.scope === "string" ? json.scope : "General",
        };
        return NextResponse.json(parsed);
      }
    } catch {
      // fall through to deterministic parser
    }
  }

  return NextResponse.json(mockParseRule(text));
}
