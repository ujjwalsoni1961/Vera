"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PageHeader } from "@/components/pages/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import {
  SYSTEMS,
  setConnection,
  useConnections,
  type SystemDef,
} from "@/lib/connections";
import { cn } from "@/lib/utils";

type Autonomy = "Suggest" | "Approve" | "Autonomous";

const ACTION_TYPES: { label: string; description: string; initial: Autonomy }[] = [
  {
    label: "Job reassignment",
    description: "Moving a job to another technician",
    initial: "Approve",
  },
  {
    label: "Dispatch & routing",
    description: "Route changes and emergency dispatch",
    initial: "Approve",
  },
  {
    label: "Customer notifications",
    description: "ETA changes and visit confirmations",
    initial: "Autonomous",
  },
  {
    label: "Maintenance rebooking",
    description: "Rescheduling displaced maintenance visits",
    initial: "Suggest",
  },
];

// ── Vendor picker modal ──────────────────────────────────────────────────────

function ConnectModal({
  system,
  current,
  onClose,
}: {
  system: SystemDef;
  current: string | null;
  onClose: () => void;
}) {
  const [choice, setChoice] = useState<string>(current ?? system.vendors[0]);
  const [authorizing, setAuthorizing] = useState(false);

  const connect = () => {
    setAuthorizing(true);
    setTimeout(() => {
      setConnection(system.id, choice);
      onClose();
    }, 1100);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-line bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[13px] font-medium text-ink">
              Connect {system.label}
            </p>
            <p className="text-xs text-ink-muted">{system.description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-muted transition-colors hover:bg-zinc-100 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-2">
          {system.vendors.map((v) => (
            <button
              key={v}
              onClick={() => setChoice(v)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-[13px] transition-colors",
                choice === v
                  ? "bg-accent-soft text-accent"
                  : "text-ink hover:bg-zinc-50"
              )}
            >
              <span className={cn(choice === v && "font-medium")}>{v}</span>
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border",
                  choice === v ? "border-accent" : "border-zinc-300"
                )}
              >
                {choice === v && (
                  <span className="h-2 w-2 rounded-full bg-accent" />
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5">
          <p className="text-xxs leading-relaxed text-ink-muted">
            Read access via OAuth. Data stays in the EU.
          </p>
          <div className="flex shrink-0 gap-2">
            {current && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConnection(system.id, null);
                  onClose();
                }}
              >
                Disconnect
              </Button>
            )}
            <Button size="sm" onClick={connect} disabled={authorizing}>
              {authorizing ? "Authorizing…" : `Connect ${choice.split(" ")[0]}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Settings page ────────────────────────────────────────────────────────────

export function SettingsView() {
  const [autonomy, setAutonomy] = useState<Record<string, Autonomy>>(
    Object.fromEntries(ACTION_TYPES.map((a) => [a.label, a.initial]))
  );
  const connections = useConnections();
  const [modal, setModal] = useState<SystemDef | null>(null);

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
              <span className="text-ink">Takapulpetti Oy</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-secondary">Region</span>
              <span className="flex items-center gap-1.5 text-ink">
                <StatusDot tone="ok" />
                EU-North (Helsinki) — data resides in the EU
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
            {SYSTEMS.map((s, i) => {
              const vendor = connections[s.id];
              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center justify-between px-5 py-3.5",
                    i > 0 && "border-t border-line"
                  )}
                >
                  <div>
                    <p className="flex items-center gap-2 text-[13px] text-ink">
                      {s.label}
                      {vendor && (
                        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
                          <StatusDot tone="ok" />
                          {vendor}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted">{s.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModal(s)}
                  >
                    {vendor ? "Manage" : "Connect"}
                  </Button>
                </div>
              );
            })}
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

      {modal && (
        <ConnectModal
          system={modal}
          current={connections[modal.id]}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
