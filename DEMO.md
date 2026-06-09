# Vera — Demo Walkthrough

Four scenarios are wired as one-tap chips on the Overview page. Each exercises a
different path through the neuro-symbolic pipeline. All outcomes are computed
deterministically from seed data — they are reproducible.

---

## 1. Route feasibility (the flagship scenario)

> **"Analyze Cargo Voyage-402 and determine whether it can safely transit the
> Brenner Pass route after the reported disruption."**

**What happens**

| Stage | Result |
|-------|--------|
| Parse (LLM) | `intent: route_feasibility`, `shipmentName: Voyage-402`, `routeName: Brenner Pass Corridor`, `disruptionName: Brenner Pass Rockslide` |
| Tools | Shipment, Route, Risk services queried |
| Memory | Retrieves *"Brenner Pass rockslide — Q4 mitigation"* |
| Validation (z3) | **Transit Time ≤ 15h** vs actual **17h** → **FAIL (unsat)**; Temperature ≤ 5°C vs 4°C → PASS; availability/zones → PASS |
| Recommendation | **Review required** — reroute via the **Tauern Alternative Corridor** (14h, within limit); requires operations sign-off |

This is the canonical proof that the **LLM does not decide** — the rockslide
extended the Brenner corridor to 17h, the solver proves it violates the cargo's
15h transit limit, and the system recommends a compliant alternative.

---

## 2. Disruption impact

> **"Which shipments are affected by the Rotterdam port disruption?"**

Resolves the Rotterdam Port Disruption, runs the Customer Impact service, and
reports affected customers/shipments with service-level (SLA) breach risk.
Surfaces the *"Rotterdam labor action — feeder fallback"* memory.

---

## 3. Thermal compliance

> **"Which deliveries violate thermal constraints today?"**

Scans every temperature-controlled shipment and validates each against its
thermal envelope with z3. **Voyage-733** (measured 6°C against a 2°C maximum) is
flagged as a **breach**, triggering a hold-and-inspect recommendation referencing
the reefer thermal-excursion playbook.

---

## 4. Customer impact (hypothetical)

> **"Show all affected customers if Route Alpha becomes unavailable."**

Demonstrates customer-impact resolution and service-level analysis across the
connected systems.

---

## What to look for

- **Reasoning Trace panel** — the constraint table with Expected / Actual /
  PASS-FAIL and the solver proof line. This is the symbolic core.
- **Structured Logic panel** — the raw JSON the LLM produced. Note it contains
  only intent + entities, never a decision.
- **Performance budget** — the *deterministic core* time (well under 4s); LLM
  extraction latency is shown separately and transparently.
- **Human Approval workflow** — appears whenever a recommendation requires
  sign-off (reroutes, thermal holds).
- **Audit Trail** — every step recorded.
