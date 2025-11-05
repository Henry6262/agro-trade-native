# Session 2: Replacement Seller Finder - Testing Checklist

## Pre-Testing Setup

### 1. Ensure Services Running
- [ ] Backend running on port 4001: `http://localhost:4001`
- [ ] Frontend running on port 5174: `http://localhost:5174`
- [ ] Database accessible and seeded with test data

### 2. Test Data Requirements
Create a test scenario with:
- [ ] 1 Buy Listing with quantity 500 kg
- [ ] 1 Trade Operation for the buy listing
- [ ] 2-3 Sellers with accepted offers totaling 150-200 kg (creating a gap)
- [ ] 5+ Sale Listings with matching product (for replacement seller pool)

### 3. Navigation
- [ ] Open browser to `http://localhost:5174`
- [ ] Navigate to Operations page
- [ ] Click on a Trade Operation with quantity gap
- [ ] Verify Quantity Tracking Panel shows gap warning

---

## Functional Testing

### Modal Opening/Closing

**Test 1: Open Modal**
- [ ] Click "🔍 Find Replacement Sellers" button
- [ ] Modal opens with proper title
- [ ] Modal shows description with correct needed quantity
- [ ] Modal has proper max-width (not full screen on desktop)

**Test 2: Close Modal (X button)**
- [ ] Click X button in top-right
- [ ] Modal closes
- [ ] No changes to operation data
- [ ] Can re-open modal

**Test 3: Close Modal (Cancel button)**
- [ ] Open modal
- [ ] Click "Cancel" button at bottom
- [ ] Modal closes
- [ ] No changes to operation data

**Test 4: Close Modal (Escape key)**
- [ ] Open modal
- [ ] Press Escape key
- [ ] Modal closes

**Test 5: Close Modal (Click outside)**
- [ ] Open modal
- [ ] Click on backdrop (outside modal)
- [ ] Modal closes

---

### Data Fetching

**Test 6: Loading State**
- [ ] Open modal
- [ ] Loading spinner appears
- [ ] "Finding matching sellers..." message shows
- [ ] Cancel button remains enabled

**Test 7: Successful Data Load**
- [ ] Sellers load successfully
- [ ] Grid displays with seller cards
- [ ] Each card shows all required information:
  - [ ] Seller name (bold)
  - [ ] Location with 📍 icon
  - [ ] Available quantity with unit
  - [ ] Asking price per unit (€/unit)
  - [ ] Distance in km
  - [ ] Quality badge (color-coded)
  - [ ] Match score badge (large, color-coded)

**Test 8: Empty State**
- [ ] If no sellers available, shows empty state
- [ ] Empty state has 🔍 icon (large, faded)
- [ ] Message: "No matching sellers available"
- [ ] Sub-message: "No sellers with matching products..."
- [ ] Only Cancel button visible

**Test 9: Error State**
- [ ] Simulate network error (disconnect or block request)
- [ ] Error state appears
- [ ] Shows ⚠️ icon
- [ ] Message: "Failed to load matching sellers"
- [ ] "Retry" button appears
- [ ] Clicking Retry fetches data again

---

### Seller Selection

**Test 10: Single Selection**
- [ ] Click checkbox on a seller card
- [ ] Checkbox becomes checked
- [ ] Card gets orange ring border
- [ ] Card background changes to orange-50
- [ ] Selected count updates: "Selected: 1 sellers"
- [ ] Total quantity updates

**Test 11: Unselect Seller**
- [ ] Click checkbox on selected seller
- [ ] Checkbox becomes unchecked
- [ ] Orange ring disappears
- [ ] Background returns to white
- [ ] Selected count decrements
- [ ] Total quantity decreases

**Test 12: Multiple Selection**
- [ ] Select 3 different sellers
- [ ] All 3 show checked state
- [ ] All 3 have orange styling
- [ ] Selected count shows: "Selected: 3 sellers"
- [ ] Total quantity is sum of all 3

**Test 13: Click Card (not checkbox)**
- [ ] Click anywhere on card (not on checkbox)
- [ ] Selection toggles (same as clicking checkbox)

**Test 14: Select All**
- [ ] Click "Select All" button
- [ ] All sellers become selected
- [ ] All checkboxes checked
- [ ] All cards have orange styling
- [ ] Selected count shows total sellers
- [ ] Total quantity shows sum of all
- [ ] Button text changes to "Deselect All"

**Test 15: Deselect All**
- [ ] With all selected, click "Deselect All"
- [ ] All sellers become unselected
- [ ] All checkboxes unchecked
- [ ] Orange styling removed from all cards
- [ ] Selected count shows 0
- [ ] Total quantity shows 0.0
- [ ] Button text changes to "Select All"

---

### Quantity Tracking

**Test 16: Total Quantity Calculation**
- [ ] Select sellers with total < needed quantity
- [ ] Total shows: "200.0 / 350.0 kg" (example)
- [ ] Total is in orange/red (indicating gap)

