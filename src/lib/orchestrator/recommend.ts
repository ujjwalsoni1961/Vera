import type { Repositories } from "@/lib/repositories";
import type { Shipment, Route, MemoryEntry } from "@/lib/domain/types";
import type { ValidationOutcome } from "@/lib/validation/types";
import type { AlternativeRoute, Recommendation } from "./types";

/**
 * Find a compliant alternative route for a shipment when its current route
 * fails validation. Deterministic: prefers same origin/destination, available,
 * within transit budget, temperature-controlled if required, lowest risk.
 */
export async function findAlternativeRoute(
  shipment: Shipment,
  currentRoute: Route,
  repos: Repositories
): Promise<AlternativeRoute | null> {
  const routes = await repos.routes.list();
  const needsTemp = shipment.thermal.maxTempC !== null;

  const candidates = routes.filter(
    (r) =>
      r.id !== currentRoute.id &&
      r.available &&
      r.origin === currentRoute.origin &&
      r.destination === currentRoute.destination &&
      r.durationHours <= shipment.maxTransitHours &&
      (!needsTemp || r.temperatureControlled) &&
      !r.zones.some((z) => shipment.prohibitedZones.includes(z))
  );

  if (candidates.length === 0) return null;

  // Rank by risk score (lowest first), then duration.
  const withRisk = await Promise.all(
    candidates.map(async (r) => {
      const risk = await repos.risks.getByRoute(r.id);
      return { route: r, risk: risk?.riskScore ?? 50 };
    })
  );
  withRisk.sort((a, b) => a.risk - b.risk || a.route.durationHours - b.route.durationHours);
  const best = withRisk[0];

  return {
    routeId: best.route.id,
    name: best.route.name,
    durationHours: best.route.durationHours,
    riskScore: best.risk,
    reason: `Available, ${best.route.durationHours}h transit (within ${shipment.maxTransitHours}h limit)${
      needsTemp ? ", temperature-controlled" : ""
    }, risk ${best.risk}.`,
  };
}

/**
 * Build a deterministic recommendation from validation results. The language
 * model never influences this decision — it is derived purely from the proof.
 */
export function buildRecommendation(args: {
  shipment: Shipment;
  route: Route;
  validation: ValidationOutcome;
  alternative: AlternativeRoute | null;
  memoryHits: MemoryEntry[];
}): Recommendation {
  const { shipment, route, validation, alternative, memoryHits } = args;
  const memRef =
    memoryHits.length > 0
      ? ` Prior incident memory "${memoryHits[0].title}" recommends: ${memoryHits[0].recommendation}`
      : "";

  if (validation.feasible) {
    const softNote =
      validation.softFailures > 0
        ? " Advisory constraints flagged (capacity/risk) — monitor during transit."
        : "";
    return {
      decision: "approved",
      headline: `${shipment.name} cleared for ${route.name}`,
      rationale: `All hard constraints satisfied. ${validation.proof}${softNote}${memRef}`,
      actions: [
        `Confirm ${shipment.name} on ${route.name}`,
        "Continue real-time monitoring",
      ],
      alternative,
      needsApproval: false,
    };
  }

  // Not feasible
  const failedLabels = validation.constraints
    .filter((c) => c.criticality === "hard" && c.result === "FAIL")
    .map((c) => `${c.label} (${c.actualDisplay} vs ${c.expectedDisplay})`);

  if (alternative) {
    return {
      decision: "review_required",
      headline: `${shipment.name} cannot use ${route.name} — reroute via ${alternative.name}`,
      rationale: `${validation.proof} Recommended reroute via ${alternative.name}: ${alternative.reason}${memRef}`,
      actions: [
        `Reroute ${shipment.name} via ${alternative.name}`,
        "Notify affected customer of revised ETA",
        "Require operations sign-off before dispatch",
      ],
      alternative,
      needsApproval: true,
    };
  }

  return {
    decision: "rejected",
    headline: `${shipment.name} blocked on ${route.name} — no compliant alternative`,
    rationale: `${validation.proof} No available route satisfies all constraints (${failedLabels.join(
      ", "
    )}).${memRef}`,
    actions: [
      "Hold shipment at current hub",
      "Escalate to operations control",
      "Re-evaluate when disruption clears",
    ],
    alternative: null,
    needsApproval: true,
  };
}
