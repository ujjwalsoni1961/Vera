import type {
  AuditEntry,
  Decision,
  Entity,
  GraphEdge,
  Rule,
} from "./types";

// ────────────────────────────────────────────────────────────────────────────
// Seed data — NordRetail Logistics, EU-Central workspace.
// Full Rotterdam port-strike scenario plus supporting rules and entities.
// ────────────────────────────────────────────────────────────────────────────

export const seedRules: Rule[] = [
  {
    id: "R1",
    naturalLanguage:
      "Refrigerated cargo must be kept at or below 8 degrees Celsius for the entire transit.",
    structured:
      "rule R1: shipment.cargo_class = refrigerated\n  -> shipment.max_recorded_temp_c <= 8",
    scope: "Cold chain",
    updatedAt: "2026-05-28T09:14:00Z",
  },
  {
    id: "R2",
    naturalLanguage:
      "Shipments with declared value above 250,000 euros must be carried by a Tier-1 insured carrier.",
    structured:
      "rule R2: shipment.declared_value_eur > 250000\n  -> shipment.carrier.insurance_tier = 1",
    scope: "Carrier compliance",
    updatedAt: "2026-05-30T13:02:00Z",
  },
  {
    id: "R3",
    naturalLanguage:
      "Customer deliveries must arrive within 48 hours of scheduled dispatch.",
    structured: "rule R3: shipment.eta_hours_from_dispatch <= 48",
    scope: "Service level",
    updatedAt: "2026-06-02T08:41:00Z",
  },
  {
    id: "R4",
    naturalLanguage:
      "Priority customers must be notified when a delivery ETA changes by more than 6 hours.",
    structured:
      "rule R4: shipment.customer.priority = true\n  and abs(shipment.eta_delta_hours) > 6\n  -> require notify(shipment.customer)",
    scope: "Customer communication",
    updatedAt: "2026-06-03T15:27:00Z",
  },
  {
    id: "R5",
    naturalLanguage:
      "Driver duty time must comply with EU Regulation 561/2006 daily driving and rest limits.",
    structured:
      "rule R5: driver.daily_drive_hours <= 9\n  and driver.fortnight_drive_hours <= 90",
    scope: "Workforce compliance",
    updatedAt: "2026-05-21T10:55:00Z",
  },
  {
    id: "R6",
    naturalLanguage:
      "Route changes with incremental cost above 5,000 euros require operations-manager approval.",
    structured:
      "rule R6: reroute(shipment, route)\n  and route.cost_delta_eur > 5000\n  -> require approval(ops_manager)",
    scope: "Cost control",
    updatedAt: "2026-06-01T11:19:00Z",
  },
  {
    id: "R7",
    naturalLanguage:
      "Hazardous goods must not be routed through residential zones.",
    structured:
      "rule R7: shipment.cargo_class = hazardous\n  -> not exists z in shipment.route.zones :\n       z.classification = residential",
    scope: "Hazmat routing",
    updatedAt: "2026-06-04T16:08:00Z",
  },
];

