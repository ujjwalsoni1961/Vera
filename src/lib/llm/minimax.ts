// Minimal MiniMax chat client used exclusively for natural-language parsing.
// The model output is constrained to a strict JSON schema and is never trusted
// to make operational decisions.

const DEFAULT_BASE = "https://api.minimax.io/v1";
const DEFAULT_MODEL = "MiniMax-M3";

export interface MinimaxMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MinimaxOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export class MinimaxError extends Error {}

export function isMinimaxConfigured(): boolean {
  return Boolean(process.env.MINIMAX_API_KEY);
}

export async function minimaxChat(
  messages: MinimaxMessage[],
  opts: MinimaxOptions = {}
): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new MinimaxError("MINIMAX_API_KEY is not configured");

  const base = process.env.MINIMAX_API_BASE || DEFAULT_BASE;
  const model = process.env.MINIMAX_MODEL || DEFAULT_MODEL;
  const timeoutMs = opts.timeoutMs ?? 12000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}/text/chatcompletion_v2`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens ?? 420,
        temperature: opts.temperature ?? 0.05,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new MinimaxError(`MiniMax HTTP ${res.status}`);
    }
    const data = await res.json();
    const base_resp = data?.base_resp;
    if (base_resp && base_resp.status_code && base_resp.status_code !== 0) {
      throw new MinimaxError(`MiniMax error: ${base_resp.status_msg}`);
    }
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new MinimaxError("MiniMax returned empty content");
    // Reasoning models prepend a <think> block; strip it before parsing.
    return content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  } finally {
    clearTimeout(timer);
  }
}

/** Extract the first JSON object from a model response, tolerant of fences. */
export function extractJson(text: string): Record<string, unknown> {
  let t = text.trim();
  // strip markdown fences
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // find first { ... last }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1) throw new MinimaxError("No JSON object found");
  const slice = t.slice(first, last + 1);
  return JSON.parse(slice);
}
