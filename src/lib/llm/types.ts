export type IntentType =
  | "route_feasibility"
  | "disruption_impact"
  | "thermal_compliance"
  | "risk_assessment"
  | "customer_impact"
  | "shipment_lookup"
  | "general_query";

export interface ParsedEntities {
  shipmentName?: string | null;
  routeName?: string | null;
  disruptionName?: string | null;
  customerName?: string | null;
  cargoType?: string | null;
  zone?: string | null;
}

export interface StatedConstraints {
  maxTransitHours?: number | null;
  maxTempC?: number | null;
  prohibitedZones?: string[] | null;
}

/**
 * The structured logic representation produced by the parsing stage.
 * The LLM contributes ONLY intent, entities, stated constraints, and a
 * human-readable explanation. It never makes an operational decision.
 */
export interface ParsedIntent {
  intent: IntentType;
  entities: ParsedEntities;
  statedConstraints: StatedConstraints;
  explanation: string;
  confidence: number;
}

export type ParserSource = "minimax-m3" | "deterministic-fallback";

export interface ParseResult {
  parsed: ParsedIntent;
  source: ParserSource;
  latencyMs: number;
  /** Raw structured JSON for display in the UI. */
  rawJson: Record<string, unknown>;
  note?: string;
}

export const INTENT_LABELS: Record<IntentType, string> = {
  route_feasibility: "Route Feasibility",
  disruption_impact: "Disruption Impact",
  thermal_compliance: "Thermal Compliance",
  risk_assessment: "Risk Assessment",
  customer_impact: "Customer Impact",
  shipment_lookup: "Shipment Lookup",
  general_query: "General Query",
};