export const seedEntities: Entity[] = [
  {
    id: "Port-Rotterdam",
    type: "port",
    attrs: {
      name: "Port of Rotterdam",
      country: "Netherlands",
      status: "Strike — closed until Thursday 06:00",
      affected_shipments: 6,
    },
  },
  {
    id: "Shipment-398",
    type: "shipment",
    attrs: {
      cargo: "General — consumer electronics",
      origin: "Helsinki, FI",
      destination: "Lyon, FR",
      declared_value_eur: 184000,
      eta_hours_from_dispatch: 39,
      carrier: "NordHaul Oy",
      customer: "DanFresh A/S",
    },
  },
  {
    id: "Shipment-402",
    type: "shipment",
    attrs: {
      cargo: "Hazardous — Class 3 flammable liquids (UN 1263)",
      origin: "Kotka, FI",
      destination: "Brussels, BE",
      declared_value_eur: 312000,
      eta_hours_from_dispatch: 36,
      carrier: "Meridian Freight",
      customer: "TechNord Oy",
      hazmat: true,
    },
  },
  {
    id: "Shipment-405",
    type: "shipment",
    attrs: {
      cargo: "Refrigerated — fresh dairy",
      origin: "Turku, FI",
      destination: "Antwerp, BE",
      declared_value_eur: 96000,
      eta_hours_from_dispatch: 41,
      max_recorded_temp_c: 6.4,
      carrier: "NordHaul Oy",
      customer: "DanFresh A/S",
    },
  },
  {
    id: "Shipment-407",
    type: "shipment",
    attrs: {
      cargo: "General — industrial fasteners",
      origin: "Tallinn, EE",
      destination: "Rotterdam, NL",
      declared_value_eur: 58000,
      eta_hours_from_dispatch: 30,
      carrier: "Meridian Freight",
      customer: "KymiChem Oy",
    },
  },
  {
    id: "Shipment-411",
    type: "shipment",
    attrs: {
      cargo: "General — packaging film",
      origin: "Gdansk, PL",
      destination: "Rotterdam, NL",
      declared_value_eur: 41000,
      eta_hours_from_dispatch: 22,
      carrier: "NordHaul Oy",
      customer: "KymiChem Oy",
    },
  },
  {
    id: "Shipment-413",
    type: "shipment",
    attrs: {
      cargo: "Refrigerated — pharmaceuticals",
      origin: "Stockholm, SE",
      destination: "Utrecht, NL",
      declared_value_eur: 277000,
      eta_hours_from_dispatch: 44,
      max_recorded_temp_c: 5.1,
      carrier: "Meridian Freight",
      customer: "TechNord Oy",
    },
  },
  {
    id: "Route-Alpha",
    type: "route",
    attrs: {
      name: "Route Alpha — Rotterdam corridor",
      eta_hours: 36,
      status: "Blocked — port strike",
      zones: "Rotterdam port, Rotterdam South residential",
    },
  },
  {
    id: "Route-B",
    type: "route",
    attrs: {
      name: "Route B — Antwerp corridor",
      eta_hours: 41,
      status: "Open",
      cost_delta_eur: 3400,
      zones: "Antwerp port, industrial transit zones only",
    },
  },
  {
    id: "Route-C",
    type: "route",
    attrs: {
      name: "Route C — Hamburg corridor",
      eta_hours: 52,
      status: "Open",
      cost_delta_eur: 4100,
      zones: "Hamburg port, industrial transit zones only",
    },
  },
  {
    id: "Zone-Residential-South",
    type: "zone",
    attrs: {
      name: "Rotterdam South residential zone",
      classification: "residential",
      restriction: "No hazardous-goods transit (R7)",
    },
  },
  {
    id: "Carrier-Meridian",
    type: "carrier",
    attrs: {
      name: "Meridian Freight",
      insurance_tier: 1,
      fleet: "62 vehicles, ADR-certified",
    },
  },
  {
    id: "Carrier-NordHaul",
    type: "carrier",
    attrs: {
      name: "NordHaul Oy",
      insurance_tier: 2,
      fleet: "38 vehicles, 12 reefer units",
    },
  },
  {
    id: "Customer-TechNord",
    type: "customer",
    attrs: {
      name: "TechNord Oy",
      priority: true,
      contact: "ops@technord.fi",
    },
  },
  {
    id: "Customer-KymiChem",
    type: "customer",
    attrs: {
      name: "KymiChem Oy",
      priority: false,
      contact: "logistics@kymichem.fi",
    },
  },
  {
    id: "Customer-DanFresh",
    type: "customer",
    attrs: {
      name: "DanFresh A/S",
      priority: true,
      contact: "supply@danfresh.dk",
    },
  },
];

