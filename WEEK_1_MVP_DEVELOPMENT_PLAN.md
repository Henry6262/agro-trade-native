# Week 1: MVP Development Plan - Simple Offer Flow

## 🎯 Goal
Ship a working MVP where:
1. **Admin** sends offers to sellers from ONE screen
2. **Sellers** accept/decline offers on mobile
3. **Inspectors** verify products on mobile
4. **Admin** sees everything in real-time

**NO**: Counter-offers, negotiations, transport bidding, complex workflows
**YES**: Simple, fast, working end-to-end flow

---

## 📅 Daily Breakdown

### **Day 1 (Monday): Admin Operations Management View**
**Owner**: Admin Dashboard Lead
**Goal**: Admin can see seller responses and request inspections

#### Morning Session (4 hours)
- [ ] Extend `OffersTrackingPanel` to show negotiation statuses
- [ ] Add polling for negotiation updates (every 10s)
- [ ] Add status badges (PENDING/ACCEPTED/REJECTED)
- [ ] Wire up negotiation data from `GET /negotiations/trade-operation/:id`

#### Afternoon Session (4 hours)
- [ ] Add "Request Inspection" button for ACCEPTED sellers
- [ ] Implement inspection request flow: `POST /trade-operations/:id/request-inspections`
- [ ] Add verification status indicators (✓ Verified / ⚠️ Needs Inspection)
- [ ] Test full admin view with mock data

**Deliverable**: Admin dashboard shows seller responses and can trigger inspections

---

### **Day 2 (Tuesday): Mobile Seller Offers Screen**
**Owner**: Mobile Lead
**Goal**: Sellers can view and respond to offers

#### Morning Session (4 hours)
- [ ] Create `SellerOffersScreen.tsx` in `/front-end/src/features/seller/screens/`
- [ ] Fetch seller's negotiations using existing `negotiationService.getNegotiations()`
- [ ] Build offer card UI with:
  - Buyer company name
  - Product + quantity + offered price
  - Expiration countdown
- [ ] Add to seller tab navigation

#### Afternoon Session (4 hours)
- [ ] Implement Accept button → `negotiationService.acceptOffer(negotiationId)`
- [ ] Implement Decline button → `negotiationService.rejectOffer(negotiationId, reason)`
- [ ] Add success/error toasts
- [ ] Add pull-to-refresh
- [ ] Handle edge cases (expired offers, network errors)

**Deliverable**: Sellers can accept/decline offers on mobile

---

### **Day 3 (Wednesday): Mobile Inspector Jobs Screen**
**Owner**: Mobile Lead
**Goal**: Inspectors can view and complete inspections

#### Morning Session (4 hours)
- [ ] Create `InspectorJobsScreen.tsx` in `/front-end/src/features/inspector/screens/`
- [ ] Fetch inspections: `GET /inspections?inspectorId={id}&status=PENDING`
- [ ] Build job card UI with:
  - Seller name + product
  - Location preview
  - Priority badge
  - "Start Inspection" button
- [ ] Add to inspector tab navigation

#### Afternoon Session (4 hours)
- [ ] Create `InspectionFormModal.tsx` with:
  - Quality score slider (1-5)
  - Grade dropdown (Premium/Standard/Feed)
  - Notes text area
  - Photo upload (optional for MVP)
- [ ] Submit inspection: `POST /inspections/:id/results`
- [ ] Update inspection status to COMPLETED
- [ ] Add success feedback + refresh jobs list

**Deliverable**: Inspectors can complete verifications on mobile

---

### **Day 4 (Thursday): Integration Testing & Polish**
**Owner**: All Leads + Product Architect
**Goal**: Full end-to-end flow works perfectly

#### Morning Session (4 hours)
**End-to-End Testing**:
- [ ] Test Flow 1: Admin sends offers → Sellers accept → Admin sees acceptance
- [ ] Test Flow 2: Admin requests inspection → Inspector completes → Admin sees verification
- [ ] Test Flow 3: Seller declines offer → Admin sees rejection
- [ ] Test edge cases: expired offers, network failures, concurrent actions

#### Afternoon Session (4 hours)
**UI/UX Polish**:
- [ ] Consistent color scheme across admin + mobile
- [ ] Loading states for all async operations
- [ ] Error handling with user-friendly messages
- [ ] Empty states (no offers, no jobs)
- [ ] Success animations/feedback
- [ ] Accessibility review (mobile)

**Deliverable**: Polished, tested, working MVP

---

