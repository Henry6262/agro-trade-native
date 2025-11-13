# Transport Flow Plan

## Why
Inspections now gate sellers, but once they pass we still don’t have a reliable way to move grain. Transport requests must be created automatically, transporters need a clear bidding interface, and admins should be able to accept bids and track jobs without leaving the trade view. Today’s UI only exposes a placeholder “Create request” button inside the Trade Operation detail, and the data it posts (static weight, no pickup points) isn’t connected to live trade data, so the flow breaks down immediately.

## Current Gaps
1. **Triggering**
   - No automatic creation of transport requests when sellers are verified; panel requires manual click with dummy payload.
   - Pickup points/total weight/delivery deadline aren’t derived from actual sellers/buyer info.
2. **Transporter workflow**
   - Backend has full bidding/job services (`TransportService`, `TransportBiddingController`), but front-end only shows bids inside the Trade Operation panel and a separate legacy Transport page that calls older endpoints (`/transport-requests` etc.) not wired to the Nest controllers.
   - Transporters aren’t being notified; there’s no UI for them yet (future mobile app).
3. **Admin UX**
   - Matching dashboard has no visibility into transport status; only the Trade Operation detail shows the panel.
   - No queue/overview for all transport requests similar to inspections.
4. **Phase progression**
   - Trade operation phase isn’t advanced when transport is assigned/completed; blocking logic is ad hoc (hasCompletedInspections boolean).

## Proposed Flow
1. **Auto-create request**
   - When total verified quantity meets buyer demand (or admin clicks “Ready for transport”), call a new backend helper to create a transport request:
     - Pickup points = each accepted seller (lat/lng, quantity).
     - Delivery point = buyer delivery address.
     - totalWeight = sum of agreed quantities.
     - deliveryDeadline = buyer `neededBy`.
   - Store transport request on the trade operation, set phase to `TRANSPORT_MATCHING`.
2. **Bid intake**
   - Expose `/transport/requests/:tradeOperationId` via trade-operation summary so Matching dashboard and trade detail can show status.
   - Add notification pipeline (later) so transporters know about new requests; for now, front-end can treat request as “open”.
3. **Admin UI**
   - **Matching dashboard**: add a transport panel (mirroring inspection queue) showing current transport status, CTA to create request, and list of bids.
   - **Trade Operation detail**: wire `TransportManagementPanel` to real data, showing pickup points, weight, bids, and job progress.
   - **Transport overview page**: replace legacy axios calls with the Nest `/transport/...` endpoints, filter by status, and allow bid review/assignment globally.
4. **Bid acceptance**
   - Accepting a bid should call `TransportService.acceptBid`, update transport request/job, and advance trade phase to `IN_TRANSIT`.
   - When job completes, mark phase as `DELIVERY`/`COMPLETED` depending on payment state (future work).

## Action Plan
1. **Backend plumbing**
   - Add helper on trade operations service to build pickup points + total weight from sellers.
   - Expose `transportRequest`, `transportBids`, `transportJob` in trade operation summary/DTOs.
   - Guard request creation so it only fires when sellers are verified; optionally auto-create from seller acceptance.
2. **Frontend data**
   - Extend `tradeOperationService.getById` response types to include transport data (mirroring inspection work).
   - Update `TransportManagementPanel` to consume the new shape (no mock data).
   - Replace legacy Transport page API calls with `inspectionService`-style typed client targeting `/transport`.
3. **UI updates**
   - Add transport queue card to Matching dashboard (like inspections).
   - In TradeDetails, show banners/CTAs when transport is waiting to be created or bids are pending.
   - For overview page, display all requests, filter by status, and embed the bid review modal using live endpoints.
4. **Follow-up**
   - Notifications for transporters once mobile app is ready.
   - Transporter portal (React Native) fed by `/transport/requests/available`, `/transport/bids`.
   - Phase transitions + analytics once transport jobs complete.
