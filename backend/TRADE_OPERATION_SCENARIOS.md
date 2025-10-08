# Trade Operation Scenarios - Complete End-to-End Flow

## Overview
This document outlines all possible scenarios during a trade operation from the perspective of each user type involved: Admin, Buyer, Seller, Inspector, and Transporter.

---

## 📊 Trade Operation Phases

```
INITIATION → SELLER_MATCHING → SELLER_NEGOTIATION → INSPECTION_PENDING → 
TRANSPORT_MATCHING → TRANSPORT_BIDDING → IN_TRANSIT → DELIVERED → COMPLETED
```

---

## 👤 User Roles & Responsibilities

### 1. ADMIN (Platform Operator)
- Creates and manages trade operations
- Monitors all phases
- Intervenes in disputes
- Approves transport bids
- Finalizes trades

### 2. BUYER
- Creates buy listings
- Reviews trade progress
- Confirms delivery receipt
- Rates service

### 3. SELLER (Farmer)
- Creates sale listings
- Responds to offers
- Prepares goods for inspection
- Coordinates pickup

### 4. INSPECTOR
- Verifies product quality
- Documents conditions
- Approves/rejects goods
- Uploads inspection reports

### 5. TRANSPORTER
- Views transport requests
- Submits bids
- Executes delivery
- Updates location

---

## 🔄 PHASE 1: INITIATION

### Scenario 1.1: Buyer Places Order
**Trigger:** Buyer creates a buy listing
```
Buyer Action:
- Specifies product, quantity, max price, delivery date
- Sets delivery location
- Submits buy listing

System Response:
- Creates buy listing with status: ACTIVE
- Notifies admin dashboard
- Triggers matching algorithm

Other Users:
- Admin: Sees new buy listing, can create trade operation
- Sellers: Not yet notified
```

### Scenario 1.2: Admin Creates Trade Operation
**Trigger:** Admin reviews buy listing and initiates trade
```
Admin Action:
- Reviews buy listing details
- Sets target profit margin (5-20%)
- Configures trade parameters
- Creates trade operation

System Response:
- Generates operation number (e.g., TO-2024-001)
- Sets phase: SELLER_MATCHING
- Calculates target costs
- Initiates seller search

Other Users:
- Buyer: Receives notification of trade initiation
- Sellers: System begins matching process
```

### Scenario 1.3: Insufficient Budget
**Trigger:** Buyer's max price too low for profitable trade
```
System Detection:
- Margin calculation shows < 5% profit possible
- No sellers available within price range

Admin Action:
- Reviews constraint
- Options:
  a) Negotiate with buyer for higher price
  b) Wait for market conditions to change
  c) Cancel trade operation

Resolution:
- If price adjusted: Continue to matching
- If cancelled: Notify buyer with explanation
```

---

## 🔍 PHASE 2: SELLER_MATCHING

### Scenario 2.1: Multiple Sellers Found
**Trigger:** System finds sellers matching criteria
```
System Process:
- Queries active sale listings
- Filters by:
  - Product match
  - Price ≤ 95% of buyer's max
  - Quantity available
  - Location proximity
  - Quality standards

Admin View:
- List of matching sellers with scores
- Price comparisons
- Distance calculations
- Quality ratings

Admin Action:
- Reviews recommendations
- Selects 1-3 sellers
- Allocates quantities to each
- Proceeds to negotiation
```

### Scenario 2.2: No Sellers Match
**Trigger:** No sellers meet all criteria
```
System Alert:
- No matches found notification

Admin Options:
a) Expand search radius
b) Adjust quality requirements
c) Wait for new sellers
d) Manually search inactive listings

Admin Action:
- Modifies parameters
- Re-runs matching
- OR manually invites specific sellers
```

### Scenario 2.3: Partial Quantity Match
**Trigger:** Sellers found but insufficient total quantity
```
Example:
- Buyer needs: 500 tons
- Seller A has: 200 tons
- Seller B has: 150 tons
- Total available: 350 tons

Admin Decision:
a) Proceed with partial fulfillment
b) Find additional sellers
c) Split into multiple trade operations
d) Wait for more inventory

System Handling:
- Allows multiple sellers per trade
- Tracks quantity from each
- Adjusts logistics accordingly
```

