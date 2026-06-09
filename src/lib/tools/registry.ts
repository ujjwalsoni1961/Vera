import type { ToolDefinition, ToolContext, ToolExecutionResult } from "./types";
import type { ToolCall } from "@/lib/domain/types";
import { shipmentTool } from "./shipmentTool";
import { routeTool } from "./routeTool";
import { riskTool } from "./riskTool";
import { customerImpactTool } from "./customerImpactTool";

export const TOOLS: ToolDefinition<any, any>[] = [
  shipmentTool,
  routeTool,
  riskTool,
  customerImpactTool,
];

export function getTool(name: string): ToolDefinition<any, any> | undefined {
  return TOOLS.find((t) => t.name === name);
}

const uid = (p: string) =>
  `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Execute a tool with latency measurement and a persisted ToolCall record.
 * A small simulated service latency keeps the execution panel realistic while
 * staying comfortably within the performance budget.
 */
export async function executeTool<I, O>(
  name: string,
  input: I,
  ctx: ToolContext,
  opts: { simulateLatency?: boolean } = {}
): Promise<ToolExecutionResult<O>> {
  const tool = getTool(name);
  const start = Date.now();
  const timestamp = new Date().toISOString();

  if (!tool) {
    const call: ToolCall = {
      id: uid("tc"),
      runId: ctx.runId,
      toolName: name,
      input: input as Record<string, unknown>,
      output: { error: `Unknown tool: ${name}` },
      latencyMs: Date.now() - start,
      status: "error",
      timestamp,
    };
    await ctx.repos.toolCalls.create(call);
    return { call, output: { error: `Unknown tool: ${name}` } as O };
  }

  if (opts.simulateLatency !== false) {
    await new Promise((r) => setTimeout(r, 60 + Math.floor(Math.random() * 140)));
  }

  try {
    const output = (await tool.run(input as any, ctx)) as O;
    const call: ToolCall = {
      id: uid("tc"),
      runId: ctx.runId,
      toolName: name,
      input: input as Record<string, unknown>,
      output,
      latencyMs: Date.now() - start,
      status: "success",
      timestamp,
    };
    await ctx.repos.toolCalls.create(call);
    return { call, output };
  } catch (err) {
    const output = {
      error: err instanceof Error ? err.message : "Tool execution failed",
    };
    const call: ToolCall = {
      id: uid("tc"),
      runId: ctx.runId,
      toolName: name,
      input: input as Record<string, unknown>,
      output,
      latencyMs: Date.now() - start,
      status: "error",
      timestamp,
    };
    await ctx.repos.toolCalls.create(call);
    return { call, output: output as O };
  }
}
