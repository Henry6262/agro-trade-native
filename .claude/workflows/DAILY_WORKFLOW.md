# Daily Sequential Workflow

**Use this when**: Working on focused tasks in one component at a time.

---

## 🌅 Morning Routine (Session Start)

### 1. Check In

```
You: "What's our status?"

Orchestrator will:
├─ Read PROJECT_STATE.json
├─ Show component health (🟢🟡🔴)
├─ Show completion percentages
├─ Show current focus areas
└─ Report any blockers

Example Response:
"📊 Agro-Trade Status

🟢 Mobile: 65% - Active Operations Tab in progress
🟢 Backend: 80% - Negotiation APIs complete
🟢 Admin: 75% - Testing tools ready

Current Mode: Sequential
Health: All systems GREEN ✅
Blockers: None

Ready to work!"
```

### 2. Get Task Suggestion

```
You: "What's next?" OR "What should I work on?"

Orchestrator will:
├─ Read TASK_QUEUE.json (if exists)
├─ Analyze PROJECT_STATE.json
├─ Consider priorities (P0 > P1 > P2)
├─ Check dependencies (what's unblocked)
└─ Suggest specific task with context

Example Response:
"Top priority tasks:

1. [P0] Complete counter-offer UI (mobile) ⭐
   - Status: 70% done
   - Remaining: UI implementation + testing
   - Estimated: 2 hours
   - Blockers: None ✅

2. [P1] Add offer expiry countdown (mobile)
   - Status: Ready to start
   - Estimated: 1.5 hours
   - Blockers: None ✅

Recommendation: Complete task #1 (counter-offer UI)
It's almost done and unblocks negotiation flow.

Ready to proceed?"
```

### 3. Start Working

```
You: "Let's do it" OR "Work on counter-offer UI"

Orchestrator will:
├─ Update PROJECT_STATE.json (mark task as current)
├─ Identify component (mobile/backend/admin)
├─ Deploy appropriate specialist agent
└─ Provide context to specialist

Example:
"✅ Deploying Mobile Lead for counter-offer UI...

Context:
- Task: Complete counter-offer UI
- Component: Mobile (React Native)
- Priority: P0
- Current Status: 70% complete
- Contracts: /contracts/api-contract.ts
- Time Estimate: 2 hours

[Mobile Lead taking over...]"
```

---

## 💻 During Work (Agent Execution)

### Specialist Agent Workflow

Once deployed, the specialist agent (Mobile/Backend/Admin Lead):

```
1. Read Identity
   ├─ Checks their .md file for responsibilities
   └─ Reviews technical standards

2. Read Contracts
   ├─ api-contract.ts (API endpoints)
   ├─ event-contract.ts (WebSocket events)
   └─ database-schema.prisma (data models)

3. Read Current State
   ├─ PROJECT_STATE.json (context)
   └─ Understands what's already done

4. Execute Work
   ├─ Writes code
   ├─ Follows patterns
   ├─ Tests locally
   └─ Updates progress

5. Test Thoroughly
   ├─ Unit tests
   ├─ Integration tests (if applicable)
   └─ Manual testing

6. Update State
   ├─ Updates PROJECT_STATE.json
   ├─ Marks task complete
   └─ Documents changes

7. Report Back
   └─ "✅ Task complete. Details: [...]"
```

### Progress Updates

Agents update PROJECT_STATE.json as they work:

```json
{
  "components": {
    "mobile": {
      "currentFocus": "Testing counter-offer UI",
      "lastUpdated": "2025-10-09T14:30:00Z"
    }
  },
  "activeTasks": {
    "current": {
      "id": "TASK-042",
      "title": "Complete counter-offer UI",
      "status": "TESTING",
      "progress": 90
    }
  }
}
```

### You Can Check Progress Anytime