**Test 17: Gap Warning Display**
- [ ] When selected < needed, orange warning box appears
- [ ] Warning shows: "⚠️ Selected quantity (200.0 kg) is less than needed (350.0 kg)"

**Test 18: No Gap State**
- [ ] Select sellers with total >= needed quantity
- [ ] Total shows: "350.0 / 350.0 kg" (example)
- [ ] Total is in green (no gap)
- [ ] Gap warning does NOT appear

**Test 19: Over-fulfillment**
- [ ] Select sellers with total > needed quantity
- [ ] Total shows: "400.0 / 350.0 kg" (example)
- [ ] System accepts over-fulfillment
- [ ] No warning shown
- [ ] Can still send offers

---

### Send Offers Workflow

**Test 20: Button Disabled (No Selection)**
- [ ] With no sellers selected
- [ ] "Send Offers" button is disabled
- [ ] Button appears grayed out
- [ ] Hovering does nothing

**Test 21: Button Enabled (With Selection)**
- [ ] Select 1+ sellers
- [ ] "Send Offers" button becomes enabled
- [ ] Button shows orange background
- [ ] Button text: "Send X Offer(s)" where X = selected count
- [ ] Hovering shows darker orange

**Test 22: Validation (No Selection)**
- [ ] Manually enable button (browser dev tools)
- [ ] Click "Send Offers" with no selection
- [ ] Toast error appears: "No Sellers Selected"
- [ ] Modal stays open
- [ ] No API call made

**Test 23: Successful Send Offers**
- [ ] Select 2 sellers
- [ ] Click "Send Offers"
- [ ] Button shows loading state: "⏳ Sending Offers..."
- [ ] Button becomes disabled
- [ ] Loading spinner appears
- [ ] After 1-2 seconds:
  - [ ] Success toast appears: "✅ Offers Sent Successfully"
  - [ ] Toast message: "Sent 2 offer(s) to replacement sellers"
  - [ ] Modal closes automatically
  - [ ] Redirects back to Trade Operation page

**Test 24: Data Refresh After Send**
- [ ] After modal closes
- [ ] Trade Operation page refreshes
- [ ] Quantity Tracking Panel updates
- [ ] Pending offers count increases
- [ ] Gap decreases or disappears
- [ ] New offers visible in Offers List

**Test 25: API Error Handling**
- [ ] Simulate API error (backend down)
- [ ] Click "Send Offers"
- [ ] After timeout:
  - [ ] Error toast appears: "Failed to Send Offers"
  - [ ] Toast message: "Please try again later"
  - [ ] Modal stays open
  - [ ] Selections remain intact
  - [ ] Can retry operation

---

### UI/UX Testing

**Test 26: Seller Card Hover**
- [ ] Hover over unselected card
- [ ] Shadow appears
- [ ] Border color changes to orange-300
- [ ] Cursor changes to pointer
- [ ] Hover off, effects disappear

**Test 27: Quality Badge Colors**
- [ ] Seller with quality >90 has green badge
- [ ] Seller with quality 75-90 has blue badge
- [ ] Seller with quality 60-75 has yellow badge
- [ ] Seller with quality <60 has red badge

**Test 28: Match Score Badge Colors**
- [ ] Seller with score >80 has large green badge
- [ ] Seller with score 60-80 has large yellow badge
- [ ] Seller with score <60 has large red badge

**Test 29: Responsive Grid (Desktop)**
- [ ] On desktop (>1024px width)
- [ ] Grid shows 3 columns
- [ ] Cards are evenly spaced
- [ ] Modal width is max-w-6xl

**Test 30: Responsive Grid (Tablet)**
- [ ] Resize browser to tablet width (768-1024px)
- [ ] Grid shows 2 columns
- [ ] Cards adjust size

**Test 31: Responsive Grid (Mobile)**
- [ ] Resize browser to mobile width (<768px)
- [ ] Grid shows 1 column
- [ ] Cards take full width
- [ ] Modal is full-screen or near full-screen

**Test 32: Scrollable Content**
- [ ] With 10+ sellers
- [ ] Modal body scrolls vertically
- [ ] Header stays fixed at top
- [ ] Footer stays fixed at bottom
- [ ] Scroll indicators appear

**Test 33: Button Placement**
- [ ] Footer buttons are right-aligned
- [ ] Cancel button is before Send Offers
- [ ] Buttons maintain spacing
- [ ] Buttons don't overflow on mobile

---

### Integration Testing

**Test 34: End-to-End Workflow**
1. [ ] Start with Trade Operation showing gap
2. [ ] Click "Find Replacement Sellers"
3. [ ] Wait for sellers to load
4. [ ] Select 2-3 sellers totaling >= gap
5. [ ] Verify total quantity >= needed
6. [ ] Click "Send Offers"
7. [ ] Wait for success toast
8. [ ] Verify modal closes
9. [ ] Verify Quantity Tracking updates
10. [ ] Verify new offers appear in list