---

## 💰 PHASE 3: SELLER_NEGOTIATION

### Scenario 3.1: Initial Offer Sent
**Trigger:** Admin sends offers to selected sellers
```
Admin Action:
- Sets offer price (usually 2-5% above seller's ask)
- Sets quantity needed from each seller
- Sets 48-hour expiration
- Includes terms & conditions

Seller Receives:
- Offer notification (SMS + In-app)
- Offer details:
  - Price per unit
  - Quantity requested
  - Pickup window
  - Payment terms
  - Expiration countdown

Seller Options:
a) Accept offer
b) Counter-offer
c) Reject offer
d) Let expire (auto-reject after 48hrs)
```

### Scenario 3.2: Seller Accepts Immediately
**Trigger:** Seller accepts offer as-is
```
Seller Action:
- Reviews offer
- Clicks "Accept"
- Confirms availability

System Response:
- Updates negotiation status: ACCEPTED
- Locks inventory
- Notifies admin
- Triggers inspection scheduling

Admin Next Steps:
- Reviews acceptance
- Proceeds to inspection phase
```

### Scenario 3.3: Seller Counter-Offers
**Trigger:** Seller wants different terms
```
Seller Action:
- Proposes new price (e.g., +5%)
- OR adjusts quantity available
- OR requests different pickup date
- Adds explanation

Admin Receives:
- Counter-offer alert
- Profit impact analysis
- Shows new margin if accepted

Admin Options:
a) Accept counter-offer
b) Make new counter-offer
c) Reject and find alternative seller
d) Negotiate via direct communication

System Limits:
- Max 5 rounds of negotiation
- Each round extends expiry by 24hrs
```

### Scenario 3.4: Multiple Seller Negotiations
**Trigger:** Managing parallel negotiations
```
Situation:
- Seller A: Accepted at 240/ton
- Seller B: Countered at 250/ton
- Seller C: No response yet

Admin Strategy:
- Can accept Seller A immediately
- Continue negotiating with B
- Set deadline for C
- May over-commit initially (first-come-first-served)

System Handling:
- Tracks each negotiation independently
- Calculates cumulative profit impact
- Alerts if quantity exceeds need
```

### Scenario 3.5: Offer Expiration
**Trigger:** 48 hours pass without response
```
System Process:
- Auto-marks as EXPIRED
- Releases any reserved inventory
- Notifies admin

Admin Action:
- Can extend expiry (once)
- OR find replacement seller
- OR reduce total quantity

Seller Impact:
- Can no longer accept expired offer
- Must wait for new offer
- May lose opportunity
```

---

## 🔍 PHASE 4: INSPECTION_PENDING

### Scenario 4.1: Inspector Assignment
**Trigger:** Seller accepts offer
```
System Process:
- Identifies nearest available inspector
- Calculates travel time
- Estimates inspection duration

Inspector Receives:
- Job notification with priority level:
  - URGENT: < 24hrs to pickup
  - HIGH: 1-2 days
  - MEDIUM: 3-5 days
  - LOW: > 5 days
- Location details
- Product specifications
- Quantity to verify

Inspector Actions:
- Accepts/Declines assignment
- Schedules visit with seller
- Plans route if multiple inspections
```

### Scenario 4.2: Inspection Execution
**Trigger:** Inspector arrives at seller location
```
Inspector Process:
1. Verifies seller identity
2. Locates product
3. Checks:
   - Quantity (weight/count)
   - Quality (grade/condition)
   - Storage conditions
   - Contamination
   - Documentation
4. Takes photos/videos
5. Samples for testing (if required)

Digital Documentation:
- Uses mobile app forms
- Uploads photos in real-time
- Records GPS location
- Gets seller signature

Possible Outcomes:
a) PASSED - All criteria met
b) CONDITIONAL - Minor issues
c) FAILED - Major problems
```