```
You: "Show progress" OR "What's the status?"

Orchestrator reads state and reports:
"Current Task: Complete counter-offer UI
Progress: 90%
Status: Testing phase
Agent: Mobile Lead
Started: 2 hours ago

Recent updates:
- UI implementation complete ✅
- API integration complete ✅
- iOS testing complete ✅
- Android testing in progress... 🔄"
```

---

## ✅ Task Completion

### When Agent Finishes

```
Agent: "✅ Task complete! Counter-offer UI is done.

Deliverables:
- CounterOfferModal component
- Price and quantity inputs
- API integration with /negotiations/:id/counter
- Tested on iOS and Android
- Tests passing

Updated PROJECT_STATE.json:
- mobile.completionPercentage: 65% → 70%
- mobile.currentFocus: cleared
- Task moved to completed

Ready for next task."
```

### Orchestrator Suggests Next

```
Orchestrator: "Great! Counter-offer UI complete ✅

Updated status:
🟢 Mobile: 70% (+5%)

Next priority:
[P1] Add offer expiry countdown (mobile)
  - Shows 48-hour countdown timer
  - Visual indicators for expiring offers
  - Estimated: 1.5 hours
  - Ready to start

Should we proceed with this?"
```

### Your Options

```
Option 1: Continue with suggestion
You: "Yes" OR "Let's do it"

Option 2: Work on something else
You: "Work on [different task]"

Option 3: Switch components
You: "Switch to backend work"

Option 4: Build a feature
You: "Build [feature name]"

Option 5: Take a break
You: "That's enough for now"
```

---

## 🌆 Evening Routine (Session End)

### 1. Final Status Check

```
You: "Show today's progress"

Orchestrator:
"📊 Today's Summary

✅ Completed:
1. Counter-offer UI (mobile) - 2 hours
2. Offer expiry countdown (mobile) - 1.5 hours

📈 Progress:
- Mobile: 65% → 75% (+10%)
- Backend: 80% (no change)
- Admin: 75% (no change)

🎯 Milestones:
- Trade Operation Management Hub: 70% → 80%

⏰ Time Spent: 3.5 hours
🟢 Health: All GREEN
✅ Tests: Passing

Great work today! 🎉"
```

### 2. Run Tests (Optional but Recommended)

```
You: "Run tests"

Integration Test Lead:
├─ Runs integration tests
├─ Validates all components
├─ Checks contract compliance
└─ Generates test report

Result:
"🧪 Integration Tests Complete

✅ API Contract: PASS
✅ Mobile-Backend Sync: PASS
✅ End-to-End Flows: PASS
✅ Performance: PASS

Overall: PASS ✅

All systems validated. Safe to commit/deploy."
```

### 3. Plan Tomorrow (Optional)

```
You: "What should we focus on tomorrow?"

Orchestrator:
"Tomorrow's Priorities:

P0 Tasks (Must Do):
1. Potential sellers list (mobile)
   - Backend dependency now ready ✅
   - Can start immediately
   - Est: 3 hours

2. Negotiation acceptance flow (mobile)
   - Accept/Reject buttons
   - Est: 2 hours

P1 Tasks (Should Do):
3. Admin dashboard Phase 2
   - Enhanced scenario builder
   - Est: 4 hours

Total estimated: 5-9 hours of work available

Recommendation: Start with #1 (potential sellers list)"
```

---

## 🔄 Workflow Variations

### Variation 1: Hit a Blocker

```
Agent: "⚠️ Blocked

Task: Potential sellers list
Issue: Backend endpoint not ready yet
Expected: GET /trade-operations/:id/matching-sellers
Current: Endpoint returns 404

Cannot proceed without this endpoint."

Orchestrator (automatically):
"Blocker detected. Options:

1. Switch to backend to build missing endpoint
2. Work on different mobile task
3. Build a different feature

What would you prefer?"
```

### Variation 2: Bug Found

