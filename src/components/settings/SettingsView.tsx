"use client";

import { useState } from "react";
import { PageHeader } from "@/components/pages/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";

type Autonomy = "Suggest" | "Approve" | "Autonomous";

const ACTION_TYPES: { label: string; description: string; initial: Autonomy }[] = [
  {
    label: "Rerouting",
    description: "Changing a shipment's assigned route",
    initial: "Approve",
  },
  {
    label: "Customer notifications",
    description: "ETA changes and disruption notices",
    initial: "Autonomous",
  },
  {
    label: "Carrier reassignment",
    description: "Switching the carrier on a shipment",
    initial: "Approve",
  },
  {
    label: "Schedule holds",
    description: "Holding dispatch until a disruption clears",
    initial: "Suggest",
  },
];

const CONNECTED_SYSTEMS = [
  { name: "TMS", detail: "Transport management", connected: false },
  { name: "ERP", detail: "Orders and inventory", connected: false },
  { name: "Telematics", detail: "Vehicle and reefer sensors", connected: false },
];

export function SettingsView() {
  const [autonomy, setAutonomy] = useState<Record<string, Autonomy>>(
    Object.fromEntries(ACTION_TYPES.map((a) => [a.label, a.initial]))
  );

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <PageHeader title="Settings" description="Workspace configuration." />

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-secondary">Name</span>
              <span className="text-ink">NordRetail Logistics</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-secondary">Region</span>
              <span className="flex items-center gap-1.5 text-ink">
                <StatusDot tone="ok" />
                EU-Central — data resides in the EU
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-secondary">Engine</span>
              <span className="flex items-center gap-1.5 text-ink">
                <StatusDot tone="ok" />
                Connected
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected systems</CardTitle>
          </CardHeader>
          <div>
            {CONNECTED_SYSTEMS.map((s, i) => (
              <div
                key={s.name}
                className={cn(
                  "flex items-center justify-between px-5 py-3.5",
                  i > 0 && "border-t border-line"
                )}
              >
                <div>
                  <p className="text-[13px] text-ink">{s.name}</p>
                  <p className="text-xs text-ink-muted">{s.detail}</p>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Autonomy</CardTitle>
            <p className="mt-0.5 text-xs text-ink-secondary">
              How far the agent may go for each action type. Approval is the
              default for actions that change operations.
            </p>
          </CardHeader>
          <div>
            {ACTION_TYPES.map((a, i) => (
              <div
                key={a.label}
                className={cn(
                  "flex items-center justify-between gap-4 px-5 py-3.5",
                  i > 0 && "border-t border-line"
                )}
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-ink">{a.label}</p>
                  <p className="text-xs text-ink-muted">{a.description}</p>
                </div>
                <div className="flex shrink-0 rounded-md border border-line p-0.5">
                  {(["Suggest", "Approve", "Autonomous"] as Autonomy[]).map(
                    (level) => (
                      <button
                        key={level}
                        onClick={() =>
                          setAutonomy((s) => ({ ...s, [a.label]: level }))
                        }
                        className={cn(
                          "rounded px-2.5 py-1 text-xs transition-colors",
                          autonomy[a.label] === level
                            ? "bg-accent-soft font-medium text-accent"
                            : "text-ink-muted hover:text-ink-secondary"
                        )}
                      >
                        {level}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
