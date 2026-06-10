// ────────────────────────────────────────────────────────────────────────────
// Workspace dataset: Takapulpetti Oy — building-systems field service.
// Heat pumps, gas boilers, ventilation and refrigeration across Uusimaa and
// Pirkanmaa. One dataset feeds the agent, memory graph, audit and live engine.
// Timestamps are generated relative to load time so the workspace looks live.
// ────────────────────────────────────────────────────────────────────────────

import type {
  AuditEntry,
  Decision,
  Entity,
  GraphEdge,
  Rule,
} from "./types";

function daysAgo(d: number, h = 10, m = 15): string {
  const x = new Date(Date.now() - d * 86400e3);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600e3).toISOString();
}

// ── Rules ────────────────────────────────────────────────────────────────────

export const seedRules: Rule[] = [
  {
    id: "R1",
    naturalLanguage:
      "Priority-1 faults at Gold SLA sites must have a technician on site within 4 hours of the alarm.",
    structured:
      "rule R1: job.priority = P1 and job.site.customer.sla = gold\n  -> job.response_hours <= 4",
    scope: "Service level",
    updatedAt: daysAgo(64),
  },
  {
    id: "R2",
    naturalLanguage:
      "Work on gas-fired equipment requires a technician holding a valid Tukes gas permit.",
    structured:
      "rule R2: job.equipment.fuel = gas\n  -> job.technician.certs includes tukes_gas",
    scope: "Certifications",
    updatedAt: daysAgo(64),
  },
  {
    id: "R3",
    naturalLanguage:
      "Refrigerant handling requires F-gas certification under EU regulation 517/2014.",
    structured:
      "rule R3: job.tasks includes refrigerant_handling\n  -> job.technician.certs includes f_gas",
    scope: "Certifications",
    updatedAt: daysAgo(58),
  },
  {
    id: "R4",
    naturalLanguage:
      "A technician's working day, including travel, must not exceed 10 hours.",
    structured:
      "rule R4: forall t in technicians :\n  sum(t.jobs.duration) + sum(t.drive_time) <= 10h",
    scope: "Workforce compliance",
    updatedAt: daysAgo(51),
  },
  {
    id: "R5",
    naturalLanguage:
      "Parts required by a job must be on the assigned van before dispatch; otherwise the route must pass the nearest depot.",
    structured:
      "rule R5: job.required_parts subset job.van.stock\n  or job.route includes nearest_depot",
    scope: "Parts & inventory",
    updatedAt: daysAgo(40),
  },
  {
    id: "R6",
    naturalLanguage:
      "Gold SLA emergencies preempt scheduled maintenance; displaced maintenance is rebooked within 5 business days.",
    structured:
      "rule R6: emergency.sla = gold and conflict(emergency, maintenance)\n  -> preempt(maintenance) and rebook_days <= 5",
    scope: "Service level",
    updatedAt: daysAgo(33),
  },
  {
    id: "R7",
    naturalLanguage:
      "Live electrical work requires S2 certification and a second person on site.",
    structured:
      "rule R7: job.tasks includes live_electrical\n  -> job.technician.certs includes s2 and job.crew_size >= 2",
    scope: "Safety",
    updatedAt: daysAgo(26),
  },
  {
    id: "R8",
    naturalLanguage:
      "Residential visits require a time window confirmed with the resident before dispatch.",
    structured:
      "rule R8: job.site.kind = residential\n  -> job.window.confirmed = true",
    scope: "Customer communication",
    updatedAt: daysAgo(12),
  },
];

// ── Entities ─────────────────────────────────────────────────────────────────

