import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";
import { runTask } from "@/lib/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json({ error: "Missing 'prompt'." }, { status: 400 });
    }
    const repos = getRepositories();
    const result = await runTask(prompt, repos, body.user || "C. Koskinen");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Run failed" },
      { status: 500 }
    );
  }
}
