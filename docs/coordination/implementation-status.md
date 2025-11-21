# Implementation Status Tracker

**Last Updated**: 2025-11-15  
**Status**: Complete for WORKFLOW-001..003  
**Related**: `docs/runbooks/plan-mode.md`, `docs/standards/ai-collaboration.md`, `docs/coordination/automated-workflow-initiative.md`

---

## Usage
- Update this table after every story. Include test evidence, doc links, and pending follow-ups.
- Keep entries sorted by epic/story ID.
- If a story spans multiple sessions, append dated notes under “Details”.

---

## Stories
| ID | Title | Status | Owner | Last Update | Details |
|----|-------|--------|-------|-------------|---------|
| `WORKFLOW-001` | Automated documentation catalog & stray detection | Done | AI Agent | 2025-11-14 | `docs/coordination/docs-catalog.json`, `docs/coordination/docs-strays.md`, AGENTS/HANDBOOK updated |
| `WORKFLOW-002` | AI collaboration charter + Plan Mode runbook + status tracker | Done | AI Agent | 2025-11-15 | Docs created (`docs/standards/ai-collaboration.md`, `docs/runbooks/plan-mode.md`, `docs/coordination/implementation-status.md`); enforcement wired via `atctl check`; blueprint: `docs/blueprints/workflow/WORKFLOW-002.md` |
| `WORKFLOW-003` | Legacy Markdown migration into handbook/archive | Done | AI Agent | 2025-11-15 | Root, admin-dashboard, backend, front-end, and Abu Dhabi docs archived under `docs/archive/*/2025-11/`; stray report clean; blueprint: `docs/blueprints/workflow/WORKFLOW-003.md` |
| `MOB-001` | Mobile onboarding refactor (Page → Section → Feature) | In Progress | Mobile squad | 2025-11-17 | Shared onboarding modules moved to `pages/Onboarding/features/shared/` & `pages/Onboarding/components/shared/`; transporter Jobs/Bidding/Fleet/Offers/Transfers migrated to `pages/Dashboard/sections/Transporter/features/{Jobs,Bidding,Fleet,Offers,Transfers}/`; inspector Active + Available Jobs now live under `pages/Dashboard/sections/Inspector/features/{ActiveJob,AvailableJobs}/`; buyer Orders + Requests + RequestCreation features rebuilt with dedicated services/hooks/components. 2025-11-17: backend rulebook + lint enforcement landed (`node scripts/check-backend-rules.mjs`, `cd backend && npm run lint`) so features can consume compliant APIs. 2025-11-17: transporter bidding summary now consumes `/transport/me/analytics` through `transportService.getMyAnalytics`, removing placeholder stats. 2025-11-17: seller dashboard gained a dedicated Timeline feature powered by `/seller/timeline` (new `sellerService`, hook, and component under `pages/Dashboard/sections/Seller/features/Timeline`). 2025-11-17: Seller Trades feature now uses `/seller/trades` + `/seller/stats` (new service/hook) so earnings summary + trade cards no longer rely on mocks. 2025-11-17: Seller Offers hook now fetches from `/seller/offers` via `sellerService`, keeping stats/offer cards in sync with backend while mutations still call negotiations endpoints. 2025-11-17: Buyer Requests feature now uses React Query + `buyerService.getMyBuyListings()` so requests/offer drawers reflect live backend data. 2025-11-17: Inspector Available Jobs now uses React Query + `inspectionService.getInspectorMissions` (no mock fallback) so cards/map always reflect live missions. 2025-11-17: Buyer Orders feature now sources trade operations/statistics/offers via React Query + `buyerService`, replacing mock incoming offers and manual fetch logic. 2025-11-17: Transporter Fleet now hits `/transport-company/me/fleet` (new backend endpoint) so stats/cards/drivers come from real transporter-company data instead of mocks. Blueprint: `docs/blueprints/mobile/MOB-001.md` |
| `TRADE-OPS-001` | Inspection Orchestration – Location-Aware Inspection Workflow | Not Started | TBD | 2025-11-15 | Auto-create inspections on offer acceptance, inspector assignment with proximity, transport gating until verification; blueprint: `docs/blueprints/trade-operations/TRADE-OPS-001.md`; planned feature doc: `docs/features/planned/INSPECTION_ORCHESTRATION_PLAN.md` |

---

## Notes
- Reference relevant blueprints in the details column (add links when available).
- Attach test/CI evidence as markdown bullet lists beneath the table if lengthy.
- Archive completed stories in a separate section once the epic closes.