export const seedEntities: Entity[] = [
  // Regions
  {
    id: "Uusimaa",
    type: "region",
    attrs: { coverage: "Helsinki, Espoo, Vantaa", depots: 2, technicians: 6 },
  },
  {
    id: "Pirkanmaa",
    type: "region",
    attrs: { coverage: "Tampere", depots: 1, technicians: 2 },
  },

  // Depots
  {
    id: "Konala depot",
    type: "depot",
    attrs: {
      address: "Ruosilantie 14, 00390 Helsinki",
      region: "Uusimaa",
      parts_lines: 412,
    },
    lat: 60.238,
    lng: 24.841,
  },
  {
    id: "Olari depot",
    type: "depot",
    attrs: {
      address: "Komentajankatu 5, 02600 Espoo",
      region: "Uusimaa",
      parts_lines: 268,
    },
    lat: 60.176,
    lng: 24.737,
  },
  {
    id: "Nekala depot",
    type: "depot",
    attrs: {
      address: "Kuoppamäentie 11, 33800 Tampere",
      region: "Pirkanmaa",
      parts_lines: 195,
    },
    lat: 61.485,
    lng: 23.789,
  },

  // SLA tiers
  {
    id: "Gold SLA",
    type: "sla",
    attrs: {
      emergency_response: "4 h",
      maintenance_visits: "4 / year",
      hours: "24/7",
    },
  },
  {
    id: "Silver SLA",
    type: "sla",
    attrs: {
      emergency_response: "next business day",
      maintenance_visits: "2 / year",
      hours: "Mon–Fri 7–17",
    },
  },

  // Technicians
  {
    id: "Mikko Virtanen",
    type: "technician",
    attrs: {
      depot: "Konala depot",
      certifications: "Tukes gas, F-gas",
      van: "ZKT-435",
      status: "sick leave (today)",
    },
    lat: 60.238,
    lng: 24.841,
  },
  {
    id: "Anna Mäkelä",
    type: "technician",
    attrs: {
      depot: "Konala depot",
      certifications: "S2 electrical, F-gas",
      van: "BNF-218",
      status: "on site — Pasila",
    },
    lat: 60.199,
    lng: 24.934,
  },
  {
    id: "Sami Nieminen",
    type: "technician",
    attrs: {
      depot: "Olari depot",
      certifications: "Tukes gas, S2 electrical",
      van: "JLR-704",
      status: "on site — Tapiola",
    },
    lat: 60.176,
    lng: 24.805,
  },
  {
    id: "Laura Heikkinen",
    type: "technician",
    attrs: {
      depot: "Olari depot",
      certifications: "F-gas, heat pump specialist",
      van: "CPX-561",
      status: "en route — Matinkylä",
    },
    lat: 60.16,
    lng: 24.738,
  },
  {
    id: "Jari Korhonen",
    type: "technician",
    attrs: {
      depot: "Konala depot",
      certifications: "Tukes gas",
      van: "ENM-329",
      status: "on site — Myyrmäki",
    },
    lat: 60.261,
    lng: 24.854,
  },
  {
    id: "Emilia Koskinen",
    type: "technician",
    attrs: {
      depot: "Konala depot",
      certifications: "S2 electrical",
      van: "shared (BNF-218)",
      status: "scheduled from 12:00",
    },
    lat: 60.238,
    lng: 24.841,
  },
  {
    id: "Petri Laine",
    type: "technician",
    attrs: {
      depot: "Nekala depot",
      certifications: "Tukes gas, F-gas",
      van: "VHT-186",
      status: "on site — Hervanta",
    },
    lat: 61.45,
    lng: 23.85,
  },
  {
    id: "Juho Salmi",
    type: "technician",
    attrs: {
      depot: "Nekala depot",
      certifications: "S2 electrical, F-gas",
      van: "shared (VHT-186)",
      status: "on site — Kaleva",
    },
    lat: 61.5,
    lng: 23.81,
  },

  // Vans
  {
    id: "ZKT-435",
    type: "vehicle",
    attrs: {
      model: "VW Crafter (2023)",
      depot: "Konala depot",
      assigned_to: "Mikko Virtanen",
      stock_lines: 86,
    },
    lat: 60.238,
    lng: 24.841,
  },
  {
    id: "BNF-218",
    type: "vehicle",
    attrs: {
      model: "Ford Transit (2022)",
      depot: "Konala depot",
      assigned_to: "Anna Mäkelä",
      stock_lines: 74,
    },
    lat: 60.199,
    lng: 24.934,
  },
  {
    id: "JLR-704",
    type: "vehicle",
    attrs: {
      model: "VW Crafter (2024)",
      depot: "Olari depot",
      assigned_to: "Sami Nieminen",
      stock_lines: 91,
    },
    lat: 60.176,
    lng: 24.805,
  },
  {
    id: "CPX-561",
    type: "vehicle",
    attrs: {
      model: "Mercedes Vito (2021)",
      depot: "Olari depot",
      assigned_to: "Laura Heikkinen",
      stock_lines: 63,
    },
    lat: 60.16,
    lng: 24.738,
  },
  {
    id: "ENM-329",
    type: "vehicle",
    attrs: {
      model: "Ford Transit (2023)",
      depot: "Konala depot",
      assigned_to: "Jari Korhonen",
      stock_lines: 70,
    },
    lat: 60.261,
    lng: 24.854,
  },
  {
    id: "VHT-186",
    type: "vehicle",
    attrs: {
      model: "VW Crafter (2022)",
      depot: "Nekala depot",
      assigned_to: "Petri Laine",
      stock_lines: 82,
    },
    lat: 61.45,
    lng: 23.85,
  },

  // Customers
  {
    id: "Hotelli Norppa",
    type: "customer",
    attrs: {
      kind: "hotel",
      sla: "Gold SLA",
      sites: 1,
      contract_since: 2021,
    },
  },
  {
    id: "Kiinteistö Oy Pasilan Visio",
    type: "customer",
    attrs: {
      kind: "office property",
      sla: "Gold SLA",
      sites: 2,
      contract_since: 2022,
    },
  },
  {
    id: "Asunto Oy Helsingin Tuulensuu",
    type: "customer",
    attrs: {
      kind: "housing co-op",
      sla: "Silver SLA",
      sites: 1,
      contract_since: 2020,
    },
  },
  {
    id: "Ravintola Kaarna",
    type: "customer",
    attrs: {
      kind: "restaurant",
      sla: "Silver SLA",
      sites: 1,
      contract_since: 2023,
    },
  },
  {
    id: "Päiväkoti Vekkuli",
    type: "customer",
    attrs: {
      kind: "daycare",
      sla: "Gold SLA",
      sites: 1,
      contract_since: 2024,
    },
  },
  {
    id: "Asunto Oy Leppävaaran Helmi",
    type: "customer",
    attrs: {
      kind: "housing co-op",
      sla: "Silver SLA",
      sites: 1,
      contract_since: 2022,
    },
  },
  {
    id: "FysioMove",
    type: "customer",
    attrs: {
      kind: "gym & physio",
      sla: "Silver SLA",
      sites: 1,
      contract_since: 2025,
    },
  },
  {
    id: "Kiinteistö Oy Hervannan Torni",
    type: "customer",
    attrs: {
      kind: "office property",
      sla: "Gold SLA",
      sites: 1,
      contract_since: 2023,
    },
  },
  {
    id: "Liikekeskus Aviapolis",
    type: "customer",
    attrs: {
      kind: "retail centre",
      sla: "Silver SLA",
      sites: 1,
      contract_since: 2024,
    },
  },

  // Sites
  {
    id: "Fredrikinkatu 22",
    type: "site",
    attrs: {
      customer: "Hotelli Norppa",
      district: "Kamppi, Helsinki",
      equipment: "gas boiler, AHU ×3",
      access: "24/7 reception",
    },
    lat: 60.165,
    lng: 24.937,
  },
  {
    id: "Pasilankatu 8",
    type: "site",
    attrs: {
      customer: "Kiinteistö Oy Pasilan Visio",
      district: "Pasila, Helsinki",
      equipment: "heat pump ×2, AHU ×6",
      access: "key safe + service contact",
    },
    lat: 60.199,
    lng: 24.934,
  },
  {
    id: "Pohjolankatu 12",
    type: "site",
    attrs: {
      customer: "Asunto Oy Helsingin Tuulensuu",
      district: "Käpylä, Helsinki",
      equipment: "ground-source heat pump",
      access: "residential — confirmed window required",
    },
    lat: 60.214,
    lng: 24.946,
  },
  {
    id: "Vattuniemenkatu 5",
    type: "site",
    attrs: {
      customer: "Ravintola Kaarna",
      district: "Lauttasaari, Helsinki",
      equipment: "walk-in cooler, kitchen ventilation",
      access: "staff entrance before 22:00",
    },
    lat: 60.158,
    lng: 24.87,
  },
  {
    id: "Unikkotie 3",
    type: "site",
    attrs: {
      customer: "Päiväkoti Vekkuli",
      district: "Tikkurila, Vantaa",
      equipment: "exhaust-air heat pump, AHU",
      access: "weekdays 6:30–17:30",
    },
    lat: 60.292,
    lng: 25.044,
  },
  {
    id: "Läkkisepänkuja 4",
    type: "site",
    attrs: {
      customer: "Asunto Oy Leppävaaran Helmi",
      district: "Leppävaara, Espoo",
      equipment: "district heating substation",
      access: "residential — confirmed window required",
    },
    lat: 60.219,
    lng: 24.813,
  },
  {
    id: "Suomenlahdentie 9",
    type: "site",
    attrs: {
      customer: "FysioMove",
      district: "Matinkylä, Espoo",
      equipment: "air-source heat pump ×2, AHU",
      access: "Mon–Sat 7–21",
    },
    lat: 60.16,
    lng: 24.738,
  },
  {
    id: "Insinöörinkatu 30",
    type: "site",
    attrs: {
      customer: "Kiinteistö Oy Hervannan Torni",
      district: "Hervanta, Tampere",
      equipment: "heat pump ×4, AHU ×8",
      access: "key safe + service contact",
    },
    lat: 61.45,
    lng: 23.85,
  },
  {
    id: "Karhumäentie 1",
    type: "site",
    attrs: {
      customer: "Liikekeskus Aviapolis",
      district: "Aviapolis, Vantaa",
      equipment: "roof-top units ×5, refrigeration",
      access: "service corridor, 24/7",
    },
    lat: 60.292,
    lng: 24.969,
  },
  {
    id: "Tapionaukio 7",
    type: "site",
    attrs: {
      customer: "Kiinteistö Oy Pasilan Visio",
      district: "Tapiola, Espoo",
      equipment: "AHU ×4, exhaust fans",
      access: "key safe + service contact",
    },
    lat: 60.176,
    lng: 24.805,
  },

  // Parts
  {
    id: "UPM3 25-70",
    type: "part",
    attrs: {
      description: "circulation pump",
      stock_konala: 14,
      stock_olari: 6,
      stock_nekala: 5,
    },
  },
  {
    id: "R32 refrigerant",
    type: "part",
    attrs: {
      description: "refrigerant canister 9 kg",
      stock_konala: 11,
      stock_olari: 4,
      stock_nekala: 6,
      handling: "F-gas certified only",
    },
  },
  {
    id: "Honeywell VK4105",
    type: "part",
    attrs: {
      description: "gas valve",
      stock_konala: 5,
      stock_olari: 2,
      stock_nekala: 3,
    },
  },
  {
    id: "F7 filter set 592×592",
    type: "part",
    attrs: {
      description: "AHU supply filter set",
      stock_konala: 48,
      stock_olari: 30,
      stock_nekala: 22,
    },
  },
  {
    id: "NIBE expansion vessel 18l",
    type: "part",
    attrs: {
      description: "heat pump expansion vessel",
      stock_konala: 7,
      stock_olari: 3,
      stock_nekala: 4,
    },
  },
  {
    id: "Danfoss TP One",
    type: "part",
    attrs: {
      description: "room thermostat",
      stock_konala: 23,
      stock_olari: 12,
      stock_nekala: 9,
    },
  },

  // Work orders — today's board (windows shown as local HH:MM)
  {
    id: "WO-4807",
    type: "job",
    attrs: {
      summary: "Gas boiler pilot fault — no hot water",
      site: "Fredrikinkatu 22",
      priority: "P1",
      sla: "Gold SLA",
      window: "10:00–14:00",
      assigned: "Mikko Virtanen",
      requires: "Tukes gas",
      status: "unassigned — tech on sick leave",
    },
  },
  {
    id: "WO-4811",
    type: "job",
    attrs: {
      summary: "Ground-source heat pump annual maintenance",
      site: "Pohjolankatu 12",
      priority: "P3",
      sla: "Silver SLA",
      window: "13:00–15:00 (confirmed)",
      assigned: "Mikko Virtanen",
      requires: "—",
      status: "unassigned — tech on sick leave",
    },
  },
  {
    id: "WO-4815",
    type: "job",
    attrs: {
      summary: "AHU filter pressure alarm",
      site: "Pasilankatu 8",
      priority: "P2",
      sla: "Gold SLA",
      window: "15:00–17:00",
      assigned: "Mikko Virtanen",
      requires: "F7 filter set 592×592",
      status: "unassigned — tech on sick leave",
    },
  },
  {
    id: "WO-4820",
    type: "job",
    attrs: {
      summary: "Walk-in cooler temperature alarm",
      site: "Vattuniemenkatu 5",
      priority: "P1",
      sla: "Silver SLA",
      window: "16:00–18:00",
      assigned: "Mikko Virtanen",
      requires: "F-gas, R32 refrigerant",
      status: "unassigned — tech on sick leave",
    },
  },
  {
    id: "WO-4809",
    type: "job",
    attrs: {
      summary: "Exhaust-air heat pump service",
      site: "Unikkotie 3",
      priority: "P2",
      sla: "Gold SLA",
      window: "08:00–11:00",
      assigned: "Jari Korhonen",
      requires: "—",
      status: "on site",
    },
  },
  {
    id: "WO-4813",
    type: "job",
    attrs: {
      summary: "AHU belt replacement, units 2–4",
      site: "Tapionaukio 7",
      priority: "P3",
      sla: "Gold SLA",
      window: "09:00–13:00",
      assigned: "Sami Nieminen",
      requires: "—",
      status: "on site",
    },
  },
  {
    id: "WO-4817",
    type: "job",
    attrs: {
      summary: "Air-source heat pump low-pressure alarm",
      site: "Suomenlahdentie 9",
      priority: "P2",
      sla: "Silver SLA",
      window: "11:00–14:00",
      assigned: "Laura Heikkinen",
      requires: "F-gas, R32 refrigerant",
      status: "en route",
    },
  },
  {
    id: "WO-4818",
    type: "job",
    attrs: {
      summary: "Substation pressure drop investigation",
      site: "Läkkisepänkuja 4",
      priority: "P2",
      sla: "Silver SLA",
      window: "14:00–16:00 (confirmed)",
      assigned: "Laura Heikkinen",
      requires: "UPM3 25-70",
      status: "scheduled",
    },
  },
  {
    id: "WO-4821",
    type: "job",
    attrs: {
      summary: "Fan motor live measurement, AHU 3",
      site: "Pasilankatu 8",
      priority: "P2",
      sla: "Gold SLA",
      window: "12:00–15:00",
      assigned: "Anna Mäkelä + Emilia Koskinen",
      requires: "S2 electrical, crew of 2",
      status: "on site",
    },
  },
  {
    id: "WO-4823",
    type: "job",
    attrs: {
      summary: "Roof-top unit quarterly maintenance ×5",
      site: "Karhumäentie 1",
      priority: "P3",
      sla: "Silver SLA",
      window: "09:00–15:00",
      assigned: "Emilia Koskinen",
      requires: "F7 filter set 592×592",
      status: "scheduled 12:00",
    },
  },
  {
    id: "WO-4824",
    type: "job",
    attrs: {
      summary: "Heat pump compressor swap, unit B2",
      site: "Insinöörinkatu 30",
      priority: "P2",
      sla: "Gold SLA",
      window: "08:00–16:00",
      assigned: "Petri Laine",
      requires: "F-gas, R32 refrigerant",
      status: "on site",
    },
  },
  {
    id: "WO-4826",
    type: "job",
    attrs: {
      summary: "Lighting group fault, parking level",
      site: "Insinöörinkatu 30",
      priority: "P3",
      sla: "Gold SLA",
      window: "12:00–16:00",
      assigned: "Juho Salmi",
      requires: "S2 electrical",
      status: "scheduled",
    },
  },
];

