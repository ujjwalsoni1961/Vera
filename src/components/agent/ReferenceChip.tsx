"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getMemoryGraph,
  listRules,
  type Entity,
  type Reference,
  type Rule,
} from "@/lib/engine";

// ── Reference data context: one load of rules + entities for chip popovers ──

interface ReferenceData {
  rules: Map<string, Rule>;
  entities: Map<string, Entity>;
}

const ReferenceContext = createContext<ReferenceData>({
  rules: new Map(),
  entities: new Map(),
});

export function ReferenceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ReferenceData>({
    rules: new Map(),
    entities: new Map(),
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([listRules(), getMemoryGraph()]).then(([rules, graph]) => {
      if (cancelled) return;
      setData({
        rules: new Map(rules.map((r) => [r.id, r])),
        entities: new Map(graph.nodes.map((n) => [n.id, n])),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ReferenceContext.Provider value={data}>
      {children}
    </ReferenceContext.Provider>
  );
}

// ── Chip ─────────────────────────────────────────────────────────────────────

function formatAttrKey(key: string): string {
  return key.replace(/_/g, " ");
}

export function ReferenceChip({ reference }: { reference: Reference }) {
  const { rules, entities } = useContext(ReferenceContext);
  const rule = reference.type === "rule" ? rules.get(reference.id) : undefined;
  const entity = entities.get(reference.id);

  const label = useMemo(() => reference.id, [reference.id]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="mx-0.5 inline-flex items-center rounded border border-line bg-page px-1.5 py-px font-mono text-xxs text-ink-secondary transition-colors hover:border-accent-border hover:bg-accent-softer hover:text-accent align-[1px]">
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        {rule ? (
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs font-medium text-ink">
                {rule.id}
              </span>
              <span className="text-xxs text-ink-muted">{rule.scope}</span>
            </div>
            <p className="text-[13px] leading-relaxed text-ink">
              {rule.naturalLanguage}
            </p>
            <pre className="overflow-x-auto rounded-md bg-page p-2.5 font-mono text-xxs leading-relaxed text-ink-secondary">
              {rule.structured}
            </pre>
          </div>
        ) : entity ? (
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs font-medium text-ink">
                {entity.id}
              </span>
              <span className="text-xxs capitalize text-ink-muted">
                {entity.type}
              </span>
            </div>
            <dl className="space-y-1">
              {Object.entries(entity.attrs).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-xs">
                  <dt className="w-32 shrink-0 capitalize text-ink-muted">
                    {formatAttrKey(k)}
                  </dt>
                  <dd className="text-ink-secondary">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="text-xs text-ink-muted">
            {reference.id} — details unavailable.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
