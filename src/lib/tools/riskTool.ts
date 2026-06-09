import type { ToolDefinition } from "./types";

export interface RiskToolInput {
  routeId?: string;
  routeName?: string;
}

export interface RiskToolOutput {
  routeId: string;
  riskScore: number;
  band: "low" | "moderate" | "elevated" | "high";
  disruptionIndicators: string[];
  weatherIndicators: string[];
  trend: string;
  found: boolean;
}

function band(score: number): RiskToolOutput["band"] {
  if (score >= 75) return "high";
  if (score >= 50) return "elevated";
  if (score >= 30) return "moderate";
  return "low";
}

export const riskTool: ToolDefinition<RiskToolInput, RiskToolOutput> = {
  name: "risk_service",
  title: "Risk Service",
  service: "Risk Service",
  description:
    "Returns composite operational risk score, disruption indicators, and weather indicators for a route.",
  async run(input, ctx) {
    const { repos } = ctx;
    let routeId = input.routeId;
    if (!routeId && input.routeName) {
      const route = await repos.routes.getByName(input.routeName);
      routeId = route?.id;
    }
    const risk = routeId ? await repos.risks.getByRoute(routeId) : null;
    if (!risk) {
      return {
        routeId: routeId ?? "unknown",
        riskScore: 0,
        band: "low",
        disruptionIndicators: [],
        weatherIndicators: [],
        trend: "stable",
        found: false,
      };
    }
    return {
      routeId: risk.routeId,
      riskScore: risk.riskScore,
      band: band(risk.riskScore),
      disruptionIndicators: risk.disruptionIndicators,
      weatherIndicators: risk.weatherIndicators,
      trend: risk.trend,
      found: true,
    };
  },
};