// ── Graph edges ──────────────────────────────────────────────────────────────

export const seedEdges: GraphEdge[] = [
  { source: "Konala depot", target: "Uusimaa", relation: "in region" },
  { source: "Olari depot", target: "Uusimaa", relation: "in region" },
  { source: "Nekala depot", target: "Pirkanmaa", relation: "in region" },

  { source: "Mikko Virtanen", target: "Konala depot", relation: "based at" },
  { source: "Anna Mäkelä", target: "Konala depot", relation: "based at" },
  { source: "Jari Korhonen", target: "Konala depot", relation: "based at" },
  { source: "Emilia Koskinen", target: "Konala depot", relation: "based at" },
  { source: "Sami Nieminen", target: "Olari depot", relation: "based at" },
  { source: "Laura Heikkinen", target: "Olari depot", relation: "based at" },
  { source: "Petri Laine", target: "Nekala depot", relation: "based at" },
  { source: "Juho Salmi", target: "Nekala depot", relation: "based at" },

  { source: "Mikko Virtanen", target: "ZKT-435", relation: "drives" },
  { source: "Anna Mäkelä", target: "BNF-218", relation: "drives" },
  { source: "Sami Nieminen", target: "JLR-704", relation: "drives" },
  { source: "Laura Heikkinen", target: "CPX-561", relation: "drives" },
  { source: "Jari Korhonen", target: "ENM-329", relation: "drives" },
  { source: "Petri Laine", target: "VHT-186", relation: "drives" },

  { source: "ZKT-435", target: "Honeywell VK4105", relation: "stocks" },
  { source: "ZKT-435", target: "R32 refrigerant", relation: "stocks" },
  { source: "BNF-218", target: "Danfoss TP One", relation: "stocks" },
  { source: "JLR-704", target: "F7 filter set 592×592", relation: "stocks" },
  { source: "CPX-561", target: "R32 refrigerant", relation: "stocks" },
  { source: "CPX-561", target: "UPM3 25-70", relation: "stocks" },
  { source: "VHT-186", target: "R32 refrigerant", relation: "stocks" },

  { source: "Fredrikinkatu 22", target: "Hotelli Norppa", relation: "owned by" },
  {
    source: "Pasilankatu 8",
    target: "Kiinteistö Oy Pasilan Visio",
    relation: "owned by",
  },
  {
    source: "Tapionaukio 7",
    target: "Kiinteistö Oy Pasilan Visio",
    relation: "owned by",
  },
  {
    source: "Pohjolankatu 12",
    target: "Asunto Oy Helsingin Tuulensuu",
    relation: "owned by",
  },
  { source: "Vattuniemenkatu 5", target: "Ravintola Kaarna", relation: "owned by" },
  { source: "Unikkotie 3", target: "Päiväkoti Vekkuli", relation: "owned by" },
  {
    source: "Läkkisepänkuja 4",
    target: "Asunto Oy Leppävaaran Helmi",
    relation: "owned by",
  },
  { source: "Suomenlahdentie 9", target: "FysioMove", relation: "owned by" },
  {
    source: "Insinöörinkatu 30",
    target: "Kiinteistö Oy Hervannan Torni",
    relation: "owned by",
  },
  {
    source: "Karhumäentie 1",
    target: "Liikekeskus Aviapolis",
    relation: "owned by",
  },

  { source: "Hotelli Norppa", target: "Gold SLA", relation: "covered by" },
  {
    source: "Kiinteistö Oy Pasilan Visio",
    target: "Gold SLA",
    relation: "covered by",
  },
  { source: "Päiväkoti Vekkuli", target: "Gold SLA", relation: "covered by" },
  {
    source: "Kiinteistö Oy Hervannan Torni",
    target: "Gold SLA",
    relation: "covered by",
  },
  {
    source: "Asunto Oy Helsingin Tuulensuu",
    target: "Silver SLA",
    relation: "covered by",
  },
  { source: "Ravintola Kaarna", target: "Silver SLA", relation: "covered by" },
  {
    source: "Asunto Oy Leppävaaran Helmi",
    target: "Silver SLA",
    relation: "covered by",
  },
  { source: "FysioMove", target: "Silver SLA", relation: "covered by" },
  {
    source: "Liikekeskus Aviapolis",
    target: "Silver SLA",
    relation: "covered by",
  },

  { source: "WO-4807", target: "Fredrikinkatu 22", relation: "at site" },
  { source: "WO-4811", target: "Pohjolankatu 12", relation: "at site" },
  { source: "WO-4815", target: "Pasilankatu 8", relation: "at site" },
  { source: "WO-4820", target: "Vattuniemenkatu 5", relation: "at site" },
  { source: "WO-4809", target: "Unikkotie 3", relation: "at site" },
  { source: "WO-4813", target: "Tapionaukio 7", relation: "at site" },
  { source: "WO-4817", target: "Suomenlahdentie 9", relation: "at site" },
  { source: "WO-4818", target: "Läkkisepänkuja 4", relation: "at site" },
  { source: "WO-4821", target: "Pasilankatu 8", relation: "at site" },
  { source: "WO-4823", target: "Karhumäentie 1", relation: "at site" },
  { source: "WO-4824", target: "Insinöörinkatu 30", relation: "at site" },
  { source: "WO-4826", target: "Insinöörinkatu 30", relation: "at site" },

  { source: "WO-4807", target: "Mikko Virtanen", relation: "assigned to" },
  { source: "WO-4811", target: "Mikko Virtanen", relation: "assigned to" },
  { source: "WO-4815", target: "Mikko Virtanen", relation: "assigned to" },
  { source: "WO-4820", target: "Mikko Virtanen", relation: "assigned to" },
  { source: "WO-4809", target: "Jari Korhonen", relation: "assigned to" },
  { source: "WO-4813", target: "Sami Nieminen", relation: "assigned to" },
  { source: "WO-4817", target: "Laura Heikkinen", relation: "assigned to" },
  { source: "WO-4818", target: "Laura Heikkinen", relation: "assigned to" },
  { source: "WO-4821", target: "Anna Mäkelä", relation: "assigned to" },
  { source: "WO-4823", target: "Emilia Koskinen", relation: "assigned to" },
  { source: "WO-4824", target: "Petri Laine", relation: "assigned to" },
  { source: "WO-4826", target: "Juho Salmi", relation: "assigned to" },

  { source: "WO-4807", target: "R2", relation: "governed by" },
  { source: "WO-4820", target: "R3", relation: "governed by" },
  { source: "WO-4817", target: "R3", relation: "governed by" },
  { source: "WO-4824", target: "R3", relation: "governed by" },
  { source: "WO-4821", target: "R7", relation: "governed by" },
  { source: "WO-4826", target: "R7", relation: "governed by" },
  { source: "WO-4811", target: "R8", relation: "governed by" },
  { source: "WO-4818", target: "R8", relation: "governed by" },
  { source: "WO-4807", target: "R1", relation: "governed by" },

  { source: "WO-4815", target: "F7 filter set 592×592", relation: "requires" },
  { source: "WO-4823", target: "F7 filter set 592×592", relation: "requires" },
  { source: "WO-4820", target: "R32 refrigerant", relation: "requires" },
  { source: "WO-4817", target: "R32 refrigerant", relation: "requires" },
  { source: "WO-4824", target: "R32 refrigerant", relation: "requires" },
  { source: "WO-4818", target: "UPM3 25-70", relation: "requires" },
];

