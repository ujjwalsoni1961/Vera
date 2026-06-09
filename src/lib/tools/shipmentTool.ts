import type { ToolDefinition } from "./types";
import type { Shipment } from "@/lib/domain/types";

export interface ShipmentToolInput {
  shipmentName?: string;
  shipmentId?: string;
  customerId?: string;
  cargoType?: string;
}

export interface ShipmentSummary {
  id: string;
  name: string;
  customer: string;
  status: string;
  route: string;
  eta: string;
  cargoType: string;
  currentTempC: number | null;
  maxTransitHours: number;
  thermalMaxC: number | null;
  prohibitedZones: string[];
}

export interface ShipmentToolOutput {
  matched: number;
  shipments: ShipmentSummary[];
}

function summarize(s: Shipment, customerName: string, routeName: string): ShipmentSummary {
  return {
    id: s.id,
    name: s.name,
    customer: customerName,
    status: s.status,
    route: routeName,
    eta: s.eta,
    cargoType: s.cargoType,
    currentTempC: s.currentTempC,
    maxTransitHours: s.maxTransitHours,
    thermalMaxC: s.thermal.maxTempC,
    prohibitedZones: s.prohibitedZones,
  };
}

export const shipmentTool: ToolDefinition<ShipmentToolInput, ShipmentToolOutput> = {
  name: "shipment_service",
  title: "Shipment Service",
  service: "Shipment Service",
  description:
    "Returns shipment records: id, customer, status, route, ETA, cargo type, and integrity constraints.",
  async run(input, ctx) {
    const { repos } = ctx;
    let result: Shipment[] = [];

    if (input.shipmentName) {
      const s = await repos.shipments.getByName(input.shipmentName);
      if (s) result = [s];
    } else if (input.shipmentId) {
      const s = await repos.shipments.getById(input.shipmentId);
      if (s) result = [s];
    } else if (input.customerId) {
      result = await repos.shipments.listByCustomer(input.customerId);
    } else {
      result = await repos.shipments.list();
    }

    if (input.cargoType) {
      result = result.filter((s) => s.cargoType === input.cargoType);
    }

    const customers = await repos.customers.list();
    const routes = await repos.routes.list();
    const custName = (id: string) => customers.find((c) => c.id === id)?.name ?? id;
    const routeName = (id: string) => routes.find((r) => r.id === id)?.name ?? id;

    return {
      matched: result.length,
      shipments: result.map((s) =>
        summarize(s, custName(s.customerId), routeName(s.assignedRouteId))
      ),
    };
  },
};
