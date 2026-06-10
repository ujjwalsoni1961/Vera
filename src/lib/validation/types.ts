export type ConstraintOperator = "<=" | ">=" | "==" | "!=" | "subset_excludes";

export type ConstraintKind =
  | "transit_time"
  | "thermal_max"
  | "thermal_min"
  | "route_availability"
  | "prohibited_zone"
  | "capacity"
  | "risk_threshold"
  | "sla_delay"
  | "rule_check";

/** A constraint expressed declaratively, before evaluation. */
export interface Constraint {
  id: string;
  kind: ConstraintKind;
  label: string;
  /** Human-readable requirement, e.g. "Transit Time ≤ 15h". */
  requirement: string;
  operator: ConstraintOperator;
  /** Numeric expected bound (when numeric). */
  expected: number | null;
  /** Numeric actual measured value (when numeric). */
  actual: number | null;
  /** Display strings for non-numeric constraints. */
  expectedDisplay: string;
  actualDisplay: string;
  unit?: string;
  /** Severity if this constraint fails. */
  criticality: "hard" | "soft";
}

export type ConstraintVerdict = "PASS" | "FAIL";

export interface ConstraintResult extends Constraint {
  result: ConstraintVerdict;
}

export type ValidationEngine = "z3-solver" | "deterministic-fallback";

export interface ValidationOutcome {
  /** Overall feasibility — true only if all HARD constraints pass. */
  feasible: boolean;
  constraints: ConstraintResult[];
  engine: ValidationEngine;
  /** Number of hard / soft failures. */
  hardFailures: number;
  softFailures: number;
  evaluationMs: number;
  /** Proof note from the solver. */
  proof: string;
}
