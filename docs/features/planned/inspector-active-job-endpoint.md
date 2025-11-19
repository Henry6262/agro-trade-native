# Planned Feature: Inspector Active Job Endpoint

**Last Updated**: 2025-11-17
**Owner**: @backend

## Goal
Expose the inspector’s current assignment so the mobile Active Job tab can render without scanning the entire jobs list.

## Status
- Delivered as `GET /inspections/inspector/:inspectorId/active` (returns the in-progress mission or next scheduled mission). Mobile no longer needs to issue two separate mission queries.

## Follow-ups
- Expand response metadata (route details, inspection checklist) after we fully bridge inspection and transport modules.