export const seedEdges: GraphEdge[] = [
  { source: "Shipment-398", target: "Port-Rotterdam", relation: "routes_through" },
  { source: "Shipment-402", target: "Port-Rotterdam", relation: "routes_through" },
  { source: "Shipment-405", target: "Port-Rotterdam", relation: "routes_through" },
  { source: "Shipment-407", target: "Port-Rotterdam", relation: "routes_through" },
  { source: "Shipment-411", target: "Port-Rotterdam", relation: "routes_through" },
  { source: "Shipment-413", target: "Port-Rotterdam", relation: "routes_through" },
  { source: "Shipment-402", target: "Route-Alpha", relation: "assigned_to" },
  { source: "Shipment-398", target: "Route-Alpha", relation: "assigned_to" },
  { source: "Route-B", target: "Route-Alpha", relation: "alternative_of" },
  { source: "Route-C", target: "Route-Alpha", relation: "alternative_of" },
  { source: "Route-Alpha", target: "Zone-Residential-South", relation: "passes_through" },
  { source: "Zone-Residential-South", target: "R7", relation: "restricted_by" },
  { source: "Shipment-402", target: "R7", relation: "constrained_by" },
  { source: "Shipment-402", target: "R3", relation: "constrained_by" },
  { source: "Shipment-405", target: "R1", relation: "constrained_by" },
  { source: "Shipment-413", target: "R1", relation: "constrained_by" },
  { source: "Shipment-413", target: "R2", relation: "constrained_by" },
  { source: "Shipment-402", target: "Carrier-Meridian", relation: "carried_by" },
  { source: "Shipment-407", target: "Carrier-Meridian", relation: "carried_by" },
  { source: "Shipment-413", target: "Carrier-Meridian", relation: "carried_by" },
  { source: "Shipment-398", target: "Carrier-NordHaul", relation: "carried_by" },
  { source: "Shipment-405", target: "Carrier-NordHaul", relation: "carried_by" },
  { source: "Shipment-411", target: "Carrier-NordHaul", relation: "carried_by" },
  { source: "Shipment-402", target: "Customer-TechNord", relation: "for_customer" },
  { source: "Shipment-413", target: "Customer-TechNord", relation: "for_customer" },
  { source: "Shipment-407", target: "Customer-KymiChem", relation: "for_customer" },
  { source: "Shipment-411", target: "Customer-KymiChem", relation: "for_customer" },
  { source: "Shipment-398", target: "Customer-DanFresh", relation: "for_customer" },
  { source: "Shipment-405", target: "Customer-DanFresh", relation: "for_customer" },
];

// ────────────────────────────────────────────────────────────────────────────
// Scripted scenarios for mock mode. The flagship Rotterdam scenario follows
// the exact reasoning steps from the build spec.
// ────────────────────────────────────────────────────────────────────────────

export interface Scenario {
  /** Lowercase keywords; a task matches if it contains any of them. */
  match: string[];
  decision: Decision;
}

