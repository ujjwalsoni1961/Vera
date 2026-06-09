# Vera — Logistics Intelligence Platform

Build a production-quality neuro-symbolic enterprise B2B SaaS demo.
Stack: Next.js (App Router) + TypeScript + Tailwind. z3-WASM validation. MiniMax M3 parser.
Theme: Pinecone-style bright/clean. Push each milestone to main on ujjwalsoni1961/Vera. Deploy to Vercel (project: vera).

## Milestones
- [ ] M1 — Scaffold + design system (Next.js, fonts, bright theme, sidebar+topbar shell). First Vercel deploy.
- [ ] M2 — Repository architecture + InMemoryMockRepository + realistic seed data.
- [ ] M3 — Tool layer (Shipment/Route/Risk/CustomerImpact) + execution framework.
- [ ] M4 — LLM parser (MiniMax M3) NL -> structured JSON logic (+ deterministic fallback).
- [ ] M5 — Deterministic validation layer (z3-WASM) + reasoning traces.
- [ ] M6 — Orchestration pipeline (NL->parse->tools->validate->recommend->audit->memory) <4s.
- [ ] M7 — Dashboard panels (KPI, agent exec, reasoning trace, tool exec, memory, audit, connected systems, approval).
- [ ] M8 — Demo scenario (Voyage-402/Brenner Pass), README, Dockerfile, final prod deploy.

## Key decisions
- LLM never makes operational decisions. z3 deterministic layer decides.
- z3-solver npm (WASM) inside Next API routes + pure-TS fallback.
- MiniMax M3 API key -> env var only, NEVER commit.
- Whole workflow under 4s, Vercel serverless-safe.

## Notes
- Repo was empty. Node installed to /work/tools/node (not in repo).
- API base for MiniMax: verify endpoint.
