# Vera v2 rebuild — agent-first, Pinecone-console aesthetic

Spec: Chandani's 2026-06-10 prompt + AIoD proposal PDF. No emojis, no badges, indigo accent #2563EB, white/#FAFAFA, Inter + JetBrains Mono, shadcn-style components.

- [ ] M1: deps (framer-motion, reactflow, radix popover/dropdown), design tokens, fonts, ui primitives (button/card/popover/table/dot), new shell (sidebar: Agent/Rulebook/Memory/Audit/Developers/Settings + topbar) — push
- [ ] M2: shared types (Rule/Entity/ReasoningStep/Decision/AuditEntry), lib/engine.ts (mock + live via ENGINE_MODE), Rotterdam seed (rules R1–R7+, entities, audit entries), /api/v1/reason — push
- [ ] M3: Agent Workspace hero: two-pane, task thread + streaming reasoning panel, reference chips w/ popovers, recommended-action card (Approve/View reasoning/Modify), solver caption — push
- [ ] M4: Rulebook: table + add-rule parse→confirm→save — push
- [ ] M5: Memory knowledge graph (reactflow) + node detail panel — push
- [ ] M6: Audit table + row expand (reuse reasoning panel); Developers (snippet + Run); Settings (autonomy, connected systems, EU residency) — push
- [ ] M7: tone audit (no emojis/badges), responsive, build clean, remove dead code (old dashboard/KPIs) — push
- [ ] M8: deploy to Vercel (same project), verify flagship Rotterdam scenario live — needs approval

Keep: z3engine, minimax parser, repositories/tools (rewire as live mode). Old pages (tasks/tools/agent-runs/KPIs) removed.
Flagship: "Port of Rotterdam is on strike until Thursday — handle today's affected shipments." → exact steps from spec → Route B for Shipment 402 → Approve → audit.
