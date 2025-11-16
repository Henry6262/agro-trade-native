# Admin Dashboard Project Guide

**Last Updated**: 2025-11-13  
**Service**: `admin-dashboard/` (Vite + React + TypeScript)  
**Contacts**: Frontend/admin chapter

---

## Overview
- Control tower UI for matching buyers/sellers, managing trade operations, inspections, and transport.
- Vite dev server (ports 5173/5175), React Query for data, modular features under `src/features`.

---

## Directory Structure
```
admin-dashboard/
├── src/
│   ├── components/             # Shared UI primitives
│   ├── config/                 # API endpoints, runtime config
│   ├── features/
│   │   ├── matching/           # Matching dashboard (panels, modals)
│   │   ├── trade-operations/   # Trade detail tabs, negotiations
│   │   ├── inspections/        # Inspector workflows
│   │   ├── transport/          # Transport management modals
│   │   └── operations/         # Cross-domain operations panels
│   ├── pages/                  # Route-level screens
│   ├── services/               # API client, caching, auth
│   ├── types/                  # Shared interfaces (listings, transport, etc.)
│   └── assets/                 # Static media (maps, icons)
├── public/                     # Static served assets
├── scripts/                    # Build/deploy helpers (if any)
└── vitest.config.ts / tsconfig / eslint configs
```

_Auto inventory_: `docs/handbook/generated/admin-dashboard-features.md` lists `src/features/*` folders, and `docs/handbook/generated/admin-dashboard-pages.md` inventories route-level files under `src/pages/`. Run `node scripts/atctl.mjs docs --sync` after reorganizing features.

---

## Commands
```bash
cd admin-dashboard
npm install           # once per clone
npm run dev           # Vite dev server (hot reload)
npm run build         # Production bundle
npm run preview       # Preview build locally
npm run test          # Vitest + Testing Library (if suites exist)
```

Environment variables pulled from `.env` (Vite prefix `VITE_`). Ensure backend API URL aligns with `src/config/api.ts`.

---

## Architecture Notes
- **Feature-first**: Each `src/features/<domain>` folder owns its data hooks, components, and local types.
- **Shared logic**: `src/services/api.ts` centralizes fetch wrappers; keep DTOs aligned with backend responses.
- **UI primitives**: place common buttons, badges, layout components under `src/components/common/` (new `ExpiryBadge.tsx` lives here).
- **Routing**: `src/pages/*` plug into React Router; avoid business logic at the page level.

---

## Testing Expectations
- Use Vitest + Testing Library; mirror component names (`Component.test.tsx`).
- For data-heavy flows, add integration-like tests using MSW stubs if possible.
- Snapshot tests acceptable for static layouts, but prioritize behavior.

---

## Integration Touchpoints
- Calls backend via `api.ts` (REST). Keep endpoints documented in module README or feature spec.
- Map components may rely on Mapbox/Leaflet tokens; document env vars in `.env.example`.
- Transport/inspection flows depend on backend negotiation expiry rules—sync with backend doc when changing statuses.

---

## Developer Quick Start

### First-Time Setup (5 minutes)
```bash
cd admin-dashboard
npm install
npm run dev  # Opens at http://localhost:5173
```

Navigate to `http://localhost:5173/operations/:id` (replace `:id` with a valid trade operation ID from your backend).

### Common Development Tasks

**Add a New Validation Rule:**
- Edit `src/utils/workflowValidation.ts`
- Add new check to `WorkflowValidationResult` interface
- Implement logic in `validateWorkflowComplete`
- Use in `TradeFinalizationPanel`

**Add a New Panel:**
- Create component in `src/features/operations/components/YourPanel/`
- Import in `TradeOperationDetail.tsx`
- Pass `tradeOperationId` and refresh callback

**Trigger Parent Refresh:**
- Use `refreshData()` callback from `TradeOperationDetail`
- Call after mutations (POST/PUT/DELETE) to keep UI in sync

### SHADCN UI Components

Admin dashboard uses shadcn/ui for consistent, accessible components:

**Installed Components:**
- Button (`@/components/ui/button`) – variants: default, destructive, outline, ghost, link
- Card (`@/components/ui/card`) – with Header, Title, Description, Content, Footer
- Dialog (`@/components/ui/dialog`) – accessible modals
- Badge (`@/components/ui/badge`) – status indicators
- Table (`@/components/ui/table`) – data tables
- Input, Select, Label – form controls
- Tabs, Sheet, Dropdown Menu

**Install Additional Components:**
```bash
npx shadcn@latest add [component-name]  # e.g., toast, form, calendar
```

**Import Aliases:**
All imports use `@/*` path mapping (e.g., `import { Button } from '@/components/ui/button'`).

**Example Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

<Card>
  <CardHeader>
    <CardTitle>Panel Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="outline">Action</Button>
  </CardContent>
</Card>
```

Detailed setup guide archived in `docs/archive/admin-dashboard/2025-11/SHADCN_SETUP_GUIDE.md`.
Developer quick start archived in `docs/archive/admin-dashboard/2025-11/DEVELOPER_QUICK_START.md`.

---

## Maintenance
- Run `npm run lint` (or `npm run test -- --runInBand` if tests) before PR.
- Update `docs/features/*` when UI flows change.
- Document new shared components in `docs/HANDBOOK.md#project-map` or link from this page.
