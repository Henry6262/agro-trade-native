# EP-05 – QA Harness & Regression Testing

## Outcome / Definition of Done
- Automated QA coverage exists for backend services + mobile flows (buyer, seller, transporter, inspector, onboarding).
- Test data seeding + teardown scripts are published so anyone can run suites locally or in CI.
- QA agents can trace coverage gaps via `status.md` updates and blueprint notes.

## Deliverables
- Central QA plan (`docs/features/implemented/mobile-qa-plan.md`) referencing suites + scenarios.
- Jest/RNTL suites for mobile, Jest/Vitest for shared logic, and e2e/API suites for backend (`npm run test:e2e`).
- GitHub Actions (or equivalent) job definitions for running tests on PRs/nightly.
- Blueprint: `docs/blueprints/mobile/EP-05-qa.md`.

## Owner(s)
- Primary: @qa
- Support: @backend, @frontend

## Dependencies
- Requires EP-02 (stable APIs) and EP-04 (automation jobs) so tests target real flows. EP-03 progress informs which UI features are wired.

## Milestones / Task List
- [ ] Define coverage matrix (features × test type) and prioritize critical flows.
- [ ] Set up data seeding fixtures for each role and ensure cleanup scripts exist.
- [ ] Implement automated suites (backend e2e + mobile integration) with CI integration.
- [ ] Document how to run tests locally and how failures are triaged.
- [ ] Keep `status.md`/`DAILY_LOG.md` synchronized as suites land.

## Notes / Links
- Align with `docs/standards/code-quality.md` expectations (real tests only, no dummy coverage).
- Pair with EP-03 to create shared utilities/mocks for React Native Testing Library.
