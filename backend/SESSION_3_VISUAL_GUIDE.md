# Session 3: Transport Management Panel - Visual Guide

**Component**: TransportManagementPanel
**Purpose**: Coordinate transport logistics for trade operations

---

## Phase 1: Pre-Request State

### When This Appears
- ✅ All accepted offers exist
- ✅ All inspections completed
- ❌ No transport request created yet

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    [Indigo Gradient Header]                                 │
│  🚚  Transport Coordination                     [📦 Create Transport Request]│
│      Arrange transport for this trade operation                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              🚛                                             │
│                       (large, faded icon)                                   │
│                                                                             │
│               No transport request created yet                              │
│                                                                             │
│     Click the button above to create a transport request and               │
│               notify transport companies                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Elements
- **Header Color**: Indigo gradient (`from-indigo-50 to-indigo-100`)
- **Border**: 2px indigo (`border-indigo-300`)
- **Icon**: 🚚 (truck emoji)
- **Button**: Large, indigo, with 📦 icon
- **Empty State**: Centered, large faded truck icon

### User Action
Click **"Create Transport Request"** button
→ Button becomes: `⏳ Creating...`
→ Success: Toast notification + transition to Phase 2
→ Error: Red toast + button returns to clickable

---

## Phase 2: Request Created, Awaiting Responses

### When This Appears
- ✅ Transport request created
- ❌ No transport approved yet

### Visual Layout (No Responses Yet)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    [Indigo Gradient Header]                                 │
│  🚚  Transport Request #TR-2024-001                         [OPEN]          │
│      Sent to 5 transport companies                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Total Weight          Pickup Points          Delivery Deadline             │
│  100 tons              3 locations            Dec 31, 2024                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Transport Company Responses                                                │
│                                                                             │
│                              📭                                             │
│                                                                             │
│                      No responses yet                                       │
│                                                                             │
│          Waiting for transport companies to respond...                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual Layout (With Responses)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    [Indigo Gradient Header]                                 │
│  🚚  Transport Request #TR-2024-001                         [OPEN]          │
│      Sent to 5 transport companies                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Total Weight          Pickup Points          Delivery Deadline             │
│  100 tons              3 locations            Dec 31, 2024                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Transport Company Responses                                                │
│                                                                             │
│  ✅ Confirmed (2)                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Fast Logistics Ltd.                                                   │ │
│  │                                                                       │ │
│  │ Trucks Offered    Total Capacity    Status                            │ │
│  │ 3 trucks          45 tons           [CONFIRMED]                       │ │
│  │                                                [✅ Approve] [❌ Reject]│ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Express Transport Co.                                                 │ │
│  │                                                                       │ │
│  │ Trucks Offered    Total Capacity    Status                            │ │
│  │ 2 trucks          30 tons           [CONFIRMED]                       │ │
│  │                                                [✅ Approve] [❌ Reject]│ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ⏳ Pending (2)                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Quick Haul Services                                                   │ │
│  │                                                                       │ │
│  │ Trucks Offered    Total Capacity    Status                            │ │
│  │ -                 -                 [PENDING]                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ❌ Declined (1)                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Regional Carriers Inc.                                                │ │
│  │                                                                       │ │
│  │ Trucks Offered    Total Capacity    Status                            │ │
│  │ 0 trucks          0 tons            [DECLINED]                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Elements
- **Header**: Same indigo gradient
- **Request Number**: Displayed in title
- **Status Badge**: Outlined, top-right
- **Request Details**: 3-column grid
- **Response Sections**: Color-coded by status
  - ✅ Confirmed: Green text (`text-green-700`)
  - ⏳ Pending: Yellow text (`text-yellow-700`)
  - ❌ Declined: Red text (`text-red-700`)
- **Bid Cards**: White background, border, hover shadow
- **Action Buttons**: Only on CONFIRMED bids
  - Approve: Green background
  - Reject: Red background

### User Actions

