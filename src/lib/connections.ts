"use client";

// ────────────────────────────────────────────────────────────────────────────
// Connected-systems state, shared by Settings and the composer integrations
// popover. Persisted in the browser so the demo keeps its state.
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

export type SystemId = "fsm" | "erp" | "telematics";

export interface SystemDef {
  id: SystemId;
  label: string;
  description: string;
  vendors: string[];
}

export const SYSTEMS: SystemDef[] = [
  {
    id: "fsm",
    label: "Field service management",
    description: "Work orders, technicians, scheduling",
    vendors: [
      "Takapulpetti FSM",
      "SAP Field Service Management",
      "Microsoft Dynamics 365 Field Service",
      "Salesforce Field Service",
      "IFS Cloud",
    ],
  },
  {
    id: "erp",
    label: "ERP",
    description: "Orders, invoicing, parts inventory",
    vendors: ["SAP S/4HANA", "Microsoft Dynamics 365", "NetSuite", "Visma.net"],
  },
  {
    id: "telematics",
    label: "Telematics",
    description: "Vehicle positions, driving logs",
    vendors: ["ABAX", "Samsara", "Geotab", "Webfleet"],
  },
];

const KEY = "vera.connections";
const EVENT = "vera-connections";

const DEFAULTS: Record<SystemId, string | null> = {
  fsm: "Takapulpetti FSM",
  telematics: "ABAX",
  erp: null,
};

export type Connections = Record<SystemId, string | null>;

export function getConnections(): Connections {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setConnection(id: SystemId, vendor: string | null): void {
  const next = { ...getConnections(), [id]: vendor };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function useConnections(): Connections {
  const [state, setState] = useState<Connections>({ ...DEFAULTS });
  useEffect(() => {
    const read = () => setState(getConnections());
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);
  return state;
}