// ── Scripted scenarios (mock mode + demo chips) ─────────────────────────────

export interface Scenario {
  match: string[];
  decision: Decision;
}

export const scenarios: Scenario[] = [
  // 1 — Flagship: sick technician, reassign the day
  {
    match: ["sick", "reassign", "virtanen"],
    decision: {
      status: "recommended",
      summary:
        "Reassign Mikko Virtanen's four jobs: the gas-boiler fault and the Käpylä maintenance to Sami Nieminen, the Pasila filter alarm to Anna Mäkelä, and the cooler alarm to Laura Heikkinen. All SLA, certification and working-time rules hold.",
      action:
        "Reassign WO-4807 and WO-4811 to Sami Nieminen, WO-4815 to Anna Mäkelä, WO-4820 to Laura Heikkinen.",
      references: [
        { id: "Mikko Virtanen", type: "technician" },
        { id: "R2", type: "rule" },
        { id: "R3", type: "rule" },
        { id: "R4", type: "rule" },
      ],
      steps: [
        {
          text: "Queried the job board: Mikko Virtanen has four open jobs today out of Konala depot — WO-4807, WO-4811, WO-4815 and WO-4820.",
          references: [
            { id: "Mikko Virtanen", type: "technician" },
            { id: "WO-4807", type: "job" },
            { id: "WO-4811", type: "job" },
            { id: "Konala depot", type: "depot" },
          ],
        },
        {
          text: "Two are time-critical. WO-4807 is a P1 gas-boiler fault at Hotelli Norppa under Gold SLA — rule R1 starts a 4-hour response clock. WO-4820 is a P1 walk-in cooler alarm at Ravintola Kaarna.",
          references: [
            { id: "WO-4807", type: "job" },
            { id: "Hotelli Norppa", type: "customer" },
            { id: "R1", type: "rule" },
            { id: "WO-4820", type: "job" },
          ],
        },
        {
          text: "Rule R2 requires a Tukes gas permit for the boiler fault. Sami Nieminen and Jari Korhonen qualify; Jari is mid-job in Myyrmäki, while Sami finishes at Tapionaukio 7 by 12:30 and is 19 minutes away.",
          references: [
            { id: "R2", type: "rule" },
            { id: "Sami Nieminen", type: "technician" },
            { id: "Jari Korhonen", type: "technician" },
            { id: "Tapionaukio 7", type: "site" },
          ],
        },
        {
          text: "Working-time check against rule R4: taking WO-4807 and the Käpylä maintenance WO-4811 puts Sami at 9.4 hours including travel — inside the 10-hour cap. Adding WO-4815 would breach it.",
          references: [
            { id: "R4", type: "rule" },
            { id: "WO-4811", type: "job" },
            { id: "WO-4815", type: "job" },
          ],
        },
        {
          text: "WO-4815 therefore goes to Anna Mäkelä, who is already on site at Pasilankatu 8 and frees up at 14:30; her van BNF-218 needs an F7 filter pickup, which fits via Konala depot per rule R5.",
          references: [
            { id: "Anna Mäkelä", type: "technician" },
            { id: "Pasilankatu 8", type: "site" },
            { id: "R5", type: "rule" },
            { id: "BNF-218", type: "vehicle" },
          ],
        },
        {
          text: "The cooler alarm WO-4820 requires F-gas certification under rule R3. Laura Heikkinen holds it, carries R32 refrigerant on CPX-561, and can arrive 16:40 — inside the customer's window.",
          references: [
            { id: "R3", type: "rule" },
            { id: "Laura Heikkinen", type: "technician" },
            { id: "CPX-561", type: "vehicle" },
            { id: "WO-4820", type: "job" },
          ],
        },
        {
          text: "Solver verified the full plan: rules R1–R5 are satisfiable for all four reassignments; no certification, working-time or parts constraint is violated.",
          references: [
            { id: "R1", type: "rule" },
            { id: "R4", type: "rule" },
            { id: "R5", type: "rule" },
          ],
        },
      ],
      widget: {
        kind: "assignments",
        title: "Reassignment plan — 4 jobs",
        rows: [
          {
            job: "WO-4807",
            site: "Fredrikinkatu 22",
            from: "Mikko Virtanen",
            to: "Sami Nieminen",
            window: "12:50–14:00",
            note: "P1 · Gold SLA · gas",
          },
          {
            job: "WO-4811",
            site: "Pohjolankatu 12",
            from: "Mikko Virtanen",
            to: "Sami Nieminen",
            window: "14:40–15:00",
            note: "confirmed window held",
          },
          {
            job: "WO-4815",
            site: "Pasilankatu 8",
            from: "Mikko Virtanen",
            to: "Anna Mäkelä",
            window: "15:00–17:00",
            note: "filter pickup at Konala",
          },
          {
            job: "WO-4820",
            site: "Vattuniemenkatu 5",
            from: "Mikko Virtanen",
            to: "Laura Heikkinen",
            window: "16:40–18:00",
            note: "P1 · F-gas",
          },
        ],
        stats: [
          { label: "SLA breaches avoided", after: "2" },
          { label: "Added drive time", after: "+38 min total" },
          { label: "Working-time cap", after: "all ≤ 10 h" },
        ],
      },
    },
  },

  // 2 — Route optimization on a real map
  {
    match: ["optimize", "optimise", "route"],
    decision: {
      status: "recommended",
      summary:
        "Reorder the Espoo afternoon so Sami runs Tapiola → Matinkylä → Leppävaara instead of backtracking north first. Both customer windows hold, and the crew saves 13 km and 26 minutes of driving.",
      action:
        "Apply the reordered Espoo route: Tapionaukio 7 → Suomenlahdentie 9 → Läkkisepänkuja 4 → Olari depot.",
      references: [
        { id: "Sami Nieminen", type: "technician" },
        { id: "R8", type: "rule" },
        { id: "R4", type: "rule" },
      ],
      steps: [
        {
          text: "Pulled the Espoo afternoon board: three remaining stops — Tapionaukio 7, Läkkisepänkuja 4 (window 14:00–16:00, confirmed) and Suomenlahdentie 9, returning to Olari depot.",
          references: [
            { id: "Tapionaukio 7", type: "site" },
            { id: "Läkkisepänkuja 4", type: "site" },
            { id: "Suomenlahdentie 9", type: "site" },
            { id: "Olari depot", type: "depot" },
          ],
        },
        {
          text: "The current plan visits Leppävaara before Matinkylä, which means driving north and doubling back south — 41 km in total.",
          references: [],
        },
        {
          text: "Reordering to Tapiola → Matinkylä → Leppävaara cuts the route to 28 km. The Leppävaara arrival moves to 14:35, still inside the resident's confirmed window, so rule R8 holds.",
          references: [{ id: "R8", type: "rule" }],
        },
        {
          text: "Working-time check per rule R4: the reorder shortens Sami's day to 8.1 hours including travel. Solver confirms both time windows and the working-time cap are satisfiable.",
          references: [
            { id: "R4", type: "rule" },
            { id: "Sami Nieminen", type: "technician" },
          ],
        },
      ],
      widget: {
        kind: "route",
        title: "Espoo afternoon — reordered route",
        stops: [
          { label: "Tapionaukio 7", lat: 60.176, lng: 24.805, order: 1, kind: "site" },
          { label: "Suomenlahdentie 9", lat: 60.16, lng: 24.738, order: 2, kind: "site" },
          { label: "Läkkisepänkuja 4", lat: 60.219, lng: 24.813, order: 3, kind: "site" },
          { label: "Olari depot", lat: 60.176, lng: 24.737, order: 4, kind: "depot" },
        ],
        oldPath: [
          [60.176, 24.805],
          [60.219, 24.813],
          [60.16, 24.738],
          [60.176, 24.737],
        ],
        newPath: [
          [60.176, 24.805],
          [60.16, 24.738],
          [60.219, 24.813],
          [60.176, 24.737],
        ],
        stats: [
          { label: "Distance", before: "41 km", after: "28 km" },
          { label: "Drive time", before: "78 min", after: "52 min" },
          { label: "Windows held", after: "2 of 2" },
        ],
      },
    },
  },

  // 3 — SLA risk report
  {
    match: ["sla", "breach", "at risk"],
    decision: {
      status: "informational",
      summary:
        "Three jobs are at risk today: both P1 faults from Mikko Virtanen's unassigned board, and the Aviapolis maintenance where Emilia Koskinen is double-booked until 14:30. Reassigning the sick-leave board removes the two acute risks.",
      action: "Review the three at-risk jobs and reassign the sick-leave board.",
      references: [
        { id: "R1", type: "rule" },
        { id: "WO-4807", type: "job" },
        { id: "WO-4820", type: "job" },
        { id: "WO-4823", type: "job" },
      ],
      steps: [
        {
          text: "Checked every open job against its SLA clock and time window. Two P1 faults are unassigned because Mikko Virtanen is on sick leave.",
          references: [
            { id: "Mikko Virtanen", type: "technician" },
            { id: "WO-4807", type: "job" },
            { id: "WO-4820", type: "job" },
          ],
        },
        {
          text: "WO-4807 at Hotelli Norppa is Gold SLA: rule R1's 4-hour response deadline lands at 13:40. Without a reassignment the window is missed.",
          references: [
            { id: "WO-4807", type: "job" },
            { id: "R1", type: "rule" },
            { id: "Hotelli Norppa", type: "customer" },
          ],
        },
        {
          text: "WO-4823 at Karhumäentie 1 is scheduled for 12:00, but Emilia Koskinen is paired on the live measurement at Pasilankatu 8 until about 14:30 under rule R7's two-person requirement.",
          references: [
            { id: "WO-4823", type: "job" },
            { id: "Emilia Koskinen", type: "technician" },
            { id: "R7", type: "rule" },
          ],
        },
        {
          text: "Remaining jobs are on plan: solver finds no other window or working-time conflict on today's board.",
          references: [{ id: "R4", type: "rule" }],
        },
      ],
      widget: {
        kind: "table",
        title: "SLA risk — today",
        columns: ["Job", "Site", "Deadline", "Risk", "Mitigation"],
        rows: [
          [
            "WO-4807",
            "Fredrikinkatu 22",
            "13:40 (R1)",
            "high — unassigned P1",
            "reassign to Sami Nieminen",
          ],
          [
            "WO-4820",
            "Vattuniemenkatu 5",
            "18:00 window",
            "high — unassigned P1, F-gas",
            "reassign to Laura Heikkinen",
          ],
          [
            "WO-4823",
            "Karhumäentie 1",
            "15:00 window end",
            "medium — tech double-booked",
            "start 14:45 or move to tomorrow 9:00",
          ],
        ],
      },
    },
  },

  // 4 — Emergency callout with depot detour on the map
  {
    match: ["vekkuli", "no heat", "emergency callout", "callout"],
    decision: {
      status: "recommended",
      summary:
        "Dispatch Jari Korhonen from Myyrmäki for the no-heat callout at Päiväkoti Vekkuli, routing via Konala depot to pick up the expansion vessel his van doesn't stock. He arrives 15:05 — inside the Gold SLA window with two hours to spare.",
      action:
        "Dispatch Jari Korhonen to Unikkotie 3 via Konala depot; ETA 15:05.",
      references: [
        { id: "Jari Korhonen", type: "technician" },
        { id: "R1", type: "rule" },
        { id: "R5", type: "rule" },
      ],
      steps: [
        {
          text: "Päiväkoti Vekkuli is Gold SLA, so rule R1 starts a 4-hour response clock from the 13:05 alarm — a technician must be on site by 17:05.",
          references: [
            { id: "Päiväkoti Vekkuli", type: "customer" },
            { id: "R1", type: "rule" },
            { id: "Unikkotie 3", type: "site" },
          ],
        },
        {
          text: "Jari Korhonen serviced this exhaust-air heat pump this morning (WO-4809) and is closest, finishing in Myyrmäki at 14:15 — 22 minutes from Tikkurila.",
          references: [
            { id: "Jari Korhonen", type: "technician" },
            { id: "WO-4809", type: "job" },
          ],
        },
        {
          text: "Likely fault is the expansion vessel flagged low in this morning's readings. Van ENM-329 does not stock the NIBE 18l vessel, so rule R5 requires routing via the nearest depot — Konala holds 7 units.",
          references: [
            { id: "ENM-329", type: "vehicle" },
            { id: "NIBE expansion vessel 18l", type: "part" },
            { id: "R5", type: "rule" },
            { id: "Konala depot", type: "depot" },
          ],
        },
        {
          text: "With the depot detour Jari arrives 15:05. Solver confirms the R1 deadline, the R5 parts requirement and his R4 working-time cap (8.9 h) are all satisfied.",
          references: [
            { id: "R1", type: "rule" },
            { id: "R4", type: "rule" },
          ],
        },
      ],
      widget: {
        kind: "route",
        title: "Emergency dispatch — Unikkotie 3",
        stops: [
          { label: "Jari (Myyrmäki)", lat: 60.261, lng: 24.854, order: 1, kind: "technician" },
          { label: "Konala depot", lat: 60.238, lng: 24.841, order: 2, kind: "depot" },
          { label: "Unikkotie 3", lat: 60.292, lng: 25.044, order: 3, kind: "site" },
        ],
        newPath: [
          [60.261, 24.854],
          [60.238, 24.841],
          [60.292, 25.044],
        ],
        stats: [
          { label: "ETA on site", after: "15:05" },
          { label: "R1 deadline", after: "17:05 — met" },
          { label: "Part picked up", after: "NIBE vessel 18l" },
        ],
      },
    },
  },
];