**Test 35: Multiple Operations**
- [ ] Test workflow on multiple different trade operations
- [ ] Verify each operation gets correct sellers
- [ ] Verify sellers are operation-specific
- [ ] No cross-contamination of data

**Test 36: Concurrent Users (if possible)**
- [ ] Open 2 browser windows
- [ ] Same trade operation in both
- [ ] Add sellers in window 1
- [ ] Refresh window 2
- [ ] Verify updates appear

---

### Edge Cases

**Test 37: Zero Sellers Available**
- [ ] Trade operation with no matching sellers
- [ ] Modal shows empty state
- [ ] No error, just empty message

**Test 38: Single Seller Available**
- [ ] Only 1 matching seller
- [ ] Grid shows single card
- [ ] "Select All" works with 1 seller
- [ ] Can send offer to 1 seller

**Test 39: Very Long Seller Name**
- [ ] Seller with 50+ character name
- [ ] Name wraps or truncates properly
- [ ] Card doesn't break layout

**Test 40: Extreme Quantities**
- [ ] Seller with 999,999.99 kg available
- [ ] Numbers display correctly
- [ ] No overflow issues
- [ ] Calculations remain accurate

**Test 41: Zero Distance**
- [ ] Seller at same location as buyer
- [ ] Distance shows 0.0 km
- [ ] No divide-by-zero errors

**Test 42: Very High Distance**
- [ ] Seller 500+ km away
- [ ] Distance displays correctly
- [ ] Match score reflects distance

**Test 43: Rapid Modal Open/Close**
- [ ] Quickly open and close modal 5 times
- [ ] No memory leaks
- [ ] No duplicate API calls
- [ ] Modal state resets each time

**Test 44: Selection State Persistence**
- [ ] Select 3 sellers
- [ ] Close modal (don't send)
- [ ] Re-open modal
- [ ] Selections are cleared (fresh state)

**Test 45: API Timeout**
- [ ] Simulate slow API (>5 seconds)
- [ ] Loading state persists
- [ ] Eventually loads or shows error
- [ ] User can cancel during load

---

### Accessibility Testing

**Test 46: Keyboard Navigation**
- [ ] Tab through all interactive elements
- [ ] Checkboxes receive focus
- [ ] Buttons receive focus
- [ ] Focus indicators visible
- [ ] Tab order is logical

**Test 47: Checkbox Keyboard Control**
- [ ] Focus on checkbox
- [ ] Press Space key
- [ ] Checkbox toggles
- [ ] Selection state updates

**Test 48: Button Keyboard Control**
- [ ] Focus on "Send Offers" button
- [ ] Press Enter key
- [ ] Action triggers

**Test 49: Escape Key**
- [ ] Modal open
- [ ] Press Escape
- [ ] Modal closes

**Test 50: Screen Reader (if available)**
- [ ] Enable screen reader
- [ ] Navigate through modal
- [ ] Verify labels read correctly
- [ ] Verify badge values announced
- [ ] Verify selection changes announced

---

### Performance Testing

**Test 51: Large Seller List (50+)**
- [ ] Load modal with 50+ sellers
- [ ] Renders within 2 seconds
- [ ] Scrolling is smooth
- [ ] Selection is responsive
- [ ] No lag when clicking

**Test 52: Rapid Selection Changes**
- [ ] Rapidly click 10 checkboxes
- [ ] All selections register
- [ ] Total quantity updates correctly
- [ ] No race conditions

**Test 53: Network Conditions**
- [ ] Test with slow 3G network
- [ ] Loading state appears
- [ ] Eventually loads
- [ ] Error handling works if timeout

---

### Browser Compatibility

**Test 54: Chrome**
- [ ] All tests pass in Chrome

**Test 55: Firefox**
- [ ] All tests pass in Firefox

**Test 56: Safari (if available)**
- [ ] All tests pass in Safari

**Test 57: Edge**
- [ ] All tests pass in Edge

---

## Test Results Summary

### Statistics
- Total Tests: 57
- Passed: ___
- Failed: ___
- Skipped: ___
- Pass Rate: ___%

### Critical Issues Found
(List any blocking issues that prevent feature from working)

1.
2.
3.

### Minor Issues Found
(List any non-blocking issues or improvements)

1.
2.
3.

### Recommendations
(Suggested improvements or follow-up work)

1.
2.
3.

---

## Sign-off

**Tested By**: _______________
**Date**: _______________
**Environment**:
- Backend: http://localhost:4001
- Frontend: http://localhost:5174
- Browser: _______________
- OS: _______________

**Status**: ⬜ APPROVED  ⬜ APPROVED WITH ISSUES  ⬜ REJECTED

**Notes**:




---

**Ready for Production**: ⬜ YES  ⬜ NO  ⬜ PENDING FIXES
