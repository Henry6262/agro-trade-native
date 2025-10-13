# How to Use the Multi-Agent System in Agro-Trade

## 🎯 What Is This?

This is a **coordinated autonomous development system** where specialized AI agents work together to build features across your mobile app, backend, and admin dashboard.

Instead of you manually coordinating between frontend and backend, or remembering to update contracts, or running tests - **specialized agents do this automatically, coordinated by a Product Architect agent**.

---

## 🚀 Quick Start

### Starting a New Feature

```bash
User: "Let's add price alerts for buyers when products drop below their target price"

# The Product Architect agent will:
# 1. Plan the feature across mobile + backend
# 2. Update contracts (WebSocket event for price alerts)
# 3. Deploy Mobile Lead to build UI
# 4. Deploy Backend Lead to build monitoring system
# 5. Monitor progress via INTEGRATION_STATUS.json
# 6. Run integration tests
# 7. Report back when complete
```

### Fixing a Bug

```bash
User: "Counter-offer endpoint is returning 500 error"

# The Product Architect will:
# 1. Deploy Backend Lead to fix the bug
# 2. Backend Lead debugs, fixes, writes regression test
# 3. Integration tests run to verify fix
# 4. Reports back to you
```

### Running Tests

```bash
User: "Run full integration tests"

# Integration Test Lead will:
# 1. Test API contract compliance
# 2. Test end-to-end flows
# 3. Test cross-platform integration
# 4. Generate TEST_REPORT.json
# 5. Report pass/fail to you
```

---

## 📁 What Was Created

### Agent Identity Files (`.claude/`)

These define the "personality" and responsibilities of each agent:

- **ARCHITECT.md** - The coordinator who plans and monitors everything
- **MOBILE_LEAD.md** - React Native expert for mobile app (coming next)
- **BACKEND_LEAD.md** - NestJS expert for backend APIs (coming next)
- **ADMIN_DASHBOARD_LEAD.md** - React expert for admin tools (coming next)
- **INTEGRATION_TEST_LEAD.md** - Testing specialist (coming next)
- **SCENARIO_TEST_LEAD.md** - Trade flow scenario tester (coming next)

### Coordination Files (`coordination/`)

These are the "bulletin board" where agents post updates:

- **INTEGRATION_STATUS.json** - Real-time status of all work (will create)
- **TEST_REPORT.json** - Latest test results (will create)
- **SPRINT_PLAN.json** - Current sprint milestones (will create)

### Contract Files (`contracts/`)

These are "THE LAW" - the interface between mobile/backend/admin:

- **api-contract.ts** - Every API endpoint defined (will create)
- **event-contract.ts** - Every WebSocket event defined (will create)
- **database-schema.prisma** - Source of truth for DB (will link existing)

---

## 🔄 How It Works