### **Day 5 (Friday): Bug Fixes & Deployment Prep**
**Owner**: Integration Test Lead + Backend Lead
**Goal**: Ship-ready code

#### Morning Session (4 hours)
- [ ] Fix any bugs discovered during Day 4 testing
- [ ] Performance optimization (reduce API calls, optimize re-renders)
- [ ] Add analytics events (offer sent, accepted, inspection completed)
- [ ] Update API documentation if needed

#### Afternoon Session (4 hours)
- [ ] Create deployment checklist
- [ ] Database migration verification (if needed)
- [ ] Environment variable check
- [ ] Final smoke test on staging
- [ ] Create release notes
- [ ] Tag release: `v0.1.0-mvp-simple-offers`

**Deliverable**: Production-ready MVP

---

## 📊 Technical Implementation Details

### Admin Dashboard Changes

#### Files to Modify:
```
admin-dashboard/src/features/matching/components/MatchingDashboard/
├── OffersTrackingPanel.tsx (extend this)
├── OfferDetailsModal.tsx (add inspection request button)
└── types.ts (add negotiation status types)
```

#### New API Calls:
```typescript
// Poll for negotiation updates
GET /negotiations/trade-operation/:tradeOperationId
Response: {
  negotiations: [
    {
      id: string,
      tradeSellerId: string,
      status: 'PENDING' | 'ACCEPTED' | 'REJECTED',
      seller: { name: string },
      currentOffer: { price: number, quantity: number },
      expiresAt: string,
      hoursUntilExpiry: number
    }
  ]
}

// Request inspection
POST /trade-operations/:id/request-inspections
Body: { sellerIds: string[], priority: 'HIGH' }
```

#### UI Updates:
- Add "Seller Responses" column in OffersTrackingPanel
- Status badges:
  - 🟡 PENDING (yellow)
  - 🟢 ACCEPTED (green)
  - 🔴 REJECTED (red)
- "Request Inspection" button (only for ACCEPTED + unverified)

---

### Mobile Seller Changes

#### New Files:
```
front-end/src/features/seller/screens/SellerOffersScreen.tsx
front-end/src/features/seller/components/OfferCard.tsx
```

#### Existing Services to Use:
```typescript
import { negotiationService } from '@/services/negotiationService';

// Fetch offers
const offers = await negotiationService.getNegotiations(tradeOperationId);

// Accept offer
await negotiationService.acceptOffer(negotiationId, 'Accepted - good price');

// Reject offer
await negotiationService.rejectOffer(negotiationId, 'Price too low');
```

#### Navigation:
Add to seller's bottom tab:
```tsx
<Tab.Screen
  name="MyOffers"
  component={SellerOffersScreen}
  options={{
    tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
    tabBarLabel: 'My Offers'
  }}
/>
```

---

### Mobile Inspector Changes

#### New Files:
```
front-end/src/features/inspector/screens/InspectorJobsScreen.tsx
front-end/src/features/inspector/components/JobCard.tsx
front-end/src/features/inspector/components/InspectionFormModal.tsx
```

#### API Endpoints:
```typescript
// Fetch pending inspections
GET /inspections?inspectorId={id}&status=PENDING,SCHEDULED

// Submit inspection results
POST /inspections/:id/results
Body: {
  qualityScore: number,        // 1-5
  qualityGrade: string,         // 'Premium' | 'Standard' | 'Feed'
  notes: string,
  photos: string[]              // Optional for MVP
}
```

#### Navigation:
Add to inspector's bottom tab:
```tsx
<Tab.Screen
  name="MyJobs"
  component={InspectorJobsScreen}
  options={{
    tabBarIcon: ({ color }) => <ClipboardCheck color={color} size={24} />,
    tabBarLabel: 'My Jobs'
  }}
/>
```

---

## 🎨 UI/UX Standards

### Color Scheme (Consistent Across Platforms)

**Status Colors**:
- 🟡 Pending: `#F59E0B` (yellow-500)
- 🟢 Accepted: `#10B981` (green-500)
- 🔴 Rejected: `#EF4444` (red-500)
- 🔵 Needs Inspection: `#3B82F6` (blue-500)
- ✅ Verified: `#059669` (green-600)

**Buttons**:
- Primary Action: `bg-gradient-to-r from-blue-500 to-indigo-600`
- Secondary: `bg-neutral-700`
- Success: `bg-green-600`
- Danger: `bg-red-600`

### Loading States
- Skeleton loaders for lists
- Spinner + "Loading..." text for async actions
- Disabled state for buttons during submission