### Scenario 4.3: Inspection Failure
**Trigger:** Product doesn't meet standards
```
Inspector Findings:
- Quality below specified grade
- OR quantity less than claimed
- OR contamination detected
- OR documentation missing

Inspector Action:
- Documents all issues
- Takes evidence photos
- Submits failure report

System Response:
- Notifies admin immediately
- Pauses trade operation
- Alerts seller of issues

Admin Options:
a) Negotiate price reduction
b) Accept partial quantity
c) Give seller time to remedy
d) Cancel seller from trade
e) Find replacement seller

Seller Options:
- Dispute findings
- Offer discount
- Fix issues and re-inspect
- Withdraw from trade
```

### Scenario 4.4: Partial Approval
**Trigger:** Some products pass, others fail
```
Example:
- 300 tons Grade A (pass)
- 200 tons Grade B (expected Grade A)

Admin Decision:
- Accept all at reduced price
- OR accept only Grade A
- OR reject entire lot

System Handling:
- Adjusts quantities
- Recalculates profits
- Updates transport requirements
```

### Scenario 4.5: Inspector No-Show
**Trigger:** Inspector doesn't arrive as scheduled
```
Seller Reports:
- Inspector didn't arrive
- Can't reach inspector

System Response:
- Attempts to contact inspector
- Alerts admin

Admin Action:
- Reassigns to new inspector
- Expedites if urgent
- Compensates seller for delay
```

---

## 🚚 PHASE 5: TRANSPORT_MATCHING

### Scenario 5.1: Creating Transport Request
**Trigger:** All inspections passed
```
System Automatically:
- Calculates total weight/volume
- Identifies pickup points
- Sets delivery destination
- Estimates distance
- Determines vehicle requirements

Admin Reviews & Adjusts:
- Pickup windows
- Delivery deadline
- Special requirements (refrigeration, etc.)
- Budget range
- Opens bidding to transporters
```

### Scenario 5.2: Multi-Pickup Logistics
**Trigger:** Multiple sellers in different locations
```
Complexity:
- Seller A: 200 tons in Location X
- Seller B: 150 tons in Location Y  
- Seller C: 150 tons in Location Z
- Delivery: Single destination

System Optimization:
- Calculates optimal route
- Estimates total time
- Determines if single/multiple trucks needed

Transporter Considerations:
- Reviews all pickup points
- Plans route sequence
- Calculates total bid
```

---

## 🏷️ PHASE 6: TRANSPORT_BIDDING

### Scenario 6.1: Multiple Bids Received
**Trigger:** Transport request open for bidding
```
Transporters See:
- Request details
- Weight/volume
- Pickup/delivery locations
- Time windows
- Special requirements

Transporters Submit:
- Bid amount
- Estimated duration
- Vehicle type/capacity
- Available dates
- Insurance coverage

Admin Receives:
- Bid comparison table
- Transporter ratings
- Past performance data
- Price vs. budget analysis
```

### Scenario 6.2: Bid Evaluation
**Trigger:** Bidding deadline reached
```
Admin Evaluates:
- Price (40% weight)
- Reputation (30% weight)
- Equipment match (20% weight)
- Availability (10% weight)

System Assists:
- Ranks bids by score
- Flags concerns (new transporter, bad reviews)
- Shows profit impact of each bid

Admin Decision:
- Accepts best bid
- OR negotiates with preferred bidder
- OR extends bidding period
- OR cancels and seeks direct assignment
```

### Scenario 6.3: No Bids Received
**Trigger:** Deadline passes without bids
```
Possible Reasons:
- Price too low
- Route not attractive
- Timing conflicts
- Special requirements too restrictive

Admin Actions:
- Increase budget
- Extend deadline
- Remove restrictions
- Directly invite specific transporters
- Split into smaller requests
```

### Scenario 6.4: Bid Withdrawal
**Trigger:** Transporter withdraws bid after submission
```
Transporter Reason:
- Vehicle breakdown
- Got better job
- Realized can't meet requirements

System Handling:
- Notifies admin immediately
- If bid was accepted: URGENT alert
- Shows next best bid

Admin Recovery:
- Quickly accepts next bid
- OR re-opens bidding
- OR assigns backup transporter
```