### The Coordination Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. YOU SAY: "Build feature X"                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ 2. PRODUCT ARCHITECT SPAWNS                                  │
│    - Reads INTEGRATION_STATUS.json (what's done)            │
│    - Plans the feature across mobile/backend/admin          │
│    - Updates contracts if needed                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┴──────────────────┐
          │                                    │
┌─────────▼──────────┐              ┌─────────▼──────────┐
│ 3. MOBILE LEAD     │              │ 3. BACKEND LEAD    │
│    - Builds UI     │◄────────────►│    - Builds API    │
│    - Uses contract │  (coordinate) │    - Follows       │
│      for API calls │              │      contract      │
└─────────┬──────────┘              └─────────┬──────────┘
          │                                    │
          │  Both update INTEGRATION_STATUS    │
          │  as they work                      │
          │                                    │
          └─────────────────┬──────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ 4. INTEGRATION TEST LEAD SPAWNS                              │
│    - Validates API contract matches                         │
│    - Tests end-to-end flow (mobile → backend)               │
│    - Generates TEST_REPORT.json                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ 5. PRODUCT ARCHITECT REPORTS BACK                            │
│    - "Feature complete, all tests passing"                  │
│    OR                                                        │
│    - "Found issues in testing, fixing now..."               │
└─────────────────────────────────────────────────────────────┘
```

### The Magic: Async Coordination via Status Files

Instead of agents "talking" to each other, they read/write shared status files:

**Mobile Lead finishes milestone:**
```json
// Updates INTEGRATION_STATUS.json
{
  "mobile": {
    "milestones": {
      "active_operations_tab": {
        "status": "COMPLETED",
        "completedDate": "2025-10-09T14:00:00Z"
      }
    }
  }
}
```

**Backend Lead checks status:**
```json
// Reads INTEGRATION_STATUS.json
// Sees mobile is done
// Knows it's safe to run integration tests
```

**Product Architect monitors:**
```json
// Checks INTEGRATION_STATUS.json every hour
// Sees both mobile and backend COMPLETED
// Deploys Integration Test Lead
```

---

## 🎯 Key Concepts

### 1. Contracts Are THE LAW

```typescript
// contracts/api-contract.ts defines:
{
  negotiations: {
    counterOffer: {
      method: 'POST',
      path: '/negotiations/:id/counter',
      request: {
        counterPrice: 'number',
        quantity: 'number'
      },
      response: {
        success: 'boolean',
        data: { negotiation: 'Negotiation' }
      }
    }
  }
}
```

- **Backend** must implement EXACTLY this endpoint
- **Mobile** must call EXACTLY this endpoint
- **Integration tests** validate they match
- **Nobody** can diverge without breaking tests

### 2. Status Files = Coordination Hub

```json
// INTEGRATION_STATUS.json is the "bulletin board"
{
  "mobile": {
    "currentWork": "Building Active Operations Tab",
    "milestones": {
      "active_operations_tab": {
        "status": "IN_PROGRESS",
        "progress": "70% - UI complete, testing API integration"
      }
    }
  },
  "backend": {
    "currentWork": "Negotiation APIs",
    "milestones": {
      "negotiation_endpoints": {
        "status": "COMPLETED"
      }
    }
  },
  "coordination": {
    "blockers": [],
    "dependencies": [
      {
        "dependent": "mobile.potential_sellers_list",
        "dependsOn": "backend.matching_sellers_endpoint",
        "status": "WAITING"
      }
    ]
  }
}
```

Agents update this file as they work. Architect monitors it for:
- Progress
- Blockers
- Dependencies resolved

### 3. Autonomous with Quality Gates

Agents work **independently** (fast) but can't mark a sprint complete without:
- All P0 milestones COMPLETED
- Integration tests showing PASS
- No unresolved P0 blockers

This gives you speed + safety.

### 4. Escalation Protocol

```
Agent hits blocker → Updates INTEGRATION_STATUS.json
                       ↓
              Product Architect sees it (< 30 min)
                       ↓
              Architect resolves or deploys fix
                       ↓
              Blocked agent continues work
```

No agent spins for hours stuck on a problem.

---

## 📋 Practical Examples

### Example 1: Adding Real-Time Features

```
User: "Add real-time notifications when offers are countered"

Architect's Plan:
┌─────────────────────────────────────────────────────────┐
│ Step 1: Update contracts                                 │
│ - Add WebSocket event: NEGOTIATION_UPDATED              │
├─────────────────────────────────────────────────────────┤
│ Step 2: Backend implementation                           │
│ - Add WebSocket gateway                                 │
│ - Emit event when negotiation changes                   │
├─────────────────────────────────────────────────────────┤
│ Step 3: Mobile implementation                            │
│ - Add WebSocket listener                                │
│ - Show toast notification when event received           │
├─────────────────────────────────────────────────────────┤
│ Step 4: Integration testing                              │
│ - Create negotiation on backend                         │
│ - Verify mobile receives WebSocket event                │
│ - Verify notification displays                          │
└─────────────────────────────────────────────────────────┘

Deployment:
1. Architect updates contracts/event-contract.ts
2. Deploys Backend Lead: "Implement NEGOTIATION_UPDATED event"
3. Deploys Mobile Lead: "Add WebSocket listener for notifications"
4. Both work in parallel
5. Integration Test Lead validates event flow
6. Reports back: "Real-time notifications working ✅"
```

### Example 2: Handling Database Changes

```
User: "Add 'notes' field to negotiations"

Architect's Plan:
┌─────────────────────────────────────────────────────────┐
│ Step 1: Update database contract                         │
│ - Add 'notes' field to Negotiation model               │
├─────────────────────────────────────────────────────────┤
│ Step 2: Backend migration                                │
│ - Create Prisma migration                               │
│ - Update DTOs to include notes                          │
│ - Update API contract                                   │
├─────────────────────────────────────────────────────────┤
│ Step 3: Mobile UI                                        │
│ - Add notes input field                                 │
│ - Display notes in negotiation details                  │
├─────────────────────────────────────────────────────────┤
│ Step 4: Admin dashboard                                  │
│ - Show notes in negotiation viewer                      │
└─────────────────────────────────────────────────────────┘

Key: Backend must finish migration BEFORE mobile can use it.

INTEGRATION_STATUS.json:
{
  "backend": {
    "milestones": {
      "notes_field_migration": {
        "status": "IN_PROGRESS"
      }
    }
  },
  "mobile": {
    "milestones": {
      "notes_ui": {
        "status": "PENDING",
        "blockedBy": "backend.notes_field_migration"
      }
    }
  }
}

When backend completes:
- Updates status to "COMPLETED"
- Mobile Lead sees dependency resolved
- Starts building notes UI
```

### Example 3: Debugging Integration Issues

```
Scenario: Mobile app shows "500 Internal Server Error" when accepting offer

Your Action: "Debug the accept offer endpoint"

Architect's Response:
┌─────────────────────────────────────────────────────────┐
│ Deploying Backend Lead to debug...                       │
└─────────────────────────────────────────────────────────┘

Backend Lead:
1. Checks backend logs
2. Finds error: "Cannot read property 'price' of undefined"
3. Root cause: Negotiation.currentOffer is null for expired offers
4. Fix: Add validation to reject expired offers
5. Writes regression test
6. Updates INTEGRATION_STATUS.json:
   {
     "backend": {
       "milestones": {
         "accept_offer_bug_fix": {
           "status": "COMPLETED",
           "details": {
             "bug": "Expired offers caused 500 error",
             "fix": "Added expiry validation",
             "tested": true
           }
         }
       }
     }
   }

Integration Test Lead:
1. Runs tests including new regression test
2. Verifies accept offer now returns 400 for expired offers
3. Generates TEST_REPORT.json: "PASS"

Architect Reports: "Bug fixed ✅ Accept offer now validates expiry"
```

---

## 🛠️ What You Need to Do

### Phase 1: Complete Setup (Next Steps)

I've created:
- ✅ Architecture document (MULTI_AGENT_SYSTEM.md)
- ✅ Product Architect identity (ARCHITECT.md)
- ✅ Directory structure

Still need to create:
- [ ] MOBILE_LEAD.md
- [ ] BACKEND_LEAD.md
- [ ] ADMIN_DASHBOARD_LEAD.md
- [ ] INTEGRATION_TEST_LEAD.md
- [ ] contracts/api-contract.ts
- [ ] contracts/event-contract.ts
- [ ] coordination/INTEGRATION_STATUS.json (initial state)

### Phase 2: First Test Run

Once setup complete, we'll test the system:

```
Test: "Add a simple feature using the multi-agent system"

Example: "Add 'mark as favorite' for sale listings"

Expected:
1. Product Architect plans it
2. Deploys Backend + Mobile leads
3. Both update contracts and implement
4. Integration tests validate
5. Feature complete in < 2 hours

This validates the system works end-to-end.
```

### Phase 3: Iterate and Improve

After first test:
- Review what worked well
- Update agent identities based on learnings
- Expand integration test suite
- Build scenario test library

---

## 🎓 Benefits You'll Get

### 1. **Automatic Coordination**
- No more "did you deploy the backend yet?"
- Agents know when dependencies are ready
- Status files keep everyone in sync

### 2. **Enforced Best Practices**
- Contracts prevent frontend/backend drift
- Quality gates prevent broken deployments
- Agents follow standards automatically

### 3. **Faster Development**
- Mobile + Backend work in parallel
- No waiting for manual coordination
- Automated testing catches issues early

### 4. **Better Testing**
- Integration tests run automatically
- Scenario tests validate business logic
- TEST_REPORT.json shows exactly what passed/failed

### 5. **Clear Responsibility**
- Each agent has a defined domain
- No confusion about who does what
- Blockers escalate automatically

---

## 📞 How to Use Daily

### Morning Routine
```bash
User: "Let's start today's work"

# Architect reviews yesterday, plans today
# Deploys agents with clear objectives
# You can step away while they work
```

### During the Day
```bash
# Check progress anytime:
User: "What's the status?"

# Architect reads INTEGRATION_STATUS.json
# Reports: "Mobile 80% done, Backend 100% done, 1 blocker in progress"
```

### Evening Routine
```bash
User: "Run integration tests"

# Integration Test Lead runs all tests
# Reports: "PASS - ready for deployment"
# Or: "FAIL - 2 issues found, creating blockers for tomorrow"
```

---

## ⚠️ Important Notes

### Contracts Are Sacred
- Never manually change API calls without updating contract
- Never add backend endpoint without updating contract
- Integration tests will catch drift immediately

### Trust the Status Files
- INTEGRATION_STATUS.json is source of truth
- Don't ask agents "are you done?" - check the status file
- Agents update it religiously

### Let Agents Escalate
- Agents trained to escalate blockers quickly
- Don't let them spin on problems
- Product Architect resolves blockers fast

### Quality Gates Are Non-Negotiable
- Tests must pass before sprint complete
- No "we'll fix it later"
- This discipline prevents tech debt

---

## 🚀 Next Steps

**Right now, let me know:**

1. **Should I finish creating all the agent identity files?**
   - MOBILE_LEAD.md
   - BACKEND_LEAD.md
   - etc.

2. **Should I create the initial contracts?**
   - api-contract.ts (based on your existing APIs)
   - event-contract.ts (for WebSocket events)

3. **Should I initialize INTEGRATION_STATUS.json?**
   - With your current phase (004-trade-operation-management)
   - Current milestones from the roadmap

4. **Or should we test it first with a simple feature?**
   - Pick a small feature
   - Run through the full cycle
   - See the system in action

**Your call - what would you like to do next?**

---

**Created**: 2025-10-09
**For**: Agro-Trade Multi-Agent Development System
**Your Guide**: Product Architect Agent
