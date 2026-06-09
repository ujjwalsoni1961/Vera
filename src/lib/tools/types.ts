import type { Repositories } from "@/lib/repositories";
import type { ToolCall } from "@/lib/domain/types";

export interface ToolContext {
  repos: Repositories;
  runId: string;
}

export interface ToolDefinition<I = Record<string, unknown>, O = unknown> {
  /** Stable machine name, e.g. "shipment_service". */
  name: string;
  /** Human title, e.g. "Shipment Service". */
  title: string;
  /** The connected system this tool represents. */
  service: string;
  description: string;
  run(input: I, ctx: ToolContext): Promise<O>;
}

export interface ToolExecutionResult<O = unknown> {
  call: ToolCall;
  output: O;
}
