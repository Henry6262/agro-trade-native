# Dependencies

## Critical Path
```
EP-01 Backend Rulebook & Structure
   ↓
EP-02 Backend APIs → Mobile Integration
   ↓
EP-03 Mobile App Live Endpoint Wiring
```
Supporting tracks:
- EP-04 Automation/Background Services depends on EP-01 for structure but can start in parallel after rulebook is defined.
- EP-05 QA Harness depends on EP-02 (API contracts) and EP-04 (automation) to avoid writing tests against mocks.

## Notes
- EP-03 cannot begin until EP-02 completes (needs real endpoints + contracts).
- EP-04 job wiring may influence EP-02/03 timelines if automation endpoints are needed.
- EP-05 should start once APIs are stable enough to test end-to-end.
