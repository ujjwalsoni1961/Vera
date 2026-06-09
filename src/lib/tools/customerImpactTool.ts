import type { ToolDefinition } from "./types";

export interface CustomerImpactToolInput {
  routeId?: string;
  disruptionId?: string;
  shipmentId?: string;
}

export interface AffectedCustomer {
  customerId: string;
  customer: string;
  serviceLevel: string;
  slaMaxDelayHours: number;
  affectedShipments: string[];
  serviceLevelImpact: "none" | "at_risk" | "breach_likely";
}

export interface CustomerImpactToolOutput {
  affectedCustomerCount: number;
  affectedShipmentCount: number;
  customers: AffectedCustomer[];
}

export const customerImpactTool: ToolDefinition<
  CustomerImpactToolInput,
  CustomerImpactToolOutput
> = {
  name: "customer_impact_service",
  title: "Customer Impact Service",
  service: "Customer Service",
  description:
    "Resolves which customers and shipments are affected by a route or disruption, with service-level impact.",
  async run(input, ctx) {
    const { repos } = ctx;

    // Resolve the set of impacted route ids.
    let routeIds: string[] = [];
    if (input.routeId) {
      routeIds = [input.routeId];
    } else if (input.disruptionId) {
      const d = await repos.disruptions.getById(input.disruptionId);
      routeIds = d?.affectedRouteIds ?? [];
    }

    // Resolve impacted shipments.
    const allShipments = await repos.shipments.list();
    let impacted = allShipments.filter((s) => routeIds.includes(s.assignedRouteId));
    if (input.shipmentId) {
      impacted = allShipments.filter((s) => s.id === input.shipmentId);
    }

    const customers = await repos.customers.list();
    const routes = await repos.routes.list();

    const byCustomer = new Map<string, string[]>();
    for (const s of impacted) {
      const arr = byCustomer.get(s.customerId) ?? [];
      arr.push(s.name);
      byCustomer.set(s.customerId, arr);
    }

    const affected: AffectedCustomer[] = [];
    for (const [customerId, ships] of byCustomer) {
      const c = customers.find((x) => x.id === customerId);
      if (!c) continue;
      // Determine impact: if any affected route is unavailable or high-risk -> breach likely
      const anyUnavailable = impacted
        .filter((s) => s.customerId === customerId)
        .some((s) => {
          const r = routes.find((rt) => rt.id === s.assignedRouteId);
          return r ? !r.available || r.activeDisruptionIds.length > 0 : false;
        });
      const impact: AffectedCustomer["serviceLevelImpact"] = anyUnavailable
        ? c.serviceLevel === "platinum" || c.serviceLevel === "gold"
          ? "breach_likely"
          : "at_risk"
        : "none";
      affected.push({
        customerId: c.id,
        customer: c.name,
        serviceLevel: c.serviceLevel,
        slaMaxDelayHours: c.slaMaxDelayHours,
        affectedShipments: ships,
        serviceLevelImpact: impact,
      });
    }

    return {
      affectedCustomerCount: affected.length,
      affectedShipmentCount: impacted.length,
      customers: affected,
    };
  },
};
