import type { Constraint } from "./types";
import type {
  Shipment,
  Route,
  RiskProfile,
} from "@/lib/domain/types";

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

/**
 * Build the constraint set for a route-feasibility evaluation of a shipment on
 * a candidate route. All bounds come from authoritative operational data —
 * never from the language model.
 */
export function buildRouteFeasibilityConstraints(
  shipment: Shipment,
  route: Route,
  risk: RiskProfile | null
): Constraint[] {
  const constraints: Constraint[] = [];

  // 1. Transit time
  constraints.push({
    id: "c_transit",
    kind: "transit_time",
    label: "Transit Time",
    requirement: `Transit Time ≤ ${shipment.maxTransitHours}h`,
    operator: "<=",
    expected: shipment.maxTransitHours,
    actual: route.durationHours,
    expectedDisplay: `≤ ${shipment.maxTransitHours}h`,
    actualDisplay: `${fmt(route.durationHours)}h`,
    unit: "h",
    criticality: "hard",
  });

  // 2. Route availability
  constraints.push({
    id: "c_availability",
    kind: "route_availability",
    label: "Route Availability",
    requirement: "Route must be available",
    operator: "==",
    expected: 1,
    actual: route.available ? 1 : 0,
    expectedDisplay: "Available",
    actualDisplay: route.available ? "Available" : "Unavailable",
    criticality: "hard",
  });

  // 3. Thermal constraints (only for temperature-controlled cargo)
  if (shipment.thermal.maxTempC !== null && shipment.currentTempC !== null) {
    constraints.push({
      id: "c_thermal_max",
      kind: "thermal_max",
      label: "Temperature (Max)",
      requirement: `Temperature ≤ ${shipment.thermal.maxTempC}°C`,
      operator: "<=",
      expected: shipment.thermal.maxTempC,
      actual: shipment.currentTempC,
      expectedDisplay: `≤ ${shipment.thermal.maxTempC}°C`,
      actualDisplay: `${fmt(shipment.currentTempC)}°C`,
      unit: "°C",
      criticality: "hard",
    });
  }
  if (shipment.thermal.minTempC !== null && shipment.currentTempC !== null) {
    constraints.push({
      id: "c_thermal_min",
      kind: "thermal_min",
      label: "Temperature (Min)",
      requirement: `Temperature ≥ ${shipment.thermal.minTempC}°C`,
      operator: ">=",
      expected: shipment.thermal.minTempC,
      actual: shipment.currentTempC,
      expectedDisplay: `≥ ${shipment.thermal.minTempC}°C`,
      actualDisplay: `${fmt(shipment.currentTempC)}°C`,
      unit: "°C",
      criticality: "hard",
    });
  }

  // 4. Prohibited zones — route must not enter any prohibited zone
  const violatingZones = route.zones.filter((z) =>
    shipment.prohibitedZones.includes(z)
  );
  constraints.push({
    id: "c_zones",
    kind: "prohibited_zone",
    label: "Prohibited Zones",
    requirement: "Route excludes all prohibited zones",
    operator: "subset_excludes",
    expected: 0,
    actual: violatingZones.length,
    expectedDisplay:
      shipment.prohibitedZones.length > 0
        ? `Excludes ${shipment.prohibitedZones.join(", ")}`
        : "No restrictions",
    actualDisplay:
      violatingZones.length > 0
        ? `Enters ${violatingZones.join(", ")}`
        : "Compliant",
    criticality: "hard",
  });

  // 5. Capacity (soft)
  constraints.push({
    id: "c_capacity",
    kind: "capacity",
    label: "Route Capacity",
    requirement: "Capacity utilisation < 100%",
    operator: "<=",
    expected: 99,
    actual: Math.round(route.capacityUtilization * 100),
    expectedDisplay: "< 100%",
    actualDisplay: `${Math.round(route.capacityUtilization * 100)}%`,
    unit: "%",
    criticality: "soft",
  });

  // 6. Risk threshold (soft)
  if (risk) {
    constraints.push({
      id: "c_risk",
      kind: "risk_threshold",
      label: "Operational Risk",
      requirement: "Risk score ≤ 70",
      operator: "<=",
      expected: 70,
      actual: risk.riskScore,
      expectedDisplay: "≤ 70",
      actualDisplay: `${risk.riskScore}`,
      criticality: "soft",
    });
  }

  return constraints;
}

/** Thermal-compliance check for a single shipment (used by thermal scans). */
export function buildThermalConstraints(shipment: Shipment): Constraint[] {
  const constraints: Constraint[] = [];
  if (shipment.thermal.maxTempC !== null && shipment.currentTempC !== null) {
    constraints.push({
      id: `c_thermal_max_${shipment.id}`,
      kind: "thermal_max",
      label: `${shipment.name} · Temp (Max)`,
      requirement: `Temperature ≤ ${shipment.thermal.maxTempC}°C`,
      operator: "<=",
      expected: shipment.thermal.maxTempC,
      actual: shipment.currentTempC,
      expectedDisplay: `≤ ${shipment.thermal.maxTempC}°C`,
      actualDisplay: `${fmt(shipment.currentTempC)}°C`,
      unit: "°C",
      criticality: "hard",
    });
  }
  if (shipment.thermal.minTempC !== null && shipment.currentTempC !== null) {
    constraints.push({
      id: `c_thermal_min_${shipment.id}`,
      kind: "thermal_min",
      label: `${shipment.name} · Temp (Min)`,
      requirement: `Temperature ≥ ${shipment.thermal.minTempC}°C`,
      operator: ">=",
      expected: shipment.thermal.minTempC,
      actual: shipment.currentTempC,
      expectedDisplay: `≥ ${shipment.thermal.minTempC}°C`,
      actualDisplay: `${fmt(shipment.currentTempC)}°C`,
      unit: "°C",
      criticality: "hard",
    });
  }
  return constraints;
}