```
During testing, agent finds bug:

Agent: "🐛 Bug Found

While testing counter-offer:
- Issue: API returns 500 error
- Endpoint: POST /negotiations/:id/counter
- Error: 'Cannot read property price of undefined'

This is a backend issue. Should I:
1. Document bug and continue
2. Switch to Backend Lead to fix
3. Deploy debugger"

You decide: "Let's fix it now"

Orchestrator deploys Backend Lead to debug.
```

### Variation 3: Quick Task

```
You: "Fix the loading spinner color"

Orchestrator:
"Small task detected. Deploying Mobile Lead...

[Mobile Lead completes in 10 minutes]

✅ Done! Loading spinner updated to brand color.

What's next?"
```

---

## 🎯 Best Practices

### Do This ✅

1. **Start with status check**
   - Begin every session with "What's our status?"
   - Know where you are before planning where to go

2. **Trust the suggestions**
   - Orchestrator considers priorities, dependencies, blockers
   - Default to suggested task unless you have a reason

3. **Let agents finish**
   - Don't interrupt mid-task
   - Agents test thoroughly before marking complete

4. **Update when switching**
   - If you manually switch focus, tell Orchestrator
   - Keeps state files accurate

5. **Run tests regularly**
   - End of day or after major changes
   - Catch issues early

### Don't Do This ❌

1. **Don't skip status checks**
   - Flying blind leads to working on blocked tasks
   - Or duplicating work

2. **Don't work on blocked tasks**
   - Check dependencies first
   - Ask "What's unblocked?"

3. **Don't skip tests**
   - Untested code = technical debt
   - Integration issues compound

4. **Don't forget to update state**
   - If agent crashes or you interrupt
   - Manually update PROJECT_STATE.json

5. **Don't context switch too much**
   - Finish task before jumping to next
   - Sequential mode = focused work

---

## 📋 Example Full Session

```
=== Morning ===

You: "What's our status?"
Orchestrator: [Shows health, percentages, blockers]

You: "What's next?"
Orchestrator: "Complete counter-offer UI (mobile) - P0"

You: "Let's do it"
Mobile Lead: [Deploys, starts work]

=== 2 Hours Later ===

Mobile Lead: "✅ Counter-offer UI complete"
Orchestrator: "Great! Next: Offer expiry countdown?"

You: "Yes"
Mobile Lead: [Deploys, starts work]

=== 1.5 Hours Later ===

Mobile Lead: "✅ Offer expiry countdown complete"
Orchestrator: "Excellent! Next: Potential sellers list?"

You: "Let's take a break"

=== After Break ===

You: "What's next?"
Orchestrator: "Potential sellers list (mobile) - P0"

You: "Work on it"
Mobile Lead: [Deploys, hits blocker]

Mobile Lead: "⚠️ Blocked - backend endpoint missing"
Orchestrator: "Switch to backend or different task?"

You: "Switch to backend"
Backend Lead: [Deploys, builds endpoint]

Backend Lead: "✅ Endpoint ready"
Orchestrator: "Mobile task now unblocked!"

You: "Back to mobile"
Mobile Lead: [Continues, completes]

=== Evening ===

You: "Show progress"
Orchestrator: [Shows summary: 3 tasks done, 10% progress]

You: "Run tests"
Integration Test Lead: [Tests pass]

You: "Great, see you tomorrow"
```

---

## 🆘 Troubleshooting

### "I don't know what to work on"
→ "What's next?"

### "I want to work on something specific"
→ "Work on [task name]"

### "Am I blocked?"
→ "Show blockers" or check suggestion (it'll note blockers)

### "How long will this take?"
→ Time estimates in task suggestions

### "Can I switch components?"
→ Yes! "Switch to [mobile/backend/admin]"

### "What if I need to pause?"
→ Just stop. Resume with "What's next?" later.

---

**Remember**: Sequential mode is about **focused, distraction-free work**. One task at a time, completed fully, then move to next. Simple, effective, maintainable.

**Last Updated**: 2025-10-09
**Version**: 2.0