---

## 📦 PHASE 7: IN_TRANSIT

### Scenario 7.1: Pickup Execution
**Trigger:** Transporter arrives at seller location
```
Transporter Process:
1. Checks in via app (GPS verified)
2. Meets seller
3. Verifies inspection seal/docs
4. Supervises loading
5. Weighs loaded vehicle
6. Takes photos of loaded goods
7. Gets seller signature
8. Marks pickup complete

Seller Process:
1. Prepares goods for loading
2. Provides labor/equipment
3. Confirms quantity loaded
4. Signs digital waybill
5. Receives pickup confirmation

System Updates:
- Status: IN_TRANSIT
- Sends notifications to admin, buyer
- Starts delivery tracking
```

### Scenario 7.2: Multiple Pickup Coordination
**Trigger:** Transporter doing sequential pickups
```
Route Example:
- 8:00 AM - Arrive Seller A
- 10:00 AM - Depart Seller A (200 tons loaded)
- 11:00 AM - Arrive Seller B
- 1:00 PM - Depart Seller B (+ 150 tons)
- 2:30 PM - Arrive Seller C
- 4:30 PM - Depart Seller C (+ 150 tons)

Tracking:
- Real-time location updates
- Pickup confirmations at each stop
- Cumulative weight tracking
- ETA updates to buyer
```

### Scenario 7.3: Transit Issues
**Trigger:** Problems during transport
```
A) Vehicle Breakdown:
- Transporter reports issue
- Provides location & estimated delay
- Admin notified immediately
- May need replacement vehicle
- Updates buyer on delay

B) Weather Delays:
- Road closures
- Safety stops required
- Admin tracks via GPS
- Adjusts delivery expectations

C) Accident:
- Emergency protocols activated
- Insurance claim initiated
- Product condition assessed
- Possible replacement needed
```

### Scenario 7.4: Route Deviation
**Trigger:** Transporter goes off planned route
```
System Detection:
- GPS shows unexpected location
- Excessive stop duration
- Route efficiency alert

Admin Action:
- Contacts transporter
- Verifies reason
- Documents deviation
- May impose penalties
```

---

## 📍 PHASE 8: DELIVERED

### Scenario 8.1: Successful Delivery
**Trigger:** Transporter arrives at buyer location
```
Delivery Process:
1. Transporter checks in at destination
2. Buyer/receiver verifies:
   - Quantity delivered
   - Condition of goods
   - Documentation complete
3. Unloading supervised
4. Final weight check
5. Both parties sign confirmation

System Updates:
- Status: DELIVERED
- Triggers payment processing
- Requests buyer rating
- Calculates final costs
```

### Scenario 8.2: Buyer Rejection at Delivery
**Trigger:** Buyer refuses to accept goods
```
Buyer Reasons:
- Quality degradation during transport
- Quantity discrepancy
- Wrong product delivered
- Excessive delay
- Contamination discovered

Immediate Actions:
1. Document issues with photos
2. Contact admin urgently
3. Hold goods on vehicle

Admin Resolution:
- Reviews evidence
- May order re-inspection
- Negotiates resolution:
  - Discount for buyer
  - Partial acceptance
  - Return to seller
  - Insurance claim
```

### Scenario 8.3: Quantity Discrepancy
**Trigger:** Delivered amount doesn't match loaded amount
```
Example:
- Loaded: 500 tons
- Delivered: 485 tons
- Discrepancy: 15 tons (3%)

Investigation:
- Check weight tickets
- Review transit records
- Normal loss vs. theft
- Weather impact (moisture loss)

Resolution:
- If within acceptable loss (2-3%): Proceed
- If excessive: Investigation required
- Adjust final payment accordingly
```

### Scenario 8.4: After-Hours Delivery
**Trigger:** Arrival outside business hours
```
Transporter Situation:
- Arrives at 8 PM
- Buyer facility closed
- Can't unload

Options:
1. Wait overnight (demurrage charges)
2. Return next day
3. Emergency unloading crew
4. Temporary storage nearby

Cost Implications:
- Extra charges negotiated
- Responsibility determined
- Admin mediates if needed
```