export const scenarios: Scenario[] = [
  {
    match: ["rotterdam", "strike", "port disruption", "port of rotterdam"],
    decision: {
      summary:
        "Six active shipments route through Rotterdam before Thursday. Shipment 402 carries hazardous goods and cannot wait out the strike within its delivery window; Route B satisfies both applicable constraints. The remaining five shipments stay within their windows if held until the port reopens.",
      action:
        "Reroute Shipment 402 to Route B and notify TechNord Oy of the revised ETA. Hold the remaining five Rotterdam shipments until the strike ends Thursday.",
      references: [
        { id: "R7", type: "rule" },
        { id: "R3", type: "rule" },
        { id: "R4", type: "rule" },
      ],
      status: "recommended",
      steps: [
        {
          text: "Identified 6 active shipments routed through Rotterdam with ETAs before Thursday.",
          references: [{ id: "Port-Rotterdam", type: "port" }],
        },
        {
          text: "Shipment 402 carries hazardous goods. Applicable constraints: R7 (hazmat routing), R3 (48-hour window).",
          references: [
            { id: "Shipment-402", type: "shipment" },
            { id: "R7", type: "rule" },
            { id: "R3", type: "rule" },
          ],
        },
        {
          text: "Route B clears the residential-zone restriction; ETA 41h, within window.",
          references: [
            { id: "Route-B", type: "route" },
            { id: "R7", type: "rule" },
          ],
        },
        {
          text: "Route C exceeds the 48-hour window (ETA 52h); not feasible.",
          references: [
            { id: "Route-C", type: "route" },
            { id: "R3", type: "rule" },
          ],
        },
        {
          text: "Selected Route B for Shipment 402.",
          references: [
            { id: "Shipment-402", type: "shipment" },
            { id: "Route-B", type: "route" },
          ],
        },
        {
          text: "TechNord Oy is a priority customer and the ETA change exceeds 6 hours; notification is required.",
          references: [
            { id: "Customer-TechNord", type: "customer" },
            { id: "R4", type: "rule" },
          ],
        },
        {
          text: "The five remaining shipments carry general or refrigerated cargo and stay within their 48-hour windows if released when the port reopens Thursday.",
          references: [{ id: "R3", type: "rule" }],
        },
      ],
    },
  },
  {
    match: ["thermal", "temperature", "reefer", "cold chain"],
    decision: {
      summary:
        "Two refrigerated shipments are in transit today. Both currently satisfy the 8-degree limit; Shipment 405 is trending upward and has the least margin.",
      action:
        "No violations today. Flag Shipment 405 for reefer inspection at the next stop; its recorded maximum of 6.4 degrees has risen 1.1 degrees since departure.",
      references: [{ id: "R1", type: "rule" }],
      status: "informational",
      steps: [
        {
          text: "Two active shipments carry refrigerated cargo: Shipment 405 (fresh dairy) and Shipment 413 (pharmaceuticals).",
          references: [
            { id: "Shipment-405", type: "shipment" },
            { id: "Shipment-413", type: "shipment" },
          ],
        },
        {
          text: "Applicable constraint: R1 requires a maximum transit temperature of 8 degrees.",
          references: [{ id: "R1", type: "rule" }],
        },
        {
          text: "Shipment 413 reads 5.1 degrees maximum; within limit.",
          references: [{ id: "Shipment-413", type: "shipment" }],
        },
        {
          text: "Shipment 405 reads 6.4 degrees maximum; within limit, but up 1.1 degrees since departure on a 14-hour remaining leg.",
          references: [{ id: "Shipment-405", type: "shipment" }],
        },
        {
          text: "No rule violations today. Shipment 405 has the smallest margin and warrants inspection at the next scheduled stop.",
          references: [
            { id: "Shipment-405", type: "shipment" },
            { id: "R1", type: "rule" },
          ],
        },
      ],
    },
  },
  {
    match: ["402", "voyage-402", "feasib"],
    decision: {
      summary:
        "Shipment 402 cannot proceed on Route Alpha while the Rotterdam strike holds. Of the two alternatives, only Route B satisfies both the hazmat-routing and delivery-window constraints.",
      action:
        "Proceed with Shipment 402 on Route B. ETA 41 hours, within the 48-hour window; no residential zones on the corridor.",
      references: [
        { id: "R7", type: "rule" },
        { id: "R3", type: "rule" },
        { id: "R6", type: "rule" },
      ],
      status: "recommended",
      steps: [
        {
          text: "Shipment 402 carries Class 3 flammable liquids from Kotka to Brussels, currently assigned to Route Alpha.",
          references: [
            { id: "Shipment-402", type: "shipment" },
            { id: "Route-Alpha", type: "route" },
          ],
        },
        {
          text: "Route Alpha is blocked by the Rotterdam port strike and passes the Rotterdam South residential zone.",
          references: [
            { id: "Route-Alpha", type: "route" },
            { id: "Zone-Residential-South", type: "zone" },
          ],
        },
        {
          text: "Applicable constraints: R7 (hazmat routing), R3 (48-hour window).",
          references: [
            { id: "R7", type: "rule" },
            { id: "R3", type: "rule" },
          ],
        },
        {
          text: "Route B clears the residential-zone restriction; ETA 41h, within window.",
          references: [
            { id: "Route-B", type: "route" },
            { id: "R7", type: "rule" },
          ],
        },
        {
          text: "Route C exceeds the 48-hour window (ETA 52h); not feasible.",
          references: [
            { id: "Route-C", type: "route" },
            { id: "R3", type: "rule" },
          ],
        },
        {
          text: "Incremental cost of Route B is 3,400 euros; below the 5,000-euro approval threshold.",
          references: [
            { id: "Route-B", type: "route" },
            { id: "R6", type: "rule" },
          ],
        },
      ],
    },
  },
  {
    match: ["route alpha", "alpha"],
    decision: {
      summary:
        "Two shipments are assigned to Route Alpha. Their failure would affect three customers, two of which hold priority status and require proactive notification on ETA changes above six hours.",
      action:
        "If Route Alpha becomes unavailable, notify TechNord Oy and DanFresh A/S immediately and stage Route B capacity for Shipments 398 and 402.",
      references: [
        { id: "R4", type: "rule" },
        { id: "R3", type: "rule" },
      ],
      status: "informational",
      steps: [
        {
          text: "Route Alpha currently carries Shipment 398 (DanFresh A/S) and Shipment 402 (TechNord Oy).",
          references: [
            { id: "Route-Alpha", type: "route" },
            { id: "Shipment-398", type: "shipment" },
            { id: "Shipment-402", type: "shipment" },
          ],
        },
        {
          text: "Downstream, KymiChem Oy receives consolidated freight that connects through Route Alpha arrivals.",
          references: [{ id: "Customer-KymiChem", type: "customer" }],
        },
        {
          text: "TechNord Oy and DanFresh A/S are priority customers; R4 requires notification for ETA changes above 6 hours.",
          references: [
            { id: "Customer-TechNord", type: "customer" },
            { id: "Customer-DanFresh", type: "customer" },
            { id: "R4", type: "rule" },
          ],
        },
        {
          text: "Rerouting both shipments to Route B keeps each within its 48-hour window (R3).",
          references: [
            { id: "Route-B", type: "route" },
            { id: "R3", type: "rule" },
          ],
        },
      ],
    },
  },
];

