// ────────────────────────────────────────────────────────────────────────────
// Shared engine types. Identical shapes for mock and live modes.
// ────────────────────────────────────────────────────────────────────────────

export type ReferenceType =
  | "rule"
  | "shipment"
  | "route"
  | "zone"
  | "carrier"
  | "customer"
  | "port";

export interface Reference {
  id: string;
  type: ReferenceType;
}

export interface Rule {
  id: string;
  naturalLanguage: string;
  /** Derived machine-checkable form, rendered in monospace. */
  structured: string;
  scope: string;
  updatedAt: string;
}

export interface Entity {
  id: string;
  type: ReferenceType;
  attrs: Record<string, string | number | boolean>;
}

export interface ReasoningStep {
  text: string;
  references: Reference[];
}

export type DecisionStatus =
  | "recommended"
  | "executed"
  | "informational"
  | "rejected";

export interface Decision {
  /** One-paragraph analyst summary of the outcome. */
  summary: string;
  /** Short action sentence for the recommended-action card. */
  action: string;
  references: Reference[];
  steps: ReasoningStep[];
  status: DecisionStatus;
}

export interface AuditEntry {
  id: string;
  ts: string;
  task: string;
  decision: Decision;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface MemoryGraph {
  nodes: Entity[];
  edges: GraphEdge[];
}

export interface ParsedRule {
  naturalLanguage: string;
  structured: string;
  scope: string;
}

export type EngineMode = "mock" | "live";
