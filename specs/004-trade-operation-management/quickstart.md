# Quickstart: Trade Operation Management

## Overview
This guide demonstrates the Trade Operation Management feature, allowing admins to manage all active trade operations and negotiations from a centralized interface.

## Prerequisites
- Running backend server (NestJS)
- Running frontend app (React Native)
- PostgreSQL database with seed data
- At least one active trade operation created

## Test Scenario: Complete Negotiation Flow

### Step 1: View Active Operations
1. Navigate to the "Active Operations" tab in the admin dashboard
2. **Expected**: See a list of all active trade operations with:
   - Operation number and product name
   - Current phase (e.g., "SELLER_NEGOTIATION")
   - Progress bar showing quantity secured (e.g., "75/100 TON")
   - Number of active negotiations
   - Profit margin indicator

### Step 2: Select an Operation
1. Tap on any active trade operation
2. **Expected**: Navigate to negotiation details screen showing:
   - Operation summary at top
   - List of active negotiations with sellers
   - Visual status indicators (pending=blue, accepted=green, countered=orange)
   - Time remaining for each negotiation
   - Potential sellers section at bottom if more quantity needed

### Step 3: Handle a Counter-Offer
1. Find a negotiation with "COUNTERED" status (orange indicator)
2. Tap on the negotiation to expand details
3. View the counter-offer details (price, quantity, terms)
4. Tap "Accept Counter-Offer"
5. **Expected**: 
   - Negotiation status changes to "ACCEPTED"
   - Progress bar updates with new secured quantity
   - Success toast notification

### Step 4: Add More Sellers
1. Scroll to "Potential Sellers" section (if quantity not met)
2. Tap on a potential seller
3. Review seller details (location, availability, asking price)
4. Tap "Send Offer" button
5. Enter offer details in the modal:
   - Price: Enter competitive price
   - Quantity: Auto-filled based on remaining need
   - Terms: Standard terms
6. Confirm sending
7. **Expected**:
   - Seller moves from potential to active negotiations
   - New negotiation appears with "PENDING" status
   - 48-hour countdown timer starts

### Step 5: Quick Actions
1. From the negotiations list, test quick actions:
   - Swipe left on a pending negotiation → "Cancel Offer" button
   - Tap the refresh icon → Updates all negotiation statuses
   - Use filter chips → Show only "PENDING" or "COUNTERED"
2. **Expected**: All actions complete without navigation

### Step 6: Complete the Operation
1. Once all required quantity is secured (100% progress)
2. Tap "Proceed to Transport" button (becomes enabled)
3. **Expected**: 
   - Operation phase changes to "TRANSPORT_BIDDING"
   - Navigation to transport management screen

## API Test Commands

### List Active Operations
```bash
curl -X GET http://localhost:3001/api/trade-operations?status=ACTIVE
```

### Get Operation Negotiations
```bash
curl -X GET http://localhost:3001/api/trade-operations/{id}/negotiations
```

### Accept Counter-Offer
```bash
curl -X POST http://localhost:3001/api/negotiations/{id}/counter-offer \
  -H "Content-Type: application/json" \
  -d '{"action": "ACCEPT"}'
```

### Add Seller to Operation
```bash
curl -X POST http://localhost:3001/api/trade-operations/{id}/add-sellers \
  -H "Content-Type: application/json" \
  -d '{
    "sellers": [{
      "sellerId": "seller123",
      "saleListingId": "listing456",
      "offerPrice": 350,
      "requestedQuantity": 25,
      "terms": "Standard payment terms"
    }]
  }'
```

## Success Criteria

✅ **Navigation**
- [ ] Active Operations tab is accessible from main navigation
- [ ] Smooth transition between list and detail views
- [ ] Back navigation maintains scroll position

✅ **Data Display**
- [ ] All active operations visible in list
- [ ] Real-time progress calculation accurate
- [ ] Counter-offers clearly distinguished
- [ ] Expiration times show correctly

✅ **Interactions**
- [ ] Counter-offers can be accepted/rejected/countered
- [ ] New sellers can be added when needed
- [ ] Offers expire after 48 hours
- [ ] All status transitions work correctly

✅ **Performance**
- [ ] List loads within 2 seconds
- [ ] Smooth scrolling with 50+ negotiations
- [ ] No lag when switching between operations
- [ ] Modals open instantly

✅ **Error Handling**
- [ ] Network errors show retry option
- [ ] Invalid actions show clear error messages
- [ ] Expired offers cannot be acted upon
- [ ] Quantity validations prevent over-allocation

## Edge Cases to Test

1. **Expired Negotiations**: Wait for a negotiation to expire (or set time forward)
   - Verify status changes to "EXPIRED"
   - Verify no actions available on expired items

2. **Quantity Overflow**: Try adding sellers exceeding buyer's need
   - Verify validation prevents over-allocation
   - Verify clear error message shown

3. **Simultaneous Updates**: Open same operation on two devices
   - Make changes on device A
   - Refresh on device B
   - Verify changes appear correctly

4. **Network Loss**: Turn off network during operation
   - Verify error state shown
   - Turn network back on
   - Verify retry succeeds

## Troubleshooting

### Issue: Operations list empty
- Check: Are there active trade operations in database?
- Fix: Run seed script to create test data

### Issue: Counter-offers not showing
- Check: Do negotiations have counterOffer field populated?
- Fix: Use seller app to create counter-offers

### Issue: Potential sellers empty
- Check: Are there available sale listings for the product?
- Fix: Create sale listings matching the product

### Issue: Negotiations not updating
- Check: Is the backend API responding?
- Fix: Check server logs for errors

## Performance Benchmarks

- Operations list load: < 2 seconds
- Navigation to detail: < 500ms
- Counter-offer response: < 1 second
- Add seller action: < 1.5 seconds
- UI animations: 60 FPS

## Next Steps

After successfully completing this quickstart:
1. Test with production-like data (100+ operations)
2. Verify mobile app performance on actual devices
3. Test offline scenarios with network interruptions
4. Validate 48-hour expiration with time adjustments