export const fallbackDecision: Decision = {
  summary:
    "The task did not match an active operational scenario. Current state: six shipments in transit, one open disruption (Rotterdam port strike), no rule violations recorded today.",
  action:
    "No action required. Rephrase the task with a shipment, route, or customer reference for a constraint-checked recommendation.",
  references: [{ id: "Port-Rotterdam", type: "port" }],
  status: "informational",
  steps: [
    {
      text: "Parsed the task and queried current operational state: 6 active shipments, 3 routes, 1 open disruption.",
      references: [{ id: "Port-Rotterdam", type: "port" }],
    },
    {
      text: "No applicable constraints are violated by the current plan; no entities in the task matched a tracked shipment, route, or customer.",
      references: [],
    },
  ],
};

export const seedAuditEntries: AuditEntry[] = [
  {
    id: "AUD-1042",
    ts: "2026-06-10T06:48:00Z",
    task: "Port of Rotterdam is on strike until Thursday — handle today's affected shipments.",
    decision: { ...scenarios[0].decision, status: "executed" },
  },
  {
    id: "AUD-1041",
    ts: "2026-06-09T15:12:00Z",
    task: "Which deliveries violate thermal constraints today?",
    decision: { ...scenarios[1].decision, status: "informational" },
  },
  {
    id: "AUD-1040",
    ts: "2026-06-09T09:31:00Z",
    task: "Can Shipment 413 switch to NordHaul Oy for the final leg?",
    decision: {
      summary:
        "Shipment 413 has a declared value of 277,000 euros; R2 requires a Tier-1 insured carrier. NordHaul Oy holds Tier-2 insurance.",
      action:
        "Keep Shipment 413 with Meridian Freight. NordHaul Oy does not satisfy the insurance requirement for this declared value.",
      references: [{ id: "R2", type: "rule" }],
      status: "executed",
      steps: [
        {
          text: "Shipment 413 declared value is 277,000 euros, above the 250,000-euro threshold in R2.",
          references: [
            { id: "Shipment-413", type: "shipment" },
            { id: "R2", type: "rule" },
          ],
        },
        {
          text: "NordHaul Oy holds Tier-2 insurance; the carrier swap violates R2.",
          references: [
            { id: "Carrier-NordHaul", type: "carrier" },
            { id: "R2", type: "rule" },
          ],
        },
        {
          text: "Meridian Freight holds Tier-1 insurance and remains the only compliant assignment.",
          references: [{ id: "Carrier-Meridian", type: "carrier" }],
        },
      ],
    },
  },
  {
    id: "AUD-1039",
    ts: "2026-06-08T14:20:00Z",
    task: "Driver duty-time check for the Antwerp corridor rotation.",
    decision: {
      summary:
        "One driver on the Antwerp rotation would exceed the 9-hour daily driving limit if assigned the evening return leg.",
      action:
        "Reassign the evening return leg to the relief driver; all assignments then satisfy EU 561/2006 limits.",
      references: [{ id: "R5", type: "rule" }],
      status: "executed",
      steps: [
        {
          text: "Checked 8 driver assignments on the Antwerp corridor rotation against R5.",
          references: [{ id: "R5", type: "rule" }],
        },
        {
          text: "One assignment reaches 10.5 driving hours with the evening return leg; above the 9-hour daily limit.",
          references: [{ id: "R5", type: "rule" }],
        },
        {
          text: "Relief driver has 4.2 hours accumulated today; reassignment satisfies all limits.",
          references: [{ id: "R5", type: "rule" }],
        },
      ],
    },
  },
  {
    id: "AUD-1038",
    ts: "2026-06-08T08:02:00Z",
    task: "Notify affected customers of the weekend terminal maintenance in Antwerp.",
    decision: {
      summary:
        "Terminal maintenance shifts two ETAs by more than six hours; both affected customers hold priority status.",
      action:
        "Send ETA-change notifications to TechNord Oy and DanFresh A/S for the two affected deliveries.",
      references: [{ id: "R4", type: "rule" }],
      status: "executed",
      steps: [
        {
          text: "Maintenance window shifts ETAs for two deliveries by 7 and 9 hours respectively.",
          references: [{ id: "R4", type: "rule" }],
        },
        {
          text: "Both customers are flagged priority; R4 requires notification above the 6-hour threshold.",
          references: [
            { id: "Customer-TechNord", type: "customer" },
            { id: "Customer-DanFresh", type: "customer" },
            { id: "R4", type: "rule" },
          ],
        },
      ],
    },
  },
  {
    id: "AUD-1037",
    ts: "2026-06-07T11:45:00Z",
    task: "Weekly feasibility sweep — all active lanes.",
    decision: {
      summary:
        "All 14 planned lane assignments for the coming week satisfy the active rulebook; no exceptions raised.",
      action: "No action required. Next sweep scheduled Monday 06:00.",
      references: [
        { id: "R1", type: "rule" },
        { id: "R3", type: "rule" },
        { id: "R7", type: "rule" },
      ],
      status: "informational",
      steps: [
        {
          text: "Evaluated 14 lane assignments against 7 active rules; 98 constraint checks in total.",
          references: [],
        },
        {
          text: "All checks satisfied. Tightest margin: Shipment 413 delivery window at 44 of 48 hours.",
          references: [
            { id: "Shipment-413", type: "shipment" },
            { id: "R3", type: "rule" },
          ],
        },
      ],
    },
  },
];
