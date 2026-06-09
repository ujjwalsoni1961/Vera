export * from "./types";
export * from "./registry";
export { shipmentTool } from "./shipmentTool";
export { routeTool } from "./routeTool";
export { riskTool } from "./riskTool";
export { customerImpactTool } from "./customerImpactTool";

export const CONNECTED_SYSTEMS = [
  { name: "Shipment Service", tool: "shipment_service", status: "online" as const },
  { name: "Route Service", tool: "route_service", status: "online" as const },
  { name: "Risk Service", tool: "risk_service", status: "online" as const },
  { name: "Customer Service", tool: "customer_impact_service", status: "online" as const },
];