### Empty States
- Friendly illustration + helpful message
- Suggested action (e.g., "Waiting for offers from buyers")

---

## 🧪 Testing Checklist

### Day 4 Test Scenarios

#### Scenario 1: Happy Path
1. ✅ Admin selects buyer + 3 sellers
2. ✅ Admin creates offers → All 3 sellers receive offers
3. ✅ Seller 1 accepts on mobile
4. ✅ Seller 2 rejects on mobile
5. ✅ Seller 3 ignores (expires after 48h)
6. ✅ Admin sees statuses update in real-time
7. ✅ Admin requests inspection for Seller 1
8. ✅ Inspector receives job on mobile
9. ✅ Inspector completes verification
10. ✅ Admin sees verified status

#### Scenario 2: Edge Cases
- ❌ Network failure during accept → Show retry option
- ⏱️ Offer expires while seller is viewing → Disable buttons
- 🔄 Multiple sellers accept simultaneously → All recorded correctly
- 📱 Mobile app loses connection → Queue actions, sync on reconnect

#### Scenario 3: Error Handling
- API returns 500 → Show friendly error message
- Inspector submits invalid quality score → Show validation error
- Admin requests inspection for already verified seller → Prevent action

---

## 📈 Success Metrics

### Week 1 Goals
- [ ] Admin can send offers to 10+ sellers in under 1 minute
- [ ] Sellers can respond to offers in under 10 seconds
- [ ] Inspector can complete verification in under 2 minutes
- [ ] End-to-end flow completes with 0 manual intervention
- [ ] All team members can use the system without training

### Technical Metrics
- [ ] API response time < 500ms (95th percentile)
- [ ] Mobile app loads offers in < 2 seconds
- [ ] Admin dashboard updates seller status in < 10 seconds (polling)
- [ ] Zero critical bugs in production

---

## 🚀 Deployment Strategy

### Pre-Deployment Checklist
- [ ] All tests passing (backend + mobile)
- [ ] Database migrations applied on staging
- [ ] Environment variables configured
- [ ] API documentation updated
- [ ] User acceptance testing completed
- [ ] Rollback plan documented

### Deployment Steps
1. Deploy backend to staging → Smoke test
2. Deploy admin dashboard to staging → Smoke test
3. Build mobile app (development build) → Test
4. Deploy backend to production
5. Deploy admin dashboard to production
6. Distribute mobile app to testers (TestFlight/Firebase)

### Rollback Plan
- Database: Keep previous migration for rollback
- Backend: Tag previous stable release
- Admin: Previous deployment available via Vercel/Netlify history
- Mobile: Previous APK/IPA available for distribution

---

## 📝 Documentation Updates Needed

### For Developers
- [ ] Update `INTEGRATION_STATUS.json` with completed milestones
- [ ] Add API examples to backend README
- [ ] Document mobile navigation structure
- [ ] Update admin dashboard README with new features

### For Users (Week 2)
- [ ] Admin user guide: How to send offers
- [ ] Seller mobile guide: How to respond to offers
- [ ] Inspector mobile guide: How to complete verifications

---

## 🎯 Week 2 Preview (After MVP Ships)

Once Week 1 MVP is live, Week 2 will focus on:

1. **Real-time Updates**: Replace polling with WebSocket connections
2. **Profit Tracking**: Show profit calculations during offer acceptance
3. **Counter-Offers**: Allow sellers to propose different prices
4. **Transport Management**: Assign transporters to verified orders
5. **Analytics Dashboard**: Track offer acceptance rates, inspection times

But first: **Ship the MVP!**

---

## 🤝 Team Coordination

### Daily Standups (9:00 AM)
- What did you ship yesterday?
- What are you shipping today?
- Any blockers?

### End-of-Day Demo (5:00 PM)
- Show working features
- Get feedback from team
- Identify issues early

### Integration Points
- **Day 2 End**: Mobile Lead demos seller acceptance to Admin Lead
- **Day 3 End**: Mobile Lead demos inspector verification to Admin Lead
- **Day 4**: Full team integration testing session

---

## ✅ Definition of Done

A feature is "done" when:
1. ✅ Code written and tested locally
2. ✅ API integration working
3. ✅ UI matches design standards
4. ✅ Error handling implemented
5. ✅ Loading states added
6. ✅ Empty states added
7. ✅ Works on both platforms (if applicable)
8. ✅ Code reviewed by another team member
9. ✅ Deployed to staging
10. ✅ Verified by Product Owner

---

**Let's ship this! 🚀**
