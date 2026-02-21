# AgroTrade Offer API Flow Diagrams

## Accept Offer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ SELLER APP                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Offers Screen]                                                │
│       │                                                          │
│       ├─> User clicks "Accept" on offer                         │
│       │                                                          │
│       v                                                          │
│  [SellerAcceptOfferModal]                                       │
│       │                                                          │
│       ├─> Shows offer details                                   │
│       ├─> User enters optional acceptance note                  │
│       ├─> User clicks "Accept Offer"                            │
│       │                                                          │
│       v                                                          │
│  useSellerOffers.acceptOffer(negotiationId, acceptanceNote)    │
│       │                                                          │
│       v                                                          │
│  sellerOfferService.acceptOffer(negotiationId, { acceptanceNote })│
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        │ HTTP POST
        │ /api/negotiations/:id/accept
        │ { acceptanceNote?: string }
        v
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND API                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NegotiationController.acceptOffer()                            │
│       │                                                          │
│       v                                                          │
│  NegotiationService.acceptOffer()                               │
│       │                                                          │
│       ├─> Validate negotiation exists                           │
│       ├─> Validate not expired                                  │
│       ├─> Update negotiation status → ACCEPTED                  │
│       ├─> Record acceptance note                                │
│       ├─> Update trade operation phase if needed                │
│       ├─> Send notification to buyer                            │
│       │                                                          │
│       v                                                          │
│  Return NegotiationWithDetailsDto                               │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        │ HTTP 200 OK
        │ { data: { ...negotiation } }
        v
┌─────────────────────────────────────────────────────────────────┐
│ SELLER APP                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  React Query mutation.onSuccess()                               │
│       │                                                          │
│       ├─> Invalidate ['seller-offers'] query                    │
│       ├─> Offers list auto-refetches                            │
│       ├─> Close modal                                           │
│       ├─> Show success alert                                    │
│       │                                                          │
│       v                                                          │
│  [Offers Screen]                                                │
│       │                                                          │
│       └─> Updated offer list (accepted offer removed/marked)    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Reject Offer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ SELLER APP                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Offers Screen]                                                │
│       │                                                          │
│       ├─> User clicks "Reject" on offer                         │
│       │                                                          │
│       v                                                          │
│  [SellerRejectOfferModal]                                       │
│       │                                                          │
│       ├─> User selects rejection reason                         │
│       ├─> User enters optional message                          │
│       ├─> User clicks "Reject Offer"                            │
│       │                                                          │
│       v                                                          │
│  useSellerOffers.rejectOffer(negotiationId, reason)            │
│       │                                                          │
│       v                                                          │
│  sellerOfferService.rejectOffer(negotiationId, { reason })     │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        │ HTTP POST
        │ /api/negotiations/:id/reject
        │ { reason?: string }
        v
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND API                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NegotiationController.rejectOffer()                            │
│       │                                                          │
│       v                                                          │
│  NegotiationService.rejectOffer()                               │
│       │                                                          │
│       ├─> Validate negotiation exists                           │
│       ├─> Update negotiation status → REJECTED                  │
│       ├─> Record rejection reason                               │
│       ├─> Analyze cascade risk (for lead sellers)               │
│       ├─> Send notification to buyer                            │
│       │                                                          │
│       v                                                          │
│  Return NegotiationResponseWrapperDto                           │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        │ HTTP 200 OK
        │ { success: true, data: { ...negotiation } }
        v
┌─────────────────────────────────────────────────────────────────┐
│ SELLER APP                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  React Query mutation.onSuccess()                               │
│       │                                                          │
│       ├─> Invalidate ['seller-offers'] query                    │
│       ├─> Offers list auto-refetches                            │
│       ├─> Close modal                                           │
│       ├─> Show rejection confirmation                           │
│       │                                                          │
│       v                                                          │
│  [Offers Screen]                                                │
│       │                                                          │
│       └─> Updated offer list (rejected offer removed)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Counter Offer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ SELLER APP                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Offers Screen]                                                │
│       │                                                          │
│       ├─> User clicks "Counter" on offer                        │
│       │                                                          │
│       v                                                          │
│  [SellerCounterOfferModal]                                      │
│       │                                                          │
│       ├─> Shows current offer price                             │
│       ├─> User enters counter price                             │
│       ├─> User adjusts quantity (optional)                      │
│       ├─> User enters message/terms                             │
│       ├─> Shows price difference & total value                  │
│       ├─> User clicks "Send Counter Offer"                      │
│       │                                                          │
│       v                                                          │
│  useSellerOffers.makeCounterOffer(                             │
│      negotiationId, counterPrice, quantity, message             │
│  )                                                              │
│       │                                                          │
│       v                                                          │
│  sellerOfferService.counterOffer(                               │
│      negotiationId,                                             │
│      { counterPrice, quantity, message }                        │
│  )                                                              │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        │ HTTP POST
        │ /api/negotiations/:id/counter
        │ { price: number, quantity: number, terms?: string }
        v
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND API                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NegotiationController.counterOffer()                           │
│       │                                                          │
│       v                                                          │
│  NegotiationService.counterOffer()                              │
│       │                                                          │
│       ├─> Validate negotiation exists                           │
│       ├─> Validate not expired                                  │
│       ├─> Validate price is different from current              │
│       ├─> Create counter-offer object                           │
│       ├─> Update negotiation status → COUNTERED                 │
│       ├─> Increment round number                                │
│       ├─> Add to offer history                                  │
│       ├─> Calculate convergence metrics                         │
│       ├─> Send notification to buyer                            │
│       │                                                          │
│       v                                                          │
│  Return NegotiationResponseWrapperDto                           │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        │ HTTP 200 OK
        │ { success: true, data: { ...negotiation, counterOffer } }
        v
