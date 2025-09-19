# Feature Specification: Trade Operation Management & Negotiation Hub

**Feature Branch**: `004-trade-operation-management`  
**Created**: 2025-01-01  
**Status**: Ready for Planning  
**Input**: User description: "Complete flow for managing active trade operations with seller negotiations, counter-offers, and a centralized view for all ongoing negotiations"

## Execution Flow (main)
```
1. Parse user description from Input
   �  Feature focuses on managing active trade operations
2. Extract key concepts from description
   � Actors: Admin (trade manager), Sellers
   � Actions: View operations, manage negotiations, send offers, receive counter-offers
   � Data: Trade operations, negotiations, offers, seller responses
   � Constraints: Cannot proceed until all sellers agree
3. For each unclear aspect:
   � Marked where clarification needed
4. Fill User Scenarios & Testing section
   �  Clear user flow identified
5. Generate Functional Requirements
   �  All requirements are testable
6. Identify Key Entities
   � Trade operations, negotiations, offers identified
7. Run Review Checklist
   � WARN: Some aspects need clarification
8. Return: SUCCESS (spec ready for planning)
```

---

## � Quick Guidelines
-  Focus on WHAT users need and WHY
- L Avoid HOW to implement (no tech stack, APIs, code structure)
- =e Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
As a trade operations manager, I need to manage all my active trade operations from a central location where I can view the status of seller negotiations, send new offers to potential sellers, receive and respond to counter-offers, and track which sellers have agreed to my terms - all without leaving the operations management interface.

### Acceptance Scenarios
1. **Given** a newly created trade operation with selected sellers, **When** I close the creation panel after sending initial offers, **Then** the operation appears in my Active Operations tab with pending negotiations visible

2. **Given** I'm viewing an active trade operation, **When** I click on it, **Then** I can see all sellers with open negotiations, their offer status, and any counter-offers received

3. **Given** a trade operation needs more sellers to meet quantity requirements, **When** I view the operation details, **Then** I see a list of potential seller candidates I can send offers to

4. **Given** I select a potential seller from the candidates list, **When** I send them an offer, **Then** they move from the candidates section to the active negotiations section

5. **Given** a seller has sent a counter-offer, **When** I view the negotiations tab, **Then** I can see the counter-offer details and respond with acceptance or a new offer

6. **Given** all required sellers have agreed to offers, **When** I view the operation status, **Then** I can proceed to the next phase of the trade operation

### Edge Cases
- What happens when a seller rejects an offer after initially accepting?
- How does the system handle when a seller becomes unavailable mid-negotiation?
- What if the total agreed quantity exceeds the buyer's requirements?
- How are conflicting counter-offers from multiple sellers prioritized?
- What happens if negotiations expire without agreement?

## Requirements

### Functional Requirements

**Active Operations Management**
- **FR-001**: System MUST display all active trade operations in a dedicated "Active Operations" tab
- **FR-002**: Each operation MUST show its current phase, negotiation status, and completion percentage
- **FR-003**: Users MUST be able to select any active operation to view detailed negotiations
- **FR-004**: System MUST prevent progression to next phase until all required sellers have agreed to offers

**Negotiation View**
- **FR-005**: Selected operation MUST display all sellers with open negotiations in a compact, scannable format
- **FR-006**: Each seller negotiation MUST show: current offer, response status, counter-offer (if any), and time remaining
- **FR-007**: System MUST visually distinguish between: pending offers, accepted offers, rejected offers, and counter-offers
- **FR-008**: Users MUST be able to send new offers directly from the negotiation view using the existing offer drawer UI

**Potential Sellers Management**
- **FR-009**: System MUST display potential seller candidates when operation needs additional quantity
- **FR-010**: Potential sellers MUST show availability, location, asking price, and match score
- **FR-011**: Users MUST be able to send offers to potential sellers with one click
- **FR-012**: When offer is sent to potential seller, they MUST immediately move to active negotiations section

**Counter-Offer Handling**
- **FR-013**: System MUST display counter-offers when user refreshes or navigates to the negotiations view (request-based updates)
- **FR-014**: Counter-offers MUST be viewable inline within the negotiation list
- **FR-015**: Users MUST be able to accept, reject, or counter a counter-offer
- **FR-016**: System MUST track full negotiation history for audit purposes

**Status Tracking**
- **FR-017**: System MUST calculate and display total agreed quantity vs required quantity
- **FR-018**: System MUST show offer expiration time remaining for each negotiation
- **FR-019**: System MUST prevent duplicate offers to same seller for same trade operation
- **FR-020**: System MUST auto-expire offers after 48 hours from creation

### Key Entities

- **Trade Operation**: Represents an active trade with its phase, status, required quantity, and associated negotiations
- **Negotiation**: Individual seller engagement including offers, counter-offers, status, and history
- **Seller Candidate**: Potential seller with match score, availability, and capability to fulfill requirements
- **Offer**: Proposed terms including price, quantity, validity period, and special conditions
- **Counter-Offer**: Seller's response with modified terms requiring admin action

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified (request-based updates, 48h expiration)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Notes for Planning Phase

The user envisions:
1. After creating a trade operation and sending initial offers, the creation panel closes
2. Users access the Active Operations tab to see all operations
3. Clicking an operation shows all sellers with open negotiations
4. If more sellers are needed, a candidates list is available for sending additional offers
5. All seller offers are managed in one place with counter-offer capabilities
6. UI should be similar to existing seller section with offer drawer
7. Compact display to manage multiple negotiations efficiently

Key success factor: Centralized management of all negotiations without context switching.