**Approve Bid**:
Click **"✅ Approve"** button
→ Both buttons show: `⏳ Processing...`
→ Success: Toast "Transport Approved" + transition to Phase 3
→ Error: Red toast + buttons return to clickable

**Reject Bid**:
Click **"❌ Reject"** button
→ Both buttons show: `⏳ Processing...`
→ Success: Toast "Transport Rejected" + bid moves to rejected
→ Error: Red toast + buttons return to clickable

---

## Phase 3: Transport Assigned

### When This Appears
- ✅ Transport request created
- ✅ Transport bid approved
- ✅ Transport job created

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     [Green Gradient Header]                                 │
│  ✅  Transport Assigned                                                     │
│      Fast Logistics Ltd. - 3 trucks                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Job Status     Started           ETA               Progress                │
│  [IN_TRANSIT]   Dec 15, 2024      Dec 20, 2024      65%                     │
│                                                                             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░                        │
│  └────────────────── 65% ──────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Elements
- **Header Color**: Green gradient (`from-green-50 to-green-100`)
- **Border**: 2px green (`border-green-300`)
- **Icon**: ✅ (checkmark emoji)
- **Company Info**: Name + truck count in description
- **Job Details**: 4-column grid
  - Job Status (badge)
  - Started date
  - ETA date
  - Progress percentage
- **Progress Bar**:
  - Background: Gray (`bg-gray-200`)
  - Fill: Green (`bg-green-600`)
  - Height: 3 (`h-3`)
  - Animated: `transition-all duration-500`

### Status Badge Colors
- **ASSIGNED**: Blue/default
- **STARTED**: Yellow/secondary
- **IN_TRANSIT**: Green/default
- **COMPLETED**: Green/default

### Progress Indicators
- 0%: Empty bar
- 1-99%: Partially filled bar
- 100%: Full green bar

---

## Conditional Rendering Logic

### Panel Visibility Decision Tree

```
START
  │
  ├─ Has Accepted Offers?
  │   ├─ NO → Don't render panel
  │   └─ YES → Continue
  │
  ├─ Inspections Complete?
  │   ├─ NO → Don't render panel
  │   └─ YES → Continue
  │
  ├─ Operation Status = COMPLETED or CANCELLED?
  │   ├─ YES → Don't render panel
  │   └─ NO → Continue
  │
  └─ RENDER PANEL
      │
      ├─ Has Transport Job?
      │   ├─ YES → Show Phase 3 (Assigned)
      │   └─ NO → Continue
      │
      ├─ Has Transport Request?
      │   ├─ YES → Show Phase 2 (Awaiting Responses)
      │   └─ NO → Show Phase 1 (Pre-Request)
```

---

## State Transition Flow

### Normal Flow

```
Phase 1: Pre-Request
        │
        │ [User clicks "Create Transport Request"]
        │
        ▼
Phase 2: Awaiting Responses
        │
        │ [Companies respond with confirmations]
        │
        │ [Admin clicks "Approve" on a bid]
        │
        ▼
Phase 3: Transport Assigned
        │
        │ [Transport company completes delivery]
        │
        ▼
Operation Completed
(Panel no longer visible)
```

### Error Recovery Flow

```
Phase 1: Create Request Fails
        │
        │ [Red toast: "Failed to Create Request"]
        │
        └─→ STAY IN PHASE 1
            [User can retry]

Phase 2: Approve Bid Fails
        │
        │ [Red toast: "Failed to Approve"]
        │
        └─→ STAY IN PHASE 2
            [User can retry or approve different bid]

Phase 2: Reject Bid Fails
        │
        │ [Red toast: "Failed to Reject"]
        │
        └─→ STAY IN PHASE 2
            [User can retry]
```

---

## Color System Reference

### Gradients

**Indigo (Phases 1 & 2)**:
```css
bg-gradient-to-br from-indigo-50 to-indigo-100
border-b-2 border-indigo-300
```
- Used for: Pre-request and awaiting responses
- Meaning: Neutral, administrative action needed

