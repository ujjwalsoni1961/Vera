# Vera

An AI agent for logistics that does the work and shows its reasoning.

Vera takes operational tasks in plain language — "Port of Rotterdam is on
strike until Thursday — handle today's affected shipments" — pulls the
relevant shipments, applies the workspace rulebook, and recommends an action
with a complete, referenced reasoning trace. Decisions are derived by a
symbolic solver over your rules; the language model only reads and explains.

## Product surfaces

| Surface | What it does |
| --- | --- |
| **Agent** | Task thread plus a live reasoning panel. Steps stream in with clickable reference chips (`R7`, `Shipment-402`) that resolve to the exact rule or fact used. Ends in a recommended action with Approve / View reasoning / Modify. |
| **Rulebook** | Plain-English business rules with their machine-checkable structured form. Add a rule in natural language; Vera parses it, shows the derived structure for confirmation, then saves it. |
| **Memory** | The workspace knowledge graph: shipments, routes, zones, carriers, customers and rules, with their relationships. |
| **Audit** | Every decision with its full reasoning trace, stored permanently. |
| **Developers** | The same reasoning as a component other systems can call — `POST /v1/reason` over REST, plus an MCP server. |
| **Settings** | Connected systems (TMS / ERP / Telematics), per-action autonomy (Suggest / Approve / Autonomous), EU data residency. |

## Architecture

```
Task (natural language)
   │
   ▼
LLM parser (MiniMax-M3)        — reads and explains; never decides
   │  structured intent
   ▼
Symbolic solver (Z3)           — applies the rulebook, derives the decision
   │  decision + trace with references
   ▼
UI / REST / MCP                — same Decision type everywhere
```

The typed engine facade (`src/lib/engine.ts`) has two modes with identical
types, selected by `NEXT_PUBLIC_ENGINE_MODE`:

- `mock` — seeded in-process engine; deterministic, instant, demo-safe.
- `live` — HTTP calls to `/api/v1/*`, which run the MiniMax-M3 + Z3 pipeline.

## API

```
POST /v1/reason          { task, context } → Decision (summary, action, references, steps, status)
POST /v1/rules/parse     { text }          → ParsedRule (structured form for confirmation)
GET  /v1/rules                             → Rule[]
GET  /v1/memory/graph                      → MemoryGraph
GET  /v1/audit                             → AuditEntry[]
```

## Running locally

```bash
npm install
npm run dev                       # mock mode by default
```

For live mode, set in `.env.local`:

```
NEXT_PUBLIC_ENGINE_MODE=live
MINIMAX_API_KEY=...
MINIMAX_API_BASE=https://api.minimax.io/v1
MINIMAX_MODEL=MiniMax-M3
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion · React Flow ·
z3-solver (WASM) · MiniMax-M3
