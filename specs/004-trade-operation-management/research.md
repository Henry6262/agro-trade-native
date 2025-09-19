# Research: Trade Operation Management & Negotiation Hub

## Overview
Research findings for implementing a centralized trade operation management system with negotiation tracking and counter-offer handling capabilities.

## Key Decisions

### 1. Update Strategy
**Decision**: Request-based updates (no WebSocket/polling)  
**Rationale**: 
- Simpler implementation and maintenance
- Lower server resource usage
- Mobile battery efficiency
- Trade negotiations don't require real-time updates (48h expiration window)
**Alternatives considered**: 
- WebSocket: Rejected due to complexity and battery drain
- Polling: Rejected due to unnecessary server load for infrequent updates

### 2. State Management
**Decision**: Use existing Zustand stores with React Query for server state  
**Rationale**:
- Already established pattern in codebase
- React Query handles caching and background refetches
- Zustand for local UI state (selected operation, filters)
**Alternatives considered**:
- Redux: Over-complex for this feature
- Context API only: Lacks caching capabilities

### 3. UI Component Architecture
**Decision**: Reuse existing drawer and modal patterns  
**Rationale**:
- Consistent UX across the app
- OfferModal already handles offer sending
- TradeCreationDrawer pattern works for detailed views
**Alternatives considered**:
- New UI patterns: Would break consistency
- Full-screen views: Poor mobile UX for quick actions

### 4. Data Model Extensions
**Decision**: Extend existing TradeOperation and Negotiation models  
**Rationale**:
- Minimal schema changes required
- Backwards compatible
- Leverages existing relationships
**Key additions**:
- Negotiation.expiresAt for 48h timeout
- Negotiation.counterOffer fields
- TradeOperation computed fields for progress

### 5. API Design
**Decision**: RESTful endpoints following existing patterns  
**Rationale**:
- Consistent with current API design
- Clear resource boundaries
- Standard CRUD operations
**New endpoints**:
- GET /trade-operations (list with filters)
- GET /trade-operations/:id/negotiations (detailed view)
- POST /negotiations/:id/counter-offer
- POST /trade-operations/:id/add-sellers

### 6. Navigation Flow
**Decision**: Tab-based navigation with drill-down  
**Rationale**:
- Mobile-friendly navigation pattern
- Quick access to operations list
- Natural hierarchy: List → Detail → Actions
**Flow**:
1. Active Operations tab (list view)
2. Tap operation → Negotiations screen
3. Actions via modals/drawers

### 7. Offer Expiration
**Decision**: 48-hour automatic expiration with visual indicators  
**Rationale**:
- Reasonable time for seller response
- Prevents stale negotiations
- Clear visual urgency (color-coded time remaining)
**Implementation**:
- Server-side cron job for status updates
- Client-side countdown display
- Red (<6h), Orange (<24h), Green (>24h)

### 8. Counter-Offer Handling
**Decision**: Inline display with quick actions  
**Rationale**:
- Reduces context switching
- Fast decision making
- Clear negotiation history
**UI elements**:
- Counter-offer badge on negotiation item
- Expand to see details
- Accept/Reject/Counter buttons

### 9. Performance Optimization
**Decision**: Virtual list for negotiations, lazy loading  
**Rationale**:
- Operations can have 50+ negotiations
- Mobile performance critical
- React Native FlatList with pagination
**Optimizations**:
- Load 20 negotiations initially
- Infinite scroll for more
- Memoized list items

### 10. Error Handling
**Decision**: Optimistic updates with rollback  
**Rationale**:
- Better perceived performance
- Graceful failure recovery
- Clear error messaging
**Patterns**:
- Optimistic UI updates
- Rollback on failure
- Toast notifications for errors

## Best Practices Applied

### React Native
- Use FlatList for large lists
- Memoize expensive computations
- Lazy load screens with React.lazy
- Use react-native-safe-area-context

### NestJS Backend
- DTO validation with class-validator
- Proper error handling with filters
- Database transactions for multi-step operations
- Pagination with cursor-based approach

### Database
- Indexes on frequently queried fields
- Computed fields via Prisma middleware
- Soft deletes for audit trail
- Proper foreign key constraints

### Testing
- Contract tests for all new endpoints
- Integration tests for negotiation flows
- Component tests for new UI elements
- E2E test for critical path

## Integration Points

### Existing Systems
1. **TradeOperationService**: Extend with negotiation management methods
2. **NegotiationService**: Add counter-offer handling
3. **OfferModal**: Reuse for sending new offers
4. **ProfitCalculationService**: Recalculate on negotiation changes

### New Components
1. **ActiveOperationsScreen**: List view of operations
2. **NegotiationsScreen**: Detailed negotiation management
3. **CounterOfferModal**: Handle counter-offer responses
4. **NegotiationListItem**: Compact negotiation display

## Risk Mitigation

### Data Consistency
- Use database transactions for multi-table updates
- Validate business rules at service layer
- Prevent duplicate offers via unique constraints

### Performance
- Implement pagination early
- Add database indexes before deployment
- Monitor API response times

### User Experience
- Show loading states for all async operations
- Provide clear error messages
- Allow retry for failed operations
- Offline queue for actions (future enhancement)

## Implementation Order

1. Backend API endpoints
2. Database schema updates
3. Frontend screens and navigation
4. Integration with existing modals
5. Counter-offer functionality
6. Expiration handling
7. Performance optimizations

## Conclusion

All technical decisions have been researched and validated against the existing codebase patterns. No unknowns remain - the implementation can proceed with the defined approaches.