**Green (Phase 3)**:
```css
bg-gradient-to-br from-green-50 to-green-100
border-b-2 border-green-300
```
- Used for: Transport assigned and in progress
- Meaning: Success, operation proceeding

### Status Colors

**Confirmed Bids**:
- Text: `text-green-700`
- Icon: ✅
- Meaning: Ready for admin approval

**Pending Bids**:
- Text: `text-yellow-700`
- Icon: ⏳
- Meaning: Waiting for company response

**Declined Bids**:
- Text: `text-red-700`
- Icon: ❌
- Meaning: Company cannot fulfill request

### Button Colors

**Approve Button**:
```css
bg-green-600 text-white hover:bg-green-700
```

**Reject Button**:
```css
bg-red-600 text-white hover:bg-red-700
```

**Create Request Button**:
```css
[Default button styling with indigo theme]
```

---

## Typography System

### Hierarchy

**Level 1: Card Title**
- Font: Bold, large
- Color: `text-text-primary`
- Example: "Transport Coordination"

**Level 2: Card Description**
- Font: Regular, medium
- Color: `text-text-secondary`
- Example: "Arrange transport for this trade operation"

**Level 3: Section Headers**
- Font: Bold, large
- Color: `text-text-primary`
- Example: "Transport Company Responses"

**Level 4: Subsection Headers**
- Font: Semibold, small
- Color: Status-based (green, yellow, red)
- Example: "✅ Confirmed (2)"

**Level 5: Data Labels**
- Font: Extra small
- Color: `text-text-secondary`
- Example: "Total Weight", "Trucks Offered"

**Level 6: Data Values**
- Font: Semibold, default
- Color: `text-text-primary`
- Example: "100 tons", "3 trucks"

---

## Spacing System

### Consistent Spacing

**Card Content Padding**:
- Top: `pt-6` (1.5rem)
- Horizontal: Default card padding

**Grid Gaps**:
- Between columns: `gap-4` (1rem)
- Between rows: Inherent grid spacing

**Section Spacing**:
- Between sections: `space-y-3` (0.75rem)
- Between subsections: `mb-4` (1rem)

**Border Spacing**:
- Request details border: `pb-6 border-b` (padding bottom, then border)

---

## Iconography

### Emoji Icons Used

| Icon | Meaning | Location |
|------|---------|----------|
| 🚚 | Truck/Transport | Phase 1 & 2 headers |
| ✅ | Approved/Complete | Phase 3 header, Approve button |
| 📦 | Package/Request | Create Request button |
| 🚛 | Large truck | Phase 1 empty state |
| 📭 | Empty mailbox | Phase 2 no responses state |
| ⏳ | Loading/Waiting | Loading states, pending status |
| ❌ | Reject/Declined | Reject button, declined status |

---

## Responsive Behavior

### Desktop (Primary Target)

**1920px+ (Large Desktop)**:
- Full-width grids (3-4 columns)
- Cards don't stretch beyond max-width
- Ample spacing between elements

**1366px (Standard Desktop)**:
- Grids remain at 3-4 columns
- Optimal viewing experience
- No horizontal scrolling

**1024px (Small Desktop/Large Tablet)**:
- Grids may reduce to 2 columns
- Content remains accessible
- Buttons remain full-sized

---

## Animation & Transitions

### Animated Elements

**Loading Spinner**:
```css
animate-spin
```
- Used in: Loading states, processing states
- Speed: Default Tailwind spin

**Progress Bar**:
```css
transition-all duration-500
```
- Used in: Phase 3 progress bar
- Animates: Width changes smoothly

**Hover Effects**:
```css
hover:shadow-md transition-shadow
```
- Used in: Bid cards
- Effect: Shadow appears on hover

**Button Hover**:
```css
hover:bg-green-700
hover:bg-red-700
```
- Used in: All action buttons
- Effect: Darker shade on hover

---

## User Feedback Patterns

