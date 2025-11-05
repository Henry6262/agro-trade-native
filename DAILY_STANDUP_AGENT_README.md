# Daily Standup Advisor Agent - Setup Complete ✅

**Status:** Ready to use
**Created:** 2025-10-13
**Agent File:** `.claude/agents/daily-standup-advisor.md`
**Command:** `/daily`

---

## What It Does

The Daily Standup Advisor agent analyzes your project and provides:

### 📊 **Project Health Check**
- Integration status percentage
- Sprint progress tracking
- Test coverage summary
- Build status verification

### 🚨 **Blocker Detection**
- Identifies team blockers
- Calculates impact and urgency
- Suggests owners and fix time
- Provides actionable recommendations

### 💡 **Team-Specific Advice**

**Backend Team:**
- Breaking API changes alerts
- Performance optimization suggestions
- TypeScript/validation reminders
- Caching strategy recommendations

**Mobile Team:**
- UI/UX consistency checks
- Missing error states detection
- Loading skeleton suggestions
- Accessibility issue flagging

**Admin Dashboard Team:**
- UX flow complexity review
- Responsive design improvements
- Performance bottleneck identification
- Component reusability suggestions

### 🔗 **Cross-Team Coordination**
- Identifies dependencies between teams
- Flags blocking relationships
- Suggests parallel work opportunities
- Coordinates deployment timing

### 🎯 **Priority Recommendations**
- Ranked task list for the day
- Unblock-first strategy
- Security/performance prioritization
- Technical debt scheduling

---

## How to Use

### Basic Usage
```bash
/daily
```
Generates full standup report with all recommendations.

### Focused Analysis
```bash
/daily --focus backend    # Backend team issues only
/daily blockers           # Show blockers only
/daily status            # Quick health check
```

---

## Example Output

```markdown
# Daily Standup Report - 2025-10-13

## 📊 Project Health
- ✅ Integration Status: 85% complete
- ⚠️ 2 blockers identified
- 🎯 Sprint target: v0.1 launch in 7 days

## 🚨 Blockers & Urgent Issues
1. **BLOCKER**: Mobile waiting for GET /seller/offers endpoint
   - **Owner**: Backend team
   - **Fix time**: 1 hour
   - **Action**: Implement endpoint this morning

## 💡 Backend Team Suggestions
- ✅ Great work on transport module!
- 💡 Add pagination to GET /inspections
- 🎯 Priority: Unblock mobile with seller endpoint

## 💡 Mobile Team Suggestions
- ✅ Seller offer UI looks excellent!
- 💡 Add loading skeletons for better UX
- 🎯 Can start testing after backend deploys

## 💡 Admin Team Suggestions
- ✅ Map improvements are fantastic!
- 💡 Consider keyboard shortcuts
- 🎯 Transport management ready for testing

## 📋 Today's Priorities
1. Backend: GET /seller/offers (1h) - URGENT
2. Mobile: Update transport service (1h)
3. Backend: Complete trade operations (4h)
4. All: Integration testing at 3 PM
```

---

## What Makes This Powerful

### 1. **Context-Aware Analysis**
- Reads entire project state
- Understands git history
- Tracks API contract changes
- Monitors integration points

### 2. **Pattern Detection**
- Identifies repeated issues
- Spots anti-patterns
- Flags missing best practices
- Detects architectural drift

### 3. **Actionable Recommendations**
- Specific, not vague
- Prioritized by impact
- Time-boxed suggestions
- Owner assignment

### 4. **Cross-Team Intelligence**
- Sees dependencies
- Prevents integration breaks
- Coordinates deployments
- Suggests pairing opportunities

---

## Real-World Scenarios

### Scenario 1: Breaking Change Prevention
```
⚠️ Backend changed TransportBid response structure
Old: { bid: { amount } }
New: { bidAmount: number }

Affected:
- admin-dashboard/transportApi.ts
- front-end/transportService.ts

Action: Update both before deploying
```

### Scenario 2: Performance Alert
```
💡 GET /inspections is slow (3.2s)
Problem: No pagination, returns 500+ items
Solution: Add pagination + indexes
Estimated: 2 hours
```

### Scenario 3: UX Improvement
```
🎨 Missing empty states in 3 components
Impact: Users confused when no data
Fix: Add empty state + helpful message
Estimated: 1 hour per component
```

---

## Agent Capabilities

### ✅ **Can Do:**
- Read all project files
- Analyze git history
- Review test results
- Detect patterns
- Provide recommendations
- Prioritize tasks
- Coordinate teams

### ❌ **Cannot Do:**
- Modify code directly
- Make commits
- Deploy changes
- Override team decisions
- Write tests

**Role:** Advisory only - teams implement suggestions

---

## When to Run

### Morning (Recommended)
```bash
/daily
```
Run 15 minutes before standup meeting to prepare agenda.

### Ad-Hoc
```bash
/daily blockers      # Check for blockers anytime
/daily status        # Quick health check
```

### Before Deployment
```bash
/daily --focus integration    # Check integration status
```

---

## Integration with Existing Agents

The Daily Standup Advisor **coordinates** with other agents:

- **Product Architect**: Gets architectural guidance
- **Backend Lead**: Implements backend suggestions
- **Mobile Lead**: Implements mobile suggestions
- **Admin Dashboard Lead**: Implements admin suggestions
- **Integration Test Lead**: Validates cross-platform changes

**Flow:**
1. `/daily` identifies issues
2. User decides which to tackle
3. Specialized agents implement solutions
4. Next `/daily` verifies fixes

---

## Success Metrics

The agent is successful when:

✅ Blockers identified before impacting sprint
✅ Teams coordinate smoothly on dependencies
✅ Integration issues caught early
✅ Best practices consistently applied
✅ Sprint velocity increases
✅ Fewer production bugs
✅ Happier developers

---

## Next Steps

### For Today (Plan B Execution)
1. Run `/daily` to see current state
2. Focus on completing trade operations backend
3. Add missing seller offers endpoint
4. Run integration tests

### This Week
1. Use `/daily` every morning
2. Track how recommendations impact velocity
3. Iterate on agent suggestions based on feedback

---

## Questions?

Try it out:
```bash
/daily
```

The agent will analyze your project and provide today's recommendations!

---

**Remember:** The agent is here to help, not to create more work. If a suggestion doesn't make sense, ignore it. Focus on what adds the most value.

Happy shipping! 🚀
