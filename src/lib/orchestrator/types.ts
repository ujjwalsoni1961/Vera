import type {
  Task,
  AgentRun,
  AgentStep,
  ToolCall,
  AuditLog,
  MemoryEntry,
} from "@/lib/domain/types";
import type { ParseResult } from "@/lib/llm/types";
import type { ValidationOutcome } from "@/lib/validation/types";

export type DecisionType =
  | "approved"
  | "rejected"
  | "review_required"
  | "informational";

export interface AlternativeRoute {
  routeId: string;
  name: string;
  durationHours: number;
  riskScore: number | null;
  reason: string;
}

export interface Recommendation {
  decision: DecisionType;
  headline: string;
  rationale: string;
  actions: string[];
  alternative: AlternativeRoute | null;
  /** Whether this recommendation requires human sign-off before execution. */
  needsApproval: boolean;
}

export interface RunTimings {
  parseMs: number;
  toolsMs: number;
  validationMs: number;
  /** Deterministic operational core (tools + validation + reasoning), excludes LLM. */
  deterministicCoreMs: number;
  totalMs: number;
}

export interface RunResult {
  task: Task;
  run: AgentRun;
  parse: ParseResult;
  steps: AgentStep[];
  toolCalls: ToolCall[];
  validation: ValidationOutcome | null;
  memoryHits: MemoryEntry[];
  recommendation: Recommendation;
  audit: AuditLog[];
  timings: RunTimings;
}