### Toast Notifications

**Success (Green Toast)**:
- "Transport Request Created"
- "Transport Approved"
- "Transport Rejected"

**Error (Red Toast)**:
- "Failed to Create Request"
- "Failed to Approve"
- "Failed to Reject"

### Loading Indicators

**Button Loading**:
- Icon changes to ⏳
- Text changes to "Creating..." / "Processing..."
- Button becomes disabled

**Panel Loading**:
- Centered spinner ⏳
- Message: "Loading transport information..."

**Error Display**:
- Warning icon ⚠️
- Error message
- Retry button

---

## Accessibility Features

### Semantic HTML
- Proper heading hierarchy
- Card structure with header/content
- Button elements (not divs)

### Keyboard Navigation
- All buttons are keyboard accessible
- Tab order is logical (top to bottom)
- Enter/Space activates buttons

### Screen Reader Support
- Descriptive button labels
- Status badges announced
- Card titles provide context

### Visual Indicators
- Clear focus outlines
- Disabled states visually distinct
- Color not sole indicator (icons + text)

---

## Implementation Notes

### Component Structure

```
TransportManagementPanel (Smart Component)
  │
  ├─ State Management
  │   ├─ transportData
  │   ├─ loading
  │   ├─ error
  │   ├─ creatingRequest
  │   └─ processingBid
  │
  ├─ Effects
  │   └─ Fetch transport data on mount
  │
  ├─ Handlers
  │   ├─ handleCreateTransportRequest
  │   ├─ handleApproveBid
  │   └─ handleRejectBid
  │
  └─ Render Logic
      ├─ Conditional: shouldShowPanel check
      ├─ Loading state
      ├─ Error state
      ├─ Phase 3: Transport Assigned
      ├─ Phase 2: Request Created
      └─ Phase 1: Pre-Request
          │
          └─ BidCard (Presentational Component)
              ├─ Props: bid, onApprove, onReject, processing
              └─ Renders: Company info + action buttons
```

### Data Flow

**Parent → Component**:
```
TradeOperationDetail
  ↓ (props)
TransportManagementPanel
```

**Component → API**:
```
TransportManagementPanel
  ↓ (API calls)
Backend Endpoints
  ↓ (responses)
TransportManagementPanel state
  ↓ (re-render)
UI Update
```

**Component → Parent**:
```
TransportManagementPanel
  ↓ (onTransportAssigned callback)
TradeOperationDetail
  ↓ (fetchOperation)
Refresh operation data
```

---

## Design Philosophy

### Principles Applied

1. **Progressive Disclosure**
   - Show only relevant information per phase
   - Don't overwhelm with all data at once

2. **Clear Visual Hierarchy**
   - Header gradients indicate phase
   - Color-coded sections for easy scanning
   - Typography establishes importance

3. **Immediate Feedback**
   - Loading states for every action
   - Toast notifications confirm actions
   - Error messages guide recovery

4. **Consistency**
   - Matches other panel designs (Inspection, Finalization)
   - Uses same color system
   - Follows established patterns

5. **User Control**
   - Clear action buttons
   - Ability to retry on errors
   - Multiple bid options (approve different companies)

---

## Comparison with Other Panels

### Similarities

**InspectionResultsPanel**:
- Similar gradient header pattern
- Status-based conditional rendering
- Action buttons with loading states

**QuantityTrackingPanel**:
- Grid layout for data display
- Color-coded status indicators
- Gap calculation logic (similar to capacity tracking)

**TradeFinalizationPanel**:
- Progressive phase system
- Conditional visibility
- Callback to parent on completion

### Unique Features

**TransportManagementPanel**:
- Three distinct phases (vs two for others)
- Nested BidCard sub-component
- Progress bar visualization
- Multiple company responses handling
- Approve/reject dual-action pattern

---

**Document Version**: 1.0
**Last Updated**: October 19, 2025
**Component Status**: ✅ IMPLEMENTED
