// ────────────────────────────────────────────────────────────────────────────
// Shared engine types. Identical shapes for mock and live modes.
// Domain: Takapulpetti Oy — building-systems field service across Finland.
// ────────────────────────────────────────────────────────────────────────────

export type ReferenceType =
  | "rule"
  | "technician"
  | "vehicle"
  | "job"
  | "site"
  | "customer"
  | "part"
  | "depot"
  | "region"
  | "sla";

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
  /** Where the rule came from: seeded, confirmed in chat, or imported. */
  source?: "workspace" | "chat" | "import";
}

export interface Entity {
  id: string;
  type: ReferenceType;
  attrs: Record<string, string | number | boolean>;
  /** Real-world coordinates when the entity has a location. */
  lat?: number;
  lng?: number;
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

// ── Result widgets rendered inside the chat after a decision ────────────────

export interface MapStop {
  label: string;
  lat: number;
  lng: number;
  /** 1-based visit order on the new route. */
  order?: number;
  kind?: "depot" | "site" | "technician";
}

export interface WidgetStat {
  label: string;
  before?: string;
  after: string;
}

/** Old vs new route on a real map, with outcome stats. */
export interface RouteWidget {
  kind: "route";
  title: string;
  stops: MapStop[];
  /** Polyline of the previous plan (dashed). Omit if there was none. */
  oldPath?: [number, number][];
  /** Polyline of the executed/recommended plan. */
  newPath: [number, number][];
  stats: WidgetStat[];
}

/** Per-job reassignment outcome table. */
export interface AssignmentWidget {
  kind: "assignments";
  title: string;
  rows: {
    job: string;
    site: string;
    from: string;
    to: string;
    window: string;
    note?: string;
  }[];
  stats?: WidgetStat[];
}

/** Generic result table (e.g. SLA risk report). */
export interface TableWidget {
  kind: "table";
  title: string;
  columns: string[];
  rows: string[][];
}

export type DecisionWidget = RouteWidget | AssignmentWidget | TableWidget;

export interface Decision {
  /** One-paragraph analyst summary of the outcome. */
  summary: string;
  /** Short action sentence for the recommended-action card. */
  action: string;
  references: Reference[];
  steps: ReasoningStep[];
  status: DecisionStatus;
  /** Concrete outcome rendered in the chat (map, assignment table, report). */
  widget?: DecisionWidget;
  /** Set when the task stated a policy: proposed rulebook addition. */
  learnedRule?: ParsedRule;
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