---

## ✅ PHASE 9: COMPLETED

### Scenario 9.1: Trade Finalization
**Trigger:** All deliveries confirmed
```
Admin Process:
1. Reviews all documentation
2. Calculates final costs:
   - Purchase costs (to sellers)
   - Inspection fees
   - Transport costs
   - Platform commission
3. Confirms profit margin achieved
4. Processes payments

Payment Distribution:
- Sellers: Receive payment minus platform fee (2.5%)
- Inspector: Receives inspection fee
- Transporter: Receives agreed amount
- Platform: Collects commission (Seller: 2.5%, Buyer: 1.5%)
```

### Scenario 9.2: Dispute Resolution
**Trigger:** Any party raises complaint post-delivery
```
Common Disputes:
- Payment delays
- Quality claims
- Quantity disputes
- Service complaints

Resolution Process:
1. Formal complaint filed
2. Evidence gathered
3. Admin investigation
4. Mediation attempted
5. Decision rendered
6. Possible compensation/penalties
```

### Scenario 9.3: Ratings & Feedback
**Trigger:** Trade marked complete
```
Rating Requests:
- Buyer rates: Seller, Transporter, Overall
- Seller rates: Platform, Payment speed
- Transporter rates: Seller cooperation, Buyer cooperation

Impact:
- Affects future matching
- Influences bid acceptance
- May trigger rewards/penalties
```

---

## 🚨 EXCEPTIONAL SCENARIOS

### E1: Trade Cancellation Mid-Process
**Trigger:** Major issue requires cancellation
```
Cancellation Points:
- Before inspection: Minimal cost
- After inspection: Inspector compensated
- After transport bid accepted: Penalties apply
- During transit: Major penalties + return costs

Responsibility Assignment:
- Buyer fault: Buyer pays costs
- Seller fault: Seller pays costs
- Force majeure: Costs shared/insured
```

### E2: Emergency Re-routing
**Trigger:** Original buyer can't receive
```
Admin Actions:
1. Find alternative buyer quickly
2. Negotiate price adjustment
3. Redirect transporter
4. Update all documentation
5. Recalculate profits
```

### E3: Multi-Party Failure
**Trigger:** Multiple sellers fail inspection
```
Crisis Management:
1. Assess total shortfall
2. Emergency seller search
3. Buyer notification/negotiation
4. Possible partial fulfillment
5. Future order priority
```

### E4: Platform Intervention
**Trigger:** Automated systems fail
```
Manual Override Scenarios:
- Payment system down
- Matching algorithm error
- Communication failure
- Data corruption

Admin Manual Process:
- Direct coordination via phone
- Manual record keeping
- Paper documentation
- Later system reconciliation
```

---

## 📱 USER NOTIFICATION MATRIX

| Event | Admin | Buyer | Seller | Inspector | Transporter |
|-------|-------|--------|---------|-----------|-------------|
| Trade Created | ✅ Instant | ✅ Instant | - | - | - |
| Seller Matched | ✅ Instant | ℹ️ Summary | ✅ If selected | - | - |
| Offer Sent | ✅ Log | - | ✅ Instant + SMS | - | - |
| Offer Response | ✅ Instant | ℹ️ Daily | ✅ Confirm | - | - |
| Inspection Scheduled | ✅ Log | ℹ️ Update | ✅ Instant | ✅ Instant | - |
| Inspection Result | ✅ Instant | ✅ If failed | ✅ Instant | ✅ Confirm | - |
| Transport Request | ✅ Log | - | - | - | ✅ Broadcast |
| Bid Received | ✅ Instant | - | - | - | ✅ Confirm |
| Bid Accepted | ✅ Log | ℹ️ Update | ℹ️ Prep notice | - | ✅ Instant |
| Pickup Started | ✅ Log | ℹ️ Update | ✅ Instant | - | ✅ Confirm |
| In Transit | ✅ Tracking | ✅ Tracking | ✅ Complete | - | ✅ Active |
| Delivery Near | ✅ Log | ✅ 1hr warning | - | - | ✅ Active |
| Delivered | ✅ Instant | ✅ Instant | ✅ Payment coming | - | ✅ Complete |
| Payment Sent | ✅ Log | ✅ Charged | ✅ Received | ✅ Received | ✅ Received |
| Ratings Request | - | ✅ In-app | ✅ In-app | - | ✅ In-app |

