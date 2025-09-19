# Research Findings: Trade Operation Dashboard Enhancement

## Current System Analysis

### Issue 1: Seller Location Data
**Problem**: Frontend displays "Location N/A" for sellers despite having address data
**Root Cause**: 
- Sale listings have optional lat/lng fields but not consistently populated
- Address model exists but not properly linked to all sale listings
- Frontend expects location data in specific format not being provided

**Solution**: 
- Ensure all sale listings have populated latitude/longitude
- Update API to include full address details in seller matching response
- Modify frontend to handle both address object and lat/lng coordinates

### Issue 2: Offer Modal Missing
**Problem**: "Send Offer" button exists but no modal implementation
**Current State**:
- Button triggers Alert.alert placeholder
- NegotiationService exists in backend but not called from frontend
- OfferNegotiation model ready in database schema

**Solution**:
- Create OfferModal component following drawer pattern
- Connect to /api/negotiations endpoints
- Implement offer creation, viewing, and response flows

### Issue 3: Trade Operations Not Resumable
**Problem**: Can't click on active operations to view/manage them
**Current State**:
- Operations list displays but no onPress handler opens details
- Backend has GET /api/trade-operations/:id endpoint
- No detail view component exists in frontend

**Solution**:
- Create TradeOperationDetailDrawer component
- Add navigation from operations list to detail view
- Display full operation state with action buttons
- Enable phase progression and offer management

## Business Rule Clarifications

### 1. Operation Numbering Format
**Decision**: TRADE-YYYY-MMDD-XXXX format (e.g., TRADE-2025-0914-0001)  
**Rationale**: Includes date for easy chronological sorting and daily reset of counter  
**Alternatives considered**: 
- UUID only (rejected: not human-readable)
- Sequential only (rejected: no date context)
- Category prefix (rejected: adds complexity)

### 2. Offer Expiration Time
**Decision**: 48 hours default, configurable per trade operation  
**Rationale**: Balances urgency with giving parties time to consider  
**Alternatives considered**:
- 24 hours (rejected: too short for agricultural trades)
- 7 days (rejected: market prices fluctuate too much)
- No expiration (rejected: creates stale negotiations)

### 3. Commission Structure
**Decision**: 2.5% from seller, 1.5% from buyer on completed trades  
**Rationale**: Industry standard for B2B agricultural platforms  
**Alternatives considered**:
- Flat fee (rejected: unfair for small trades)
- Subscription model (rejected: barrier to entry)
- Transport-only commission (rejected: insufficient revenue)

### 4. Transport Bidding Duration
**Decision**: Minimum 2 hours, maximum 48 hours, default 24 hours  
**Rationale**: Allows sufficient participation while maintaining momentum  
**Alternatives considered**:
- Fixed 24 hours (rejected: no flexibility)
- Open-ended (rejected: delays trade completion)
- Instant matching (rejected: reduces competition)

### 5. Payment Handling
**Decision**: Escrow model with milestone releases  
**Rationale**: Protects all parties and builds trust  
**Payment flow**:
- Buyer deposits on seller acceptance
- 50% released on pickup confirmation
- 50% released on delivery confirmation
**Alternatives considered**:
- Direct payment (rejected: high risk)
- Post-delivery payment (rejected: seller risk)

### 6. Cancellation Policies
**Decision**: Phase-dependent penalties  
**Rules**:
- Before seller acceptance: No penalty
- After acceptance, before transport: 5% penalty
- After transport assigned: 10% penalty + transport costs
- In transit: 15% penalty + all costs
**Rationale**: Progressive penalties discourage late cancellations  

### 7. Dispute Resolution
**Decision**: Three-tier system  
**Process**:
1. Automated resolution suggestions based on rules
2. Admin mediation within 24 hours
3. Third-party arbitration for high-value disputes
**Rationale**: Balances automation with human judgment

## Technical Research

### Geospatial Optimization with PostGIS
**Decision**: Use ST_DWithin for proximity queries, cluster with ST_ClusterKMeans  
**Rationale**: Native PostGIS functions outperform application-level clustering  
**Implementation notes**:
- Create spatial indexes on location columns
- Use geography type for accurate distance calculations
- Implement marker clustering at zoom levels < 10

### Update Mechanism for Trade Changes
**Decision**: Polling with optimistic UI updates  
**Rationale**: Simpler implementation, no WebSocket infrastructure needed  
**Pattern**:
```typescript
// Poll for updates every 5 seconds when on trade detail page
const { data } = useQuery(['trade', id, 'updates'], {
  refetchInterval: 5000,
  enabled: isTradeDetailPage
});
```
**Alternatives considered**:
- WebSocket/Socket.io (rejected: unnecessary complexity for current stage)
- Server-sent events (rejected: adds complexity without clear benefit)
- GraphQL subscriptions (rejected: overkill for simple updates)

