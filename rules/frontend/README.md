# Frontend (React Native) Rulebook

**Scope**: `front-end/` mobile app  
**Related Docs**: `docs/rules/mobile-architecture.md`, `docs/handbook/projects/mobile.md`, `docs/coordination/mobile-migration-plan.md`

## Required Reading
Review every file below before planning or coding:

1. `structure.md` – Page → Section → Feature hierarchy, required folders/files, file-size caps.
2. `components.md` – Design-system usage and “presentation-only” rules.
3. `logic-and-data.md` – Hook, service, and networking responsibilities (React Query patterns).
4. `state-and-store.md` – When/how to use Zustand vs global store vs local state.
5. `design-system.md` – UI primitives available under `src/app/components/ui/` and how to extend them.
6. `shared-components.md` – How to organize reusable onboarding modules/components across roles.
7. `docs.md` – Documentation expectations (handbook updates, blueprints, status tracker).

## Checklist Before Implementation
- [ ] Read all rule files (above) during the current session.
- [ ] Confirm your plan matches the Page → Section → Feature layout.
- [ ] Ensure you know which design-system components to reuse.
- [ ] Decide where hooks/services/stores will live per the rules.
- [ ] Plan doc updates (handbook + implementation status) ahead of time.

If anything is unclear, update these rule files before touching code.
