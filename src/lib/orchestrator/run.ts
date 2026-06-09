import type { Repositories } from "@/lib/repositories";
import type {
  AgentStep,
  AgentRun,
  Task,
  ToolCall,
  AuditLog,
  MemoryEntry,
  Route,
  Shipment,
} from "@/lib/domain/types";
import { parseRequest } from "@/lib/llm/parser";
import { executeTool } from "@/lib/tools/registry";
import {
  validate,
  buildRouteFeasibilityConstraints,
  buildThermalConstraints,
} from "@/lib/validation";
import type { ValidationOutcome } from "@/lib/validation/types";
import { buildRecommendation, findAlternativeRoute } from "./recommend";
import type { Recommendation, RunResult } from "./types";

const uid = (p: string) =>
  `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function step(
  kind: AgentStep["kind"],
  label: string,
  status: AgentStep["status"],
  detail?: string,
  durationMs?: number
): AgentStep {
  return { kind, label, status, detail, durationMs, startedAt: new Date().toISOString() };
}

export async function runTask(
  prompt: string,
  repos: Repositories,
  user = "C. Koskinen"
): Promise<RunResult> {
  const t0 = Date.now();
  const runId = uid("run");
  const taskId = uid("task");
  const steps: AgentStep[] = [];
  const audit: AuditLog[] = [];
  let validation: ValidationOutcome | null = null;
  let memoryHits: MemoryEntry[] = [];

  const pushAudit = async (
    event: string,
    action: string,
    outcome: AuditLog["outcome"]
  ) => {
    const log = await repos.auditLogs.create({
      id: uid("audit"),
      timestamp: new Date().toISOString(),
      event,
      action,
      outcome,
      user,
      taskId,
    });
    audit.push(log);
  };

  // ── 1. Parse (LLM intent extraction) ──────────────────────────────────────
  const parse = await parseRequest(prompt, repos);
  steps.push(
    step(
      "parsing",
      `Parsed intent: ${parse.parsed.intent}`,
      "complete",
      `${parse.source} · ${parse.parsed.explanation}`,
      parse.latencyMs
    )
  );
  await pushAudit("Request parsed", `Intent ${parse.parsed.intent} (${parse.source})`, "info");

  const coreStart = Date.now();
  const toolCalls: ToolCall[] = [];
  const ctx = { repos, runId };

  // Resolve primary entities up front.
  const intent = parse.parsed.intent;
  let recommendation: Recommendation;

  // ── Route feasibility (the core neuro-symbolic path) ──────────────────────
  if (
    intent === "route_feasibility" ||
    intent === "risk_assessment" ||
    (intent === "general_query" && parse.parsed.entities.shipmentName)
  ) {
    // Tool selection
    steps.push(
      step("tool_selection", "Selected: Shipment, Route, Risk services", "complete")
    );

    const shipName = parse.parsed.entities.shipmentName ?? "Voyage-402";
    const shipRes = await executeTool<any, any>(
      "shipment_service",
      { shipmentName: shipName },
      ctx
    );
    toolCalls.push(shipRes.call);

    const shipment: Shipment | null = await repos.shipments.getByName(shipName);

    // Candidate route: explicit route entity, else the shipment's assigned route.
    let route: Route | null = null;
    if (parse.parsed.entities.routeName) {
      route = await repos.routes.getByName(parse.parsed.entities.routeName);
    }
    if (!route && shipment) {
      route = await repos.routes.getById(shipment.assignedRouteId);
    }

    const routeRes = await executeTool<any, any>(
      "route_service",
      { routeId: route?.id, routeName: parse.parsed.entities.routeName },
      ctx
    );
    toolCalls.push(routeRes.call);

    const riskRes = await executeTool<any, any>(
      "risk_service",
      { routeId: route?.id },
      ctx
    );
    toolCalls.push(riskRes.call);

    steps.push(
      step("tool_execution", `Executed ${toolCalls.length} tool calls`, "complete")
    );

    if (shipment && route) {
      const risk = await repos.risks.getByRoute(route.id);

      // Memory retrieval
      const signals = [
        route.id,
        ...route.zones,
        shipment.cargoType,
        ...route.activeDisruptionIds.map(() => "infrastructure"),
      ];
      memoryHits = await repos.memory.retrieve(signals, 2);
      for (const m of memoryHits) await repos.memory.incrementReuse(m.id);
      steps.push(
        step(
          "memory",
          memoryHits.length
            ? `Retrieved ${memoryHits.length} relevant memory record(s)`
            : "No matching memory",
          "complete",
          memoryHits[0]?.title
        )
      );

      // Validation (z3)
      const constraints = buildRouteFeasibilityConstraints(shipment, route, risk);
      validation = await validate(constraints);
      steps.push(
        step(
          "validation",
          validation.feasible ? "Validation passed" : "Validation failed",
          validation.feasible ? "complete" : "error",
          `${validation.engine} · ${validation.proof}`,
          validation.evaluationMs
        )
      );
      await pushAudit(
        "Constraint validation",
        `${shipment.name} on ${route.name} — ${validation.feasible ? "feasible" : "infeasible"} (${validation.engine})`,
        validation.feasible ? "success" : "blocked"
      );

      const alternative = validation.feasible
        ? null
        : await findAlternativeRoute(shipment, route, repos);

      recommendation = buildRecommendation({
        shipment,
        route,
        validation,
        alternative,
        memoryHits,
      });
    } else {
      recommendation = {
        decision: "informational",
        headline: "Insufficient data to evaluate route feasibility",
        rationale: `Could not resolve ${!shipment ? "shipment" : "route"} from the request.`,
        actions: ["Refine the request with a known shipment and route"],
        alternative: null,
        needsApproval: false,
      };
    }
  } else if (intent === "thermal_compliance") {
    steps.push(step("tool_selection", "Selected: Shipment Service", "complete"));
    const shipRes = await executeTool<any, any>(
      "shipment_service",
      { cargoType: "temperature_sensitive" },
      ctx
    );
    toolCalls.push(shipRes.call);
    const allShipments = await repos.shipments.list();
    const tempShipments = allShipments.filter(
      (s) => s.thermal.maxTempC !== null && s.currentTempC !== null
    );
    steps.push(
      step("tool_execution", `Scanned ${tempShipments.length} temperature-controlled shipments`, "complete")
    );
    const constraints = tempShipments.flatMap((s) => buildThermalConstraints(s));
    validation = await validate(constraints);
    steps.push(
      step(
        "validation",
        validation.feasible ? "All shipments compliant" : `${validation.hardFailures} thermal breach(es)`,
        validation.feasible ? "complete" : "error",
        `${validation.engine} · ${validation.proof}`,
        validation.evaluationMs
      )
    );
    memoryHits = await repos.memory.retrieve(["thermal_breach", "temperature_sensitive"], 1);
    await pushAudit(
      "Thermal compliance scan",
      `${validation.hardFailures} breach(es) across ${tempShipments.length} shipments`,
      validation.feasible ? "success" : "blocked"
    );
    const breached = validation.constraints
      .filter((c) => c.result === "FAIL")
      .map((c) => c.label);
    recommendation = {
      decision: validation.feasible ? "informational" : "review_required",
      headline: validation.feasible
        ? "All temperature-controlled shipments within thermal limits"
        : `${validation.hardFailures} thermal constraint breach(es) detected`,
      rationale: validation.feasible
        ? validation.proof
        : `${validation.proof} ${memoryHits[0]?.recommendation ?? ""}`,
      actions: validation.feasible
        ? ["Continue monitoring reefer telemetry"]
        : ["Hold breached shipments at nearest cold hub", "Require quality sign-off before release", ...breached.map((b) => `Inspect: ${b}`)],
      alternative: null,
      needsApproval: !validation.feasible,
    };
  } else {
    // disruption_impact / customer_impact / shipment_lookup / general
    const disruptionName = parse.parsed.entities.disruptionName;
    const disruption = disruptionName
      ? (await repos.disruptions.list()).find((d) =>
          d.name.toLowerCase().includes(disruptionName.toLowerCase())
        )
      : (await repos.disruptions.listActive())[0];

    steps.push(step("tool_selection", "Selected: Customer Impact Service", "complete"));
    const impactRes = await executeTool<any, any>(
      "customer_impact_service",
      { disruptionId: disruption?.id },
      ctx
    );
    toolCalls.push(impactRes.call);
    steps.push(step("tool_execution", "Resolved customer impact", "complete"));

    memoryHits = disruption
      ? await repos.memory.retrieve([...disruption.affectedRouteIds, ...disruption.affectedZones, disruption.type], 2)
      : [];
    for (const m of memoryHits) await repos.memory.incrementReuse(m.id);
    if (memoryHits.length)
      steps.push(step("memory", `Retrieved ${memoryHits.length} memory record(s)`, "complete", memoryHits[0]?.title));

    const out = impactRes.output as {
      affectedCustomerCount: number;
      affectedShipmentCount: number;
      customers: { customer: string; serviceLevelImpact: string }[];
    };
    await pushAudit(
      "Impact analysis",
      `${disruption?.name ?? "Active disruptions"} — ${out.affectedCustomerCount} customers, ${out.affectedShipmentCount} shipments`,
      "info"
    );
    const atRisk = out.customers.filter((c) => c.serviceLevelImpact === "breach_likely");
    recommendation = {
      decision: "informational",
      headline: `${out.affectedCustomerCount} customer(s), ${out.affectedShipmentCount} shipment(s) impacted${disruption ? ` by ${disruption.name}` : ""}`,
      rationale: `${atRisk.length} customer(s) at likely SLA breach. ${memoryHits[0]?.recommendation ?? ""}`.trim(),
      actions: atRisk.length
        ? ["Proactively notify at-risk customers", "Stage buffer inventory", ...(memoryHits[0] ? [memoryHits[0].recommendation] : [])]
        : ["Continue monitoring"],
      alternative: null,
      needsApproval: false,
    };
  }

  steps.push(
    step("recommendation", recommendation.headline, "complete", recommendation.decision)
  );
  await pushAudit(
    "Recommendation issued",
    `${recommendation.decision} — ${recommendation.headline}`,
    recommendation.decision === "approved"
      ? "approved"
      : recommendation.needsApproval
        ? "info"
        : "info"
  );

  const deterministicCoreMs = Date.now() - coreStart;
  const totalMs = Date.now() - t0;
  const toolsMs = toolCalls.reduce((a, c) => a + c.latencyMs, 0);

  const task: Task = {
    id: taskId,
    prompt,
    status: recommendation.needsApproval ? "needs_approval" : "completed",
    createdAt: new Date(t0).toISOString(),
    createdBy: user,
    agentRunId: runId,
    summary: recommendation.headline,
  };
  await repos.tasks.create(task);

  const run: AgentRun = {
    id: runId,
    taskId,
    status: "completed",
    steps,
    startedAt: new Date(t0).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: totalMs,
  };
  await repos.agentRuns.create(run);

  return {
    task,
    run,
    parse,
    steps,
    toolCalls,
    validation,
    memoryHits,
    recommendation,
    audit,
    timings: {
      parseMs: parse.latencyMs,
      toolsMs,
      validationMs: validation?.evaluationMs ?? 0,
      deterministicCoreMs,
      totalMs,
    },
  };
}
