// ────────────────────────────────────────────────────────────────────────────
// Vera domain model
// Enterprise logistics intelligence entities. These are intentionally explicit
// and serializable so they can move cleanly across the repository boundary
// (InMemory today, PostgreSQL later).
// ────────────────────────────────────────────────────────────────────────────

export type CargoType =
  | "temperature_sensitive"
  | "hazardous"
  | "standard"
  | "high_value"
  | "perishable";

export type ShipmentStatus =
  | "in_transit"
  | "at_hub"
  | "delayed"
  | "exception"
  | "delivered"
  | "planned";

export type ServiceLevel = "platinum" | "gold" | "silver" | "standard";

export type Severity = "low" | "moderate" | "high" | "critical";

export interface ThermalRequirement {
  /** Maximum allowed temperature in Celsius (inclusive). */
  maxTempC: number | null;
  /** Minimum allowed temperature in Celsius (inclusive). */
  minTempC: number | null;
}

export interface Shipment {
  id: string;
  name: string; // e.g. "Voyage-402"
  customerId: string;
  status: ShipmentStatus;
  cargoType: CargoType;
  originHub: string;
  destinationHub: string;
  assignedRouteId: string;
  eta: string; // ISO
  weightKg: number;
  unitsCount: number;
  declaredValueEur: number;
  thermal: ThermalRequirement;
  /** Current measured temperature of the reefer unit, Celsius. */
  currentTempC: number | null;
  /** Zones the cargo is prohibited from transiting (compliance). */
  prohibitedZones: string[];
  /** Maximum permitted transit time in hours (SLA / cargo integrity). */
  maxTransitHours: number;
  priority: "p1" | "p2" | "p3";
  lastUpdated: string; // ISO
}

export interface Disruption {
  id: string;
  name: string; // e.g. "Brenner Pass Rockslide"
  type: "infrastructure" | "weather" | "port_congestion" | "labor" | "customs";
  severity: Severity;
  affectedRouteIds: string[];
  affectedZones: string[];
  reportedAt: string; // ISO
  status: "active" | "monitoring" | "resolved";
  summary: string;
}

export interface Route {
  id: string;
  name: string; // e.g. "Brenner Pass Corridor"
  origin: string;
  destination: string;
  available: boolean;
  durationHours: number;
  /** Geographic / regulatory zones the route passes through. */
  zones: string[];
  /** 0..1 capacity utilisation. */
  capacityUtilization: number;
  /** Whether the route supports active temperature control. */
  temperatureControlled: boolean;
  activeDisruptionIds: string[];
  distanceKm: number;
}

export interface RiskProfile {
  routeId: string;
  /** 0..100 composite operational risk score. */
  riskScore: number;
  disruptionIndicators: string[];
  weatherIndicators: string[];
  trend: "improving" | "stable" | "deteriorating";
}

export interface Customer {
  id: string;
  name: string; // e.g. "NordRetail"
  serviceLevel: ServiceLevel;
  region: string;
  /** Contractual maximum delay tolerance in hours before SLA breach. */
  slaMaxDelayHours: number;
  contactName: string;
  activeShipmentIds: string[];
}

// ── Operational / agentic entities ──────────────────────────────────────────

export type TaskStatus =
  | "queued"
  | "running"
  | "completed"
  | "needs_approval"
  | "rejected"
  | "failed";

export interface Task {
  id: string;
  prompt: string;
  status: TaskStatus;
  createdAt: string; // ISO
  createdBy: string;
  agentRunId: string | null;
  /** Short human label derived from intent. */
  summary?: string;
}

export type AgentStepKind =
  | "parsing"
  | "tool_selection"
  | "tool_execution"
  | "validation"
  | "memory"
  | "recommendation";

export type StepStatus = "pending" | "running" | "complete" | "error";

export interface AgentStep {
  kind: AgentStepKind;
  label: string;
  status: StepStatus;
  detail?: string;
  startedAt?: string;
  durationMs?: number;
}

export interface AgentRun {
  id: string;
  taskId: string;
  status: "running" | "completed" | "failed";
  steps: AgentStep[];
  startedAt: string; // ISO
  completedAt: string | null;
  durationMs: number | null;
}

export interface ToolCall {
  id: string;
  runId: string;
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  latencyMs: number;
  status: "success" | "error";
  timestamp: string; // ISO
}

export type AuditOutcome = "success" | "blocked" | "approved" | "rejected" | "info";

export interface AuditLog {
  id: string;
  timestamp: string; // ISO
  event: string;
  action: string;
  outcome: AuditOutcome;
  user: string;
  taskId: string | null;
}

export interface MemoryEntry {
  id: string;
  title: string; // e.g. "Brenner Pass rockslide mitigation"
  incidentType: string;
  context: string;
  recommendation: string;
  tags: string[];
  createdAt: string; // ISO
  reuseCount: number;
  /** Optional structured signature used for retrieval matching. */
  signals: string[];
}