Legend:
- ✅ Instant: Real-time notification (Push + In-app)
- ℹ️: Information update (In-app only)
- SMS: Additional SMS notification
- Log: Logged for review
- (-): Not notified

---

## 💼 BUSINESS RULES

### Timing Rules
- Offer expiry: 48 hours default
- Inspection window: Within 72 hours of acceptance
- Bidding period: 24-48 hours
- Payment terms: Within 7 days of delivery
- Dispute window: 48 hours after delivery

### Financial Rules
- Minimum profit margin: 5%
- Maximum profit margin: 20%
- Seller commission: 2.5%
- Buyer commission: 1.5%
- Cancellation penalty: 10% of trade value
- Late delivery penalty: 1% per day

### Operational Rules
- Maximum sellers per trade: 5
- Maximum pickup points: 10
- Maximum negotiation rounds: 5
- Minimum bid count to proceed: 1
- Maximum transit time: Based on distance + 24hrs

### Quality Standards
- Acceptable quantity variance: 2-3%
- Quality grade tolerance: 1 level
- Documentation requirements: Government standards
- Insurance minimum: Trade value + 20%

---

## 🔄 STATE RECOVERY

### System Failure Recovery
Each phase has checkpoint saves:
1. Before phase transition
2. After critical operations
3. Before external communications

Recovery Process:
1. Identify last successful checkpoint
2. Verify data consistency
3. Resume from checkpoint
4. Notify affected users
5. Log incident

### Data Consistency Checks
- Quantity balances
- Payment calculations
- Status synchronization
- Document completeness
- User notification status

---

## 📈 SUCCESS METRICS

### Trade Operation KPIs
- Completion rate: >90%
- Average margin achieved: 7-10%
- Seller acceptance rate: >60%
- On-time delivery: >85%
- Dispute rate: <5%
- Payment delay: <2 days

### User Satisfaction Metrics
- Buyer satisfaction: >4.5/5
- Seller satisfaction: >4.0/5
- Transporter satisfaction: >4.0/5
- Inspector efficiency: >5 inspections/day
- Platform NPS: >50

---

## 🛠️ CONTINUOUS IMPROVEMENT

### Data Collection Points
- Time per phase
- Bottleneck identification
- Failure points
- User friction areas
- Cost overruns

### Optimization Opportunities
- Matching algorithm refinement
- Route optimization
- Negotiation automation
- Inspection scheduling
- Payment processing

### Feedback Loops
- Post-trade surveys
- Quarterly user reviews
- Issue pattern analysis
- Market condition adjustments
- Regulatory compliance updates

---

## 📝 APPENDIX: Quick Decision Trees

### Admin: When to Cancel a Trade?
```
Is buyer responsive? → No → Wait 24hrs → Still No? → Cancel
                    ↓
                    Yes
                    ↓
Are sellers available? → No → Waited 48hrs? → No matches? → Cancel
                      ↓
                      Yes
                      ↓
Is margin >5%? → No → Can adjust price? → No → Cancel
              ↓
              Yes
              ↓
              Proceed
```

### Seller: Accept or Counter?
```
Is price fair? → Yes → Quantity available? → Yes → Accept
            ↓                           ↓
            No                          No
            ↓                           ↓
      Can do better? → Yes → Counter   Offer partial
            ↓
            No
            ↓
          Reject
```

### Transporter: Bid or Pass?
```
Route profitable? → No → Pass
                ↓
                Yes
                ↓
Equipment available? → No → Pass
                   ↓
                   Yes
                   ↓
              Can meet deadline? → No → Pass
                               ↓
                               Yes
                               ↓
                        Submit competitive bid
```

---

*End of Document - Version 1.0*
*Last Updated: September 2025*
*Total Scenarios Covered: 50+*