// ── Fallback: unknown prompts get a live board overview ─────────────────────

export const fallbackDecision: Decision = {
  status: "informational",
  summary:
    "Here is the current operational picture. Twelve jobs are on today's board: four unassigned after Mikko Virtanen's sick leave, two P1 faults among them. The rest of the field force is on plan.",
  action: "Review today's board, or ask about a specific job, technician or site.",
  references: [
    { id: "Mikko Virtanen", type: "technician" },
    { id: "WO-4807", type: "job" },
    { id: "WO-4820", type: "job" },
  ],
  steps: [
    {
      text: "Queried the field service board: 12 open jobs across Uusimaa and Pirkanmaa, 8 technicians, 6 vans in service.",
      references: [
        { id: "Uusimaa", type: "region" },
        { id: "Pirkanmaa", type: "region" },
      ],
    },
    {
      text: "Four jobs are unassigned after Mikko Virtanen's sick leave; two of them are P1 faults with SLA clocks running (rule R1).",
      references: [
        { id: "Mikko Virtanen", type: "technician" },
        { id: "R1", type: "rule" },
      ],
    },
    {
      text: "I could not match the request to a specific change on the board. The overview below reflects the live state; rephrase with a job, technician or site for a concrete plan.",
      references: [],
    },
  ],
  widget: {
    kind: "table",
    title: "Today's board — open jobs",
    columns: ["Job", "Site", "Priority", "Assigned", "Status"],
    rows: [
      ["WO-4807", "Fredrikinkatu 22", "P1", "—", "unassigned (sick leave)"],
      ["WO-4820", "Vattuniemenkatu 5", "P1", "—", "unassigned (sick leave)"],
      ["WO-4815", "Pasilankatu 8", "P2", "—", "unassigned (sick leave)"],
      ["WO-4811", "Pohjolankatu 12", "P3", "—", "unassigned (sick leave)"],
      ["WO-4809", "Unikkotie 3", "P2", "Jari Korhonen", "on site"],
      ["WO-4813", "Tapionaukio 7", "P3", "Sami Nieminen", "on site"],
      ["WO-4817", "Suomenlahdentie 9", "P2", "Laura Heikkinen", "en route"],
      ["WO-4821", "Pasilankatu 8", "P2", "Anna + Emilia", "on site"],
      ["WO-4823", "Karhumäentie 1", "P3", "Emilia Koskinen", "scheduled 12:00"],
      ["WO-4824", "Insinöörinkatu 30", "P2", "Petri Laine", "on site"],
    ],
  },
};

