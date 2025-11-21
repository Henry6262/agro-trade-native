# Mobile Refactor & Integration Initiative

## Vision
Unify backend and mobile app workflows under the same high standards already applied to the frontend, so that:
- The backend/service layer follows the same Page→Section→Feature discipline (rulebooks, lint, automation).
- The mobile app consumes real backend endpoints instead of mock data, with consistent contracts and QA coverage.
- Multi-agent contributors can pick up any epic, follow the documented workflow, and keep progress transparent.

## Objectives
1. Backend structure overhaul (rulebook, code layout, lint/tests).
2. Service/API stabilization (+ automated scripts, Puppeteer helpers).
3. Mobile app integration with live backend (replace mocks, reuse shared DTOs).
4. Automation/QA harness (background jobs, monitoring, regression tests).
5. Governance/DX improvements (status tracking, dependency chart, glossary).

## Success Criteria
- Backend repo has enforced rulebooks + documentation (mirroring frontend).
- Mobile app hits production-ready backend endpoints end-to-end (no mocks left).
- All epics report progress weekly via `status.md` + `DAILY_LOG.md`.
- Each epic has Definition of Done, owner, milestone checklist.
- Dependencies are respected: no epic starts before prerequisites complete.

## Key Links
- Workflow rules: `workflow.md`
- Current status: `status.md`
- Dependencies: `DEPENDENCIES.md`
- Glossary: `GLOSSARY.md`
- Daily log: `DAILY_LOG.md`
- Epic specs: `epics/`
- Backlog ideas: `backlog.md`
