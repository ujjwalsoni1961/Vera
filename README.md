# Vera — Logistics Intelligence Platform

> A neuro-symbolic decision engine for enterprise logistics. Vera reads a
> plain-language request, orchestrates connected operational systems, and
> validates every constraint with a **deterministic solver** — producing an
> auditable, provably-correct recommendation. It is **not** a chatbot.

![status](https://img.shields.io/badge/build-passing-06966f) ![stack](https://img.shields.io/badge/Next.js-14-0B1120) ![solver](https://img.shields.io/badge/solver-z3--wasm-2548ea)

---

## The core idea: neuro-symbolic separation

Vera draws a hard line between *understanding language* and *making decisions*:

| Layer | Responsibility | Technology |
|-------|----------------|------------|
| **Neural** | Parse intent + extract entities from natural language | MiniMax-M3 (LLM) |
| **Symbolic** | Decide feasibility, compliance, routing, risk | z3-solver (SMT) — deterministic |

**The language model never makes an operational decision.** It only translates a
request into structured logic. Every outcome — pass/fail, approve/reject,
reroute — is computed by the deterministic solver from authoritative data, and
is fully reproducible and explainable.

```
User prompt
   │
   ▼  (neural)
Intent + entities  ──►  Tool orchestration  ──►  Constraint validation  ──►  Recommendation
   MiniMax-M3            Shipment/Route/Risk/        z3-solver (SMT)            deterministic
                         Customer services           PASS / FAIL proof          + audit + memory
```

---

## What it does

Type an operational task such as:

> *"Analyze Cargo Voyage-402 and determine whether it can safely transit the
> Brenner Pass route after the reported disruption."*

Vera will:

1. **Parse** the request with the LLM → `{ intent: route_feasibility, shipmentName: "Voyage-402", routeName: "Brenner Pass Corridor", … }`
2. **Orchestrate** the Shipment, Route, and Risk services to fetch live data.
3. **Retrieve** relevant operational memory (prior Brenner incidents).
4. **Validate** every constraint with z3 — e.g. `Transit Time ≤ 15h` against an actual `17h` → **FAIL (unsat)**.
5. **Recommend** a deterministic action — reroute via the Tauern corridor — with a human-approval workflow.
6. **Audit** every step in an immutable trail.

---

## Architecture

```
src/
├─ app/
│  ├─ (app)/            # Dashboard shell + pages (Overview, Tasks, Agent Runs,
│  │                    #   Tools, Memory, Audit, Settings)
│  └─ api/run/          # POST /api/run — runs the full pipeline
├─ components/
│  ├─ console/          # Interactive Task Console + ResultView panels
│  ├─ layout/           # Sidebar, Topbar, AppShell
│  └─ ui/               # Design primitives
└─ lib/
   ├─ domain/           # Domain types + realistic seed data
   ├─ repositories/     # Repository pattern · InMemoryMockRepository (Postgres-pluggable)
   ├─ tools/            # Tool framework + Shipment/Route/Risk/CustomerImpact services
   ├─ llm/              # MiniMax-M3 parser + deterministic fallback parser
   ├─ validation/       # z3-solver constraint engine + reasoning traces
   └─ orchestrator/     # End-to-end pipeline + deterministic recommendation engine
```

### Design principles

- **Repository pattern.** The app depends only on repository *interfaces*. Today
  they're backed by `InMemoryMockRepository` (runs instantly, no database). Swap
  in a PostgreSQL implementation later without touching a single caller.
- **Deterministic core.** Tool calls + validation + reasoning complete in well
  under the 4-second performance budget (~200ms in practice). The LLM
  extraction latency is surfaced transparently and separately.
- **Graceful degradation.** If the LLM is slow or unavailable, a deterministic
  parser takes over. If the z3 WASM solver can't initialise, a pure-TypeScript
  evaluator computes identical verdicts. The pipeline never breaks.
- **Full auditability.** Every parse, tool call, validation, and decision is
  recorded with a machine-checkable proof.

---

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#   set MINIMAX_API_KEY=...   (optional — falls back to deterministic parser)

# 3. Develop
npm run dev          # http://localhost:3000

# 4. Production build
npm run build && npm start
```

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `MINIMAX_API_KEY` | — | MiniMax API key for LLM parsing. If unset, the deterministic parser is used. |
| `MINIMAX_MODEL` | `MiniMax-M3` | Model used for intent extraction. |
| `MINIMAX_API_BASE` | `https://api.minimax.io/v1` | MiniMax API base URL. |
| `LLM_TIMEOUT_MS` | `12000` | Parser timeout before deterministic fallback. |
| `DISABLE_Z3` | — | Set `1` to force the deterministic evaluator instead of z3. |

---

## Docker

```bash
docker build -t vera .
docker run -p 3000:3000 -e MINIMAX_API_KEY=sk-... vera
```

---

## Demo scenarios

Four ready-to-run prompts are available as one-tap chips on the Overview page.
See [`DEMO.md`](./DEMO.md) for the full walkthrough and expected outcomes.

---

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · z3-solver (WASM) ·
MiniMax-M3 · lucide-react.