// ── Seeded audit trail (timestamps relative to load) ────────────────────────

function auditDecision(
  summary: string,
  action: string,
  status: Decision["status"],
  steps: Decision["steps"]
): Decision {
  const refs = steps.flatMap((s) => s.references).slice(0, 4);
  return { summary, action, status, steps, references: refs };
}

export const seedAuditEntries: AuditEntry[] = [
  {
    id: "AUD-309214",
    ts: hoursAgo(3),
    task: "Confirm crew pairing for the live measurement at Pasilankatu 8.",
    decision: auditDecision(
      "Approved the Anna Mäkelä + Emilia Koskinen pairing for WO-4821; rule R7's two-person requirement for live electrical work is satisfied.",
      "Confirm Anna Mäkelä and Emilia Koskinen on WO-4821.",
      "executed",
      [
        {
          text: "WO-4821 includes live measurement of the AHU 3 fan motor, which triggers rule R7: S2 certification plus a second person on site.",
          references: [
            { id: "WO-4821", type: "job" },
            { id: "R7", type: "rule" },
          ],
        },
        {
          text: "Anna Mäkelä holds S2 certification; Emilia Koskinen is on site from 12:00 as the second person. Solver confirms R7 is satisfied.",
          references: [
            { id: "Anna Mäkelä", type: "technician" },
            { id: "Emilia Koskinen", type: "technician" },
          ],
        },
      ]
    ),
  },
  {
    id: "AUD-309187",
    ts: hoursAgo(22),
    task: "Optimize today's routes for the Uusimaa crews.",
    decision: auditDecision(
      "Applied reordered routes for three Uusimaa technicians: 31 km and 54 minutes of driving removed, every confirmed customer window held.",
      "Apply the reordered Uusimaa routes for Anna, Jari and Laura.",
      "executed",
      [
        {
          text: "Evaluated 14 stop permutations against confirmed windows (rule R8) and the 10-hour working-time cap (rule R4).",
          references: [
            { id: "R8", type: "rule" },
            { id: "R4", type: "rule" },
          ],
        },
        {
          text: "Best feasible ordering removes 31 km of driving. Solver verified all windows and caps satisfiable for Anna Mäkelä, Jari Korhonen and Laura Heikkinen.",
          references: [
            { id: "Anna Mäkelä", type: "technician" },
            { id: "Jari Korhonen", type: "technician" },
            { id: "Laura Heikkinen", type: "technician" },
          ],
        },
      ]
    ),
  },
  {
    id: "AUD-309101",
    ts: daysAgo(2, 16, 40),
    task: "Walk-in cooler high-temperature alarm at Ravintola Kaarna — dispatch.",
    decision: auditDecision(
      "Dispatched Laura Heikkinen with R32 refrigerant; on site 17:25, alarm cleared 18:10. F-gas requirement under rule R3 verified before dispatch.",
      "Dispatch Laura Heikkinen to Vattuniemenkatu 5.",
      "executed",
      [
        {
          text: "Cooler alarm at Vattuniemenkatu 5 involves refrigerant handling, so rule R3 requires F-gas certification.",
          references: [
            { id: "Vattuniemenkatu 5", type: "site" },
            { id: "R3", type: "rule" },
          ],
        },
        {
          text: "Laura Heikkinen holds F-gas and CPX-561 stocks R32; ETA 17:25 within the agreed window. Solver confirmed R3 and R4 satisfied.",
          references: [
            { id: "Laura Heikkinen", type: "technician" },
            { id: "CPX-561", type: "vehicle" },
            { id: "R32 refrigerant", type: "part" },
          ],
        },
      ]
    ),
  },
  {
    id: "AUD-309064",
    ts: daysAgo(3, 11, 5),
    task: "Can WO-4790 proceed without an F-gas certified technician?",
    decision: auditDecision(
      "No. WO-4790 includes refrigerant recovery; rule R3 is violated for every non-certified assignment, so the request was rejected and the job held for a certified technician.",
      "Hold WO-4790 until an F-gas certified technician is available.",
      "rejected",
      [
        {
          text: "WO-4790 requires refrigerant recovery on the heat pump circuit; rule R3 applies without exception.",
          references: [{ id: "R3", type: "rule" }],
        },
        {
          text: "Solver returned unsat for every assignment lacking F-gas certification — the unsat core pins the violation to rule R3, not scheduling.",
          references: [{ id: "R3", type: "rule" }],
        },
      ]
    ),
  },
  {
    id: "AUD-308991",
    ts: daysAgo(5, 9, 20),
    task: "Rebook the maintenance displaced by Monday's emergency at Suomenlahdentie 9.",
    decision: auditDecision(
      "Rebooked the displaced maintenance to Thursday 9:00 with Laura Heikkinen — 3 business days after displacement, inside rule R6's 5-day limit.",
      "Rebook the displaced maintenance to Thursday 9:00.",
      "executed",
      [
        {
          text: "Rule R6 requires maintenance displaced by a Gold-SLA emergency to be rebooked within 5 business days.",
          references: [
            { id: "R6", type: "rule" },
            { id: "Suomenlahdentie 9", type: "site" },
          ],
        },
        {
          text: "Earliest feasible slot satisfying windows and working time is Thursday 9:00 with Laura Heikkinen; solver confirms R4 and R6 hold.",
          references: [
            { id: "Laura Heikkinen", type: "technician" },
            { id: "R4", type: "rule" },
          ],
        },
      ]
    ),
  },
  {
    id: "AUD-308875",
    ts: daysAgo(7, 15, 45),
    task: "Which vans are missing required stock for tomorrow's jobs?",
    decision: auditDecision(
      "Two gaps found: ENM-329 lacks the NIBE expansion vessel and BNF-218 is below minimum on F7 filter sets. Both flagged for depot pickup under rule R5.",
      "Schedule depot pickups for ENM-329 and BNF-218.",
      "informational",
      [
        {
          text: "Compared tomorrow's required parts per job against van stock per rule R5.",
          references: [{ id: "R5", type: "rule" }],
        },
        {
          text: "ENM-329 lacks the NIBE expansion vessel 18l; BNF-218 holds 2 F7 filter sets against a required 4. Konala depot covers both.",
          references: [
            { id: "ENM-329", type: "vehicle" },
            { id: "BNF-218", type: "vehicle" },
            { id: "Konala depot", type: "depot" },
          ],
        },
      ]
    ),
  },
];
