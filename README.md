# Vera — Logistics Intelligence Platform

A production-quality, **neuro-symbolic** enterprise B2B SaaS platform for logistics
operations. Operators describe a task in natural language; Vera parses it, orchestrates
connected systems, and validates every operational constraint with a **deterministic
solver** — producing reasoning traces, recommendations, operational memory, and a full
audit trail.

> **Core principle:** The language model never makes operational decisions. It only
> extracts intent and parameters. All route approval, compliance, constraint, and risk
> decisions are made by a deterministic validation layer.

## Architecture

```
User → Natural Language → LLM Parser → Structured JSON Logic
     → Deterministic Validation Layer (z3) → Tool Execution
     → Decision Output → Audit + Memory → UI
```

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — bright, Pinecone-inspired enterprise design system
- **z3-solver** (WebAssembly) — deterministic constraint validation
- **MiniMax M3** — natural-language intent/parameter extraction
- **InMemoryMockRepository** — runs instantly, no database required (Postgres-pluggable)

## Getting started

```bash
npm install
cp .env.example .env.local   # add your MiniMax API key
npm run dev
```

Open http://localhost:3000.

## Environment

| Variable           | Description                                  |
| ------------------ | -------------------------------------------- |
| `MINIMAX_API_KEY`  | MiniMax API key for the LLM parser           |
| `MINIMAX_MODEL`    | Model name (default `MiniMax-M3`)            |
| `MINIMAX_API_BASE` | API base (default `https://api.minimax.io/v1`) |

---

_Built milestone-by-milestone. See `todo.md` for the delivery plan._
