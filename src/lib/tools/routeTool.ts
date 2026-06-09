import type { ToolDefinition } from "./types";

export interface RouteToolInput {
  routeId?: string;
  routeName?: string;
}

export interface RouteToolOutput {
  id: string;
  name: string;
  available: boolean;
  durationHours: number;
  capacityUtilization: number;
  temperatureControlled: boolean;
  zones: string[];
  origin: string;
  destination: string;
  disruptions: {
    id: string;
    name: string;
    severity: string;
    status: string;
    summary: string;
  }[];
  found: boolean;
}

export const routeTool: ToolDefinition<RouteToolInput, RouteToolOutput> = {
  name: "route_service",
  title: "Route Service",
  service: "Route Service",
  description:
    "Returns route availability, transit duration, active disruptions, and capacity utilisation.",
  async run(input, ctx) {
    const { repos } = ctx;
    const route = input.routeId
      ? await repos.routes.getById(input.routeId)
      : input.routeName
        ? await repos.routes.getByName(input.routeName)
        : null;

    if (!route) {
      return {
        id: input.routeId ?? input.routeName ?? "unknown",
        name: input.routeName ?? "Unknown route",
        available: false,
        durationHours: 0,
        capacityUtilization: 0,
        temperatureControlled: false,
        zones: [],
        origin: "",
        destination: "",
        disruptions: [],
        found: false,
      };
    }

    const allDisruptions = await repos.disruptions.list();
    const disruptions = allDisruptions
      .filter((d) => route.activeDisruptionIds.includes(d.id))
      .map((d) => ({
        id: d.id,
        name: d.name,
        severity: d.severity,
        status: d.status,
        summary: d.summary,
      }));

    return {
      id: route.id,
      name: route.name,
      available: route.available,
      durationHours: route.durationHours,
      capacityUtilization: route.capacityUtilization,
      temperatureControlled: route.temperatureControlled,
      zones: route.zones,
      origin: route.origin,
      destination: route.destination,
      disruptions,
      found: true,
    };
  },
};
