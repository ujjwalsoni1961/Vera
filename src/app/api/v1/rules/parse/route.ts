import { NextResponse } from "next/server";
import { isMinimaxConfigured, minimaxChat, extractJson } from "@/lib/llm/minimax";
import { mockParseRule } from "@/lib/engine";
import type { ParsedRule } from "@/lib/engine-core/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You translate plain-English logistics business rules into a structured, machine-checkable form. Respond ONLY with JSON:
{"structured": "<rule in the form 'rule R_new: <conditions> -> <consequences>' using attribute paths like shipment.cargo_class, shipment.eta_hours_from_dispatch, shipment.customer.priority, require notify(...), require approval(...)>", "scope": "<one of: Cold chain, Hazmat routing, Service level, Customer communication, Workforce compliance, Cost control, Carrier compliance, General>"}
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
