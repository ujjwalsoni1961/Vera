"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { getMemoryGraph, type Entity, type MemoryGraph } from "@/lib/engine";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────────
// Memory — the workspace knowledge graph. Entities and rules as nodes,
// operational relationships as edges. Click a node for details.
// ────────────────────────────────────────────────────────────────────────────

const TYPE_ORDER: Entity["type"][] = [
  "port",
  "zone",
  "route",
  "shipment",
  "carrier",
  "customer",
  "rule",
];

const TYPE_COLORS: Record<string, string> = {
  port: "#D97706",
  zone: "#DC2626",
  route: "#2563EB",
  shipment: "#18181B",
  carrier: "#52525B",
  customer: "#16A34A",
  rule: "#7C3AED",
};

function layout(graph: MemoryGraph): Node[] {
  const byType = new Map<string, Entity[]>();
  for (const n of graph.nodes) {
    const list = byType.get(n.type) || [];
    list.push(n);
    byType.set(n.type, list);
  }
  const nodes: Node[] = [];
  let col = 0;
  for (const type of TYPE_ORDER) {
    const list = byType.get(type);
    if (!list) continue;
    const x = col * 290;
    const totalH = (list.length - 1) * 96;
    list.forEach((entity, i) => {
      nodes.push({
        id: entity.id,
        position: { x, y: i * 96 - totalH / 2 + 300 },
        data: { label: entity.id, entity },
        style: {
          width: 168,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid #ECECEC",
          background: "#FFFFFF",
          fontSize: 12,
          color: "#18181B",
          boxShadow: "none",
        },
      });
    });
    col += 1;
  }
  return nodes;
}

export function MemoryGraphView() {
  const [graph, setGraph] = useState<MemoryGraph | null>(null);
  const [selected, setSelected] = useState<Entity | null>(null);

  useEffect(() => {
    getMemoryGraph().then(setGraph);
  }, []);

  const nodes: Node[] = useMemo(() => {
    if (!graph) return [];
    return layout(graph).map((n) => ({
      ...n,
      data: {
        ...n.data,
        label: (
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                background: TYPE_COLORS[(n.data as { entity: Entity }).entity.type] || "#A1A1AA",
              }}
            />
            <span className="truncate font-mono text-[11px]">{n.id}</span>
          </span>
        ),
      },
    }));
  }, [graph]);

  const edges: Edge[] = useMemo(() => {
    if (!graph) return [];
    return graph.edges.map((e, i) => ({
      id: `e${i}`,
      source: e.source,
      target: e.target,
      label: e.relation,
      labelStyle: { fontSize: 9, fill: "#A1A1AA" },
      labelBgStyle: { fill: "#FAFAFA" },
      style: { stroke: "#D4D4D8", strokeWidth: 1 },
      type: "default",
    }));
  }, [graph]);

  const onNodeClick: NodeMouseHandler = (_, node) => {
    setSelected((node.data as { entity: Entity }).entity);
  };

  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1">
        <div className="absolute left-6 top-5 z-10">
          <h1 className="text-lg font-semibold tracking-tight text-ink">
            Memory
          </h1>
          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink-secondary">
            Rules, entities and relationships the agent reasons over. Click a
            node for details.
          </p>
        </div>
        <div className="absolute bottom-5 left-6 z-10 flex flex-wrap gap-x-4 gap-y-1.5">
          {TYPE_ORDER.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-xxs capitalize text-ink-secondary">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: TYPE_COLORS[t] }}
              />
              {t}
            </span>
          ))}
        </div>
        {graph && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.3}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            nodesDraggable
          >
            <Background color="#E4E4E7" gap={24} size={1} />
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
        )}
      </div>

      <aside
        className={cn(
          "w-80 shrink-0 overflow-y-auto border-l border-line bg-surface px-5 py-5 max-md:hidden",
          !selected && "flex items-center justify-center"
        )}
      >
        {selected ? (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[13px] font-medium text-ink">
                {selected.id}
              </span>
              <span className="text-xxs capitalize text-ink-muted">
                {selected.type}
              </span>
            </div>
            <dl className="mt-4 space-y-2.5">
              {Object.entries(selected.attrs).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xxs capitalize text-ink-muted">
                    {k.replace(/_/g, " ")}
                  </dt>
                  <dd className="mt-0.5 text-[13px] leading-relaxed text-ink">
                    {String(v)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t border-line pt-3 text-xxs leading-relaxed text-ink-muted">
              Connections:{" "}
              {graph?.edges
                .filter(
                  (e) => e.source === selected.id || e.target === selected.id
                )
                .map(
                  (e) =>
                    `${e.relation} ${
                      e.source === selected.id ? e.target : e.source
                    }`
                )
                .join(" · ") || "none"}
            </p>
          </div>
        ) : (
          <p className="px-4 text-center text-[13px] text-ink-muted">
            Select a node to inspect its attributes and connections.
          </p>
        )}
      </aside>
    </div>
  );
}
