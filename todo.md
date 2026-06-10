# Vera v3 — "make everything real" (Chandani feedback 2026-06-10)

## Decisions pending from Chandani
- [ ] D1: default engine mode = live? (needs rotated MiniMax key via DM)
- [ ] D2: route widget = real map vs schematic (recommended: real map)
- [ ] D3: rule import = real file parsing vs scripted (recommended: real)

## Milestones (unambiguous, starting now)
- [ ] V3-M1 Logo everywhere: transparent assets, favicon/icon, sidebar wordmark,
      agent avatar in chat, logo-based loader/thinking animation
- [ ] V3-M2 Realistic dataset: EU logistics network — real ports, plausible
      carriers/customers, ~50 shipments, lanes, relative "fresh" timestamps;
      one dataset feeds agent + memory graph + audit
- [ ] V3-M3 Settings connect popups: TMS/ERP/Telematics modal with vendor
      choices + realistic connect flow (non-functional backend)
- [ ] V3-M4 Chat upgrades: integrations icon in composer; live-feel steps
      ("Querying TMS… 12 found"); completion widgets after Approve
      (route old→new + ETA/cost delta, done-cards with concrete changes)
- [ ] V3-M5 Rulebook import flow (CSV/policy file → parsed rules → confirm)
- [ ] V3-M6 (pending D1) live mode default + thinking state
- [ ] V3-M7 (pending D2) map widget implementation choice

## Quality gates
- npx tsc --noEmit + npm run build before each commit
- Playwright screenshot pass before deploy