┌─────────────────────────────────────────────────────────────────┐
│ SELLER APP                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  React Query mutation.onSuccess()                               │
│       │                                                          │
│       ├─> Invalidate ['seller-offers'] query                    │
│       ├─> Offers list auto-refetches                            │
│       ├─> Close modal                                           │
│       ├─> Show "Counter Offer Sent" success message             │
│       │                                                          │
│       v                                                          │
│  [Offers Screen]                                                │
│       │                                                          │
│       └─> Updated offer list (status → COUNTERED)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Buyer Accept Counter-Offer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ BUYER/ADMIN APP                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [NegotiationManagementScreen]                                  │
│       │                                                          │
│       ├─> Shows negotiations with status COUNTERED              │
│       ├─> User sees seller's counter offer                      │
│       ├─> User clicks "Accept Counter"                          │
│       │                                                          │
│       v                                                          │
│  handleAccept(negotiationId)                                    │
│       │                                                          │
│       v                                                          │
│  negotiationService.acceptOffer(negotiationId)                  │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        │ HTTP POST
        │ /api/negotiations/:id/accept
        │ { acceptanceNote?: string }
        v
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND API                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NegotiationController.acceptOffer()                            │
│       │                                                          │
│       ├─> Accept counter-offer (uses counter price)             │
│       ├─> Update negotiation status → ACCEPTED                  │
│       ├─> Set finalPrice to counter-offer price                 │
│       ├─> Update trade operation                                │
│       ├─> Send notification to seller                           │
│       │                                                          │
│       v                                                          │
│  Return NegotiationWithDetailsDto                               │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        │ HTTP 200 OK
        v
┌─────────────────────────────────────────────────────────────────┐
│ BUYER/ADMIN APP                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Success callback                                               │
│       │                                                          │
│       ├─> Refresh negotiations list                             │
│       ├─> Show success message                                  │
│       ├─> Move to next phase                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### Frontend → Backend Mapping

| Frontend (sellerOfferService) | Backend (CounterOfferDto) |
|-------------------------------|---------------------------|
| `counterPrice: number`        | `price: number`           |
| `quantity: number`            | `quantity: number`        |
| `message: string`             | `terms: string`           |
| -                             | `reason: string`          |

### Negotiation Status Flow

```
PENDING
  │
  ├─> ACCEPTED ✅ (buyer accepts initial offer)
  │
  ├─> REJECTED ❌ (buyer rejects)
  │
  ├─> COUNTERED 🔄 (seller counters)
  │     │
  │     ├─> ACCEPTED ✅ (buyer accepts counter)
  │     │
  │     ├─> REJECTED ❌ (buyer rejects counter)
  │     │
  │     └─> COUNTERED 🔄 (buyer counters back)
  │           │
  │           └─> ... (continues negotiation)
  │
  ├─> EXPIRED ⏰ (time limit reached)
  │
  └─> WITHDRAWN 🚫 (offer withdrawn by buyer)
```

## Error Handling

### Common Errors

1. **Negotiation Not Found (404)**
   ```
   User → Service → Backend
              ↓
         Error: Negotiation not found
              ↓
         Alert shown to user
   ```

2. **Negotiation Expired (400)**
   ```
   User → Service → Backend
              ↓
         Error: Negotiation has expired
              ↓
         Alert shown + offer list refreshed
   ```

3. **Network Error (Network Failure)**
   ```
   User → Service → X (Network failure)
              ↓
         Error caught in try/catch
              ↓
         Alert: "Network error, please try again"
   ```

4. **Auth Error (401)**
   ```
   User → Service → Backend (401)
              ↓
         API interceptor catches
              ↓
         Attempt token refresh
              ↓
         Retry request OR logout
   ```

## React Query Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Component mounts                                                 │
│       │                                                          │
│       v                                                          │
│ useSellerOffers() hook                                          │
│       │                                                          │
│       ├─> useQuery(['seller-offers'])                           │
│       │     │                                                    │
│       │     ├─> Initial fetch                                   │
│       │     ├─> Cache for 15s                                   │
│       │     └─> Auto-refetch every 30s                          │
│       │                                                          │
│       ├─> useMutation(acceptOffer)                              │
│       ├─> useMutation(rejectOffer)                              │
│       └─> useMutation(counterOffer)                             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ User triggers action (e.g., accept)                             │
│       │                                                          │
│       v                                                          │
│ acceptOfferMutation.mutate()                                    │
│       │                                                          │
│       ├─> Set isPending = true                                  │
│       ├─> Call API                                              │
│       ├─> On success:                                           │
│       │     ├─> invalidateQueries(['seller-offers'])            │
│       │     ├─> Auto-refetch data                               │
│       │     └─> Set isSuccess = true                            │
│       │                                                          │
│       └─> On error:                                             │
│             ├─> Set isError = true                              │
│             └─> Expose error object                             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Component re-renders with new state                             │
│       │                                                          │
│       ├─> isPending → show loading spinner                      │
│       ├─> isSuccess → show success alert                        │
│       ├─> isError → show error alert                            │
│       └─> data updated → UI reflects changes                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
