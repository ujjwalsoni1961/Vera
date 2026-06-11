# Vera

An AI agent for logistics that does the work and shows its reasoning.

Vera turns operational data and plain-English business rules into verified
decisions. Operators write rules in their own words ("hazmat must not pass
through residential zones"). A language model translates rules and incoming
disruption messages into structured facts and constraints — and that is all it
does. Every decision is then made by a deterministic constraint solver (Z3)
that checks each candidate plan against every rule, names the exact rule any
invalid option violates (unsat core), and ranks the valid ones. The same input
always produces the same output, and every decision carries a complete
reasoning trace.

Vera is developed and operated by [Nex0 Oy](https://nex0.tech) (Finland,
Business ID 3589366-2). It has been in production with paying customers since
2025.

**Live demonstration console:** https://vera.nex0.tech
(synthetic demonstration workspace; see [Scope of this repository](#scope-of-this-repository))

## Why this architecture

Pure-LLM agents are probabilistic: they cannot guarantee that a hazmat truck
is never routed through a residential zone, and their "reasoning" is a
narrative, not a proof. Classical rule engines are deterministic but rigid:
rules are configured by specialists and unstructured inputs never reach them.
Vera combines both and discards the weaknesses:

- **Plain-English rule capture.** Operators author and change rules
  themselves; schema-validated translation makes them machine-checkable.
- **Decisions are computed, not generated.** A deterministic solver makes
  every decision; the LLM only translates language in and out. Hallucination
  is structurally excluded from the decision path.
- **Explanation is a proof, not a story.** Every rejection names the exact
  rule and facts that caused it. The trace is stored as a permanent audit
  record.
- **Operational memory.** Rules, facts and past decisions accumulate in a
  knowledge graph.
- **Configurable autonomy.** Suggest, approve, or autonomous — per decision
  class, with human approval as the default.

## System layers

| Layer | Technology | Job |
| --- | --- | --- |
| Data ingestion | REST APIs to customer systems | Jobs, routes, status, timing from the customer's operational system; TMS/ERP, EDI and email connectors on the integration roadmap |
| Language in/out | LLM (model-agnostic) + schema validation (Pydantic) | Plain-English rules and messy disruption messages → structured facts and constraints; solver results → readable reasoning steps. The LLM never makes the final decision |
| Memory | Knowledge graph (Neo4j) + PostgreSQL + vector index | Rules, facts, relationships and decision history stored exactly; semantic recall of relevant rules |
| Formal reasoning (core) | Constraint solver (Z3) | Checks feasibility of every plan against every rule, identifies the exact violated rule (unsat core), ranks valid options. Deterministic: same input → same output |
| Agent / orchestrator | MCP tool calls | Observe → reason → decide → act loop; calls route optimizer, notifications, TMS. Autonomy configurable: suggest / approve / autonomous |
| Delivery | Docker, REST API + MCP server | Runs as the product UI and as a reusable component other systems can call |

See [docs/architecture.md](docs/architecture.md) for the full design.

## Scope of this repository

This repository contains:

1. **The Vera operator console** — the production web UI (Next.js/TypeScript):
   agent thread with live reasoning panel, rulebook, memory graph, audit log,
   developer surface and workspace settings. The public deployment runs a
   self-contained demonstration workspace with synthetic data modeled on our
   field-service deployments; customer workspaces and customer data are never
   part of this repository.
2. **The public product documentation** — architecture, API and MCP
   reference, deployment, validation evidence, security and data governance.

The core reasoning engine (`vera-engine`) is proprietary to Nex0 Oy and lives
in a private repository; it is deployed as a containerized service. Its REST
and MCP interfaces are open and documented here in full — this is deliberate:
open interfaces eliminate vendor lock-in, while the proprietary core sustains
the business that funds development. Access to the private repository can be
arranged for reviewers and auditors under NDA (contact below).

## Documentation

| Document | Contents |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Components, data flow, decision path, determinism guarantees |
| [docs/api-reference.md](docs/api-reference.md) | REST API and MCP server reference, authentication, autonomy configuration |
| [docs/deployment.md](docs/deployment.md) | Container layout, docker-compose, sizing, model endpoints, EU-region hosting |
| [docs/validation.md](docs/validation.md) | Technical readiness evidence: production deployments, evaluation suite, determinism and solver benchmarks |
| [docs/security-and-data-governance.md](docs/security-and-data-governance.md) | GDPR, EU AI Act position, encryption, access control, data ownership |
| [docs/model-card-language-layer.md](docs/model-card-language-layer.md) | Model card for the language layer: supported models, validation, limitations |
| [docs/demo-walkthrough.md](docs/demo-walkthrough.md) | Scripted walkthrough of the public demonstration console |
| [CHANGELOG.md](CHANGELOG.md) | Release history since 2025 |

## Quick start (console)

```bash
npm install
cp .env.example .env.local   # set engine mode and model endpoint
npm run dev
```

`NEXT_PUBLIC_ENGINE_MODE` selects the engine binding:

- `live` — the console calls the reasoning pipeline (LLM translation +
  Z3 verification) over REST. Default in deployed environments.
- `mock` — seeded in-process engine; deterministic and offline. Used for
  UI development and automated tests.

Both modes share identical TypeScript types (`src/lib/engine-core/types.ts`),
so the UI cannot drift from the engine contract.

## Reasoning as a component

The same engine that powers the console is callable from other systems:

```
POST /v1/reason            natural-language task → verified Decision with trace
POST /v1/plans/evaluate    candidate plan → SAT/UNSAT per rule, unsat core
POST /v1/rules/parse       plain-English rule → structured, machine-checkable form
```

plus an MCP server exposing the same operations as tools for agent
frameworks. See [docs/api-reference.md](docs/api-reference.md).

## Status

- In production with two paying customers (Finnish field-service operators)
  since 2025 — dispatch, routing and disruption handling.
- Validation evidence, including the schema-constrained extraction evaluation
  suite and solver determinism benchmarks, is documented in
  [docs/validation.md](docs/validation.md).

## Contact

Nex0 Oy — Helsinki, Finland
- Commercial: Eerika Patrakka (CEO)
- Technical: Ujjwal Soni (Founding Engineer)
- Web: https://nex0.tech

© Nex0 Oy. Console source published for evaluation; see LICENSE. The Vera
reasoning engine is proprietary software of Nex0 Oy.
