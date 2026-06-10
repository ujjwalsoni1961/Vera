"use client";

import { useState } from "react";
import { PageHeader } from "@/components/pages/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ReasoningSteps } from "@/components/agent/ReasoningSteps";
import { ReferenceProvider } from "@/components/agent/ReferenceChip";
import { reason, type Decision } from "@/lib/engine";

const REQUEST_SNIPPET = `POST /v1/reason
Content-Type: application/json

{
  "task": "Port of Rotterdam is on strike until Thursday — handle today's affected shipments.",
  "context": { "workspace": "nordretail-eu-central" }
}`;

const RESPONSE_SNIPPET = `{
  "summary": "...",
  "action": "Reroute Shipment 402 to Route B and notify TechNord Oy ...",
  "references": [{ "id": "R7", "type": "rule" }, { "id": "R3", "type": "rule" }],
  "steps": [
    { "text": "Identified 6 active shipments routed through Rotterdam ...",
      "references": [{ "id": "Port-Rotterdam", "type": "port" }] }
  ],
  "status": "recommended"
}`;

export function Developers() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Decision | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const decision = await reason(
        "Port of Rotterdam is on strike until Thursday — handle today's affected shipments."
      );
      setResult(decision);
    } finally {
      setRunning(false);
    }
  }

  return (
    <ReferenceProvider>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <PageHeader
          title="Developers"
          description="The same reasoning is available as a component other systems can call — over REST or as an MCP server. One endpoint in, one decision with its full trace out."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Request</CardTitle>
              <Button variant="primary" size="sm" onClick={run} disabled={running}>
                {running ? "Running" : "Run"}
              </Button>
            </CardHeader>
            <CardBody>
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-ink">
                {REQUEST_SNIPPET}
              </pre>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response shape</CardTitle>
            </CardHeader>
            <CardBody>
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-ink-secondary">
                {RESPONSE_SNIPPET}
              </pre>
            </CardBody>
          </Card>
        </div>

        {result && (
          <Card className="mt-5">
            <CardHeader>
              <CardTitle>Returned reasoning</CardTitle>
            </CardHeader>
            <CardBody>
              <ReasoningSteps steps={result.steps} />
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[13px] leading-relaxed text-ink">
                  {result.action}
                </p>
                <p className="mt-1.5 font-mono text-xxs text-ink-muted">
                  References: {result.references.map((r) => r.id).join(", ")}
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        <p className="mt-5 text-xs leading-relaxed text-ink-muted">
          Integration surfaces: REST API (shown above) and an MCP server
          exposing reason, parseRule, listRules, getMemoryGraph and
          listAuditEntries as tools. Authentication via workspace API keys.
        </p>
      </div>
    </ReferenceProvider>
  );
}
