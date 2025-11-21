# Planned Feature: Transporter Analytics Scoping

**Last Updated**: 2025-11-17
**Owner**: @backend / @mobile

## Background
Current analytics endpoints (`GET /transport/analytics/bid-comparison/:requestId`, `GET /transport/analytics/transporter-performance/:transporterId`) are designed for admin dashboards. Mobile transporters need scoped insights without exposing admin-only data.

## Options
1. **Scoped Existing Endpoints** – Keep URLs but enforce role-based filtering so transporters only see their own bids/performance.
2. **New Transporter-Facing Endpoints** – Add `GET /transport/me/analytics` (summary of bid win rate, average delivery time, etc.) to reduce payload size for mobile.

## Status
- 2025-11-17: Implemented scoped endpoint `GET /transport/me/analytics` returning win rate, pending bids, job stats, and recent jobs. Mobile can now display transporter KPIs without hitting admin analytics routes.

## Next Actions
- Wire mobile transporter dashboards to the new endpoint (EP-03).
- Consider additional metrics (earnings, average delivery time) once product team prioritizes them.