### State Machine Implementation
**Decision**: XState library for TypeScript  
**Rationale**: Battle-tested, visualizable, supports guards and actions  
**Benefits**:
- Prevents invalid transitions
- Self-documenting state flow
- Built-in persistence support
**Alternatives considered**:
- Custom implementation (rejected: reinventing the wheel)
- Simple enum + switch (rejected: no transition validation)

### Offline Sync for Mobile
**Decision**: Redux-Offline with custom sync adapter  
**Rationale**: Mature solution with React Native support  
**Strategy**:
- Queue actions when offline
- Optimistic updates with rollback
- Conflict resolution: last-write-wins for non-critical, server-wins for critical
**Alternatives considered**:
- Custom queue (rejected: complex edge cases)
- No offline support (rejected: inspectors work in rural areas)

### Multi-seller Optimization
**Decision**: Greedy algorithm with distance and verification weighting  
**Algorithm**:
1. Score = (100 - distance_km) * verification_multiplier * price_factor
2. Sort by score, select top N until quantity met
3. Rebalance if one seller can fulfill entirely
**Rationale**: Simple, explainable, good enough for MVP  
**Future enhancement**: Consider vehicle routing problem (VRP) solver

### Transport Route Optimization
**Decision**: Use Google Maps Directions API with waypoints  
**Rationale**: Accurate, real-time traffic, widely trusted  
**Implementation**:
- Calculate optimal pickup order
- Display total distance and duration
- Cache routes for 1 hour
**Alternatives considered**:
- OpenStreetMap (rejected: less accurate in rural areas)
- Custom routing (rejected: extremely complex)

## Performance Optimizations

### Map Marker Rendering
**Decision**: Virtualization with react-native-super-cluster  
**Thresholds**:
- < 50 markers: Render all
- 50-500: Cluster by region
- > 500: Server-side clustering
**Rationale**: Maintains 60fps on mid-range devices

### Negotiation Updates
**Decision**: Optimistic updates with API calls  
**Rationale**: Immediate UI feedback with backend validation  
**Implementation**:
- Update UI immediately on user action
- Send API request in background
- Rollback on error with toast notification
- Use version numbers for conflict detection

### Database Query Optimization
**Decision**: Materialized views for common aggregations  
**Views to create**:
- Active trades by region
- Seller verification status
- Average prices by product/region
**Refresh strategy**: Every 15 minutes for non-critical, real-time for critical

## Security Considerations

### API Rate Limiting
**Decision**: Token bucket algorithm  
**Limits**:
- 100 requests/minute for reads
- 20 requests/minute for writes
- 5 requests/minute for trade creation
**Rationale**: Prevents abuse while allowing normal usage

### Data Access Control
**Decision**: Role-based with operation-level permissions  
**Roles**:
- Admin: Full access
- Buyer: Own trades + public seller data
- Seller: Own products + assigned trades
- Transporter: Assigned deliveries only
- Inspector: Assigned inspections only

### Audit Logging
**Decision**: Immutable event log with checksums  
**Events logged**:
- All state transitions
- Price changes
- User actions
- System decisions
**Storage**: Separate audit database table with retention policy

## Integration Points

### Existing User System
**Finding**: Current User model sufficient with role field  
**Changes needed**:
- Add trade operation relations
- Extend profile for inspectors
- No schema breaking changes

### Current Dashboard
**Finding**: OperationsScreen.tsx has basic structure  
**Integration approach**:
- Replace mock data gradually
- Keep existing UI components
- Add new drawer for map selection

### Payment Gateway
**Decision**: Stripe Connect for marketplace payments  
**Rationale**: Handles escrow, splits, and compliance  
**Alternative**: Build escrow system (rejected: regulatory complexity)

## Recommendations

1. **Start with**: Database schema and state machine
2. **MVP scope**: Single seller, single transporter initially
3. **Defer**: Complex routing optimization, ML-based matching
4. **Testing priority**: State transitions, payment flows
5. **Monitor**: Map performance, negotiation latency
6. **Document**: State machine diagram, API contracts

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| PostGIS query performance | High | Index optimization, query analysis |
| Polling overhead | Low | Smart polling (only when needed), caching |
| Map API costs | Medium | Caching, usage monitoring |
| State machine complexity | Low | Comprehensive tests, visualization |
| Offline sync conflicts | Medium | Clear conflict resolution rules |

## Next Steps

With all clarifications resolved, proceed to Phase 1:
1. Design detailed data model
2. Create API contracts
3. Write contract tests
4. Generate quickstart guide
5. Update CLAUDE.md with implementation details