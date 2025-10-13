# Autonomous Daily Orchestrator

**Purpose**: Self-executing daily workflow that checks state, analyzes progress, and generates actionable plans.

---

## 🤖 Autonomous Trigger

**When**: Every morning when user starts session
**How**: User types `/daily` or "start daily workflow"
**Result**: Orchestrator runs full diagnostic and generates day's plan

---

## 📋 Daily Orchestrator Workflow

### Phase 1: State Analysis (Automated)

```typescript
// 1. Read current state
const state = readFile('coordination/PROJECT_STATE.json');

// 2. Calculate health scores
const health = {
  mobile: analyzeHealth(state.components.mobile),
  backend: analyzeHealth(state.components.backend),
  admin: analyzeHealth(state.components.adminDashboard),
  overall: calculateOverall()
};

// 3. Identify blockers
const blockers = scanForBlockers(state);

// 4. Check milestones
const milestones = state.upcomingMilestones.filter(m => m.status === 'IN_PROGRESS');
```

### Phase 2: Context Review (Automated)

```typescript
// 5. Scan documentation
const docs = [
  'docs/README.md',
  'docs/features/*.md',
  'docs/development/*.md',
  '.claude/DOCUMENTATION_STANDARDS.md'
];

// 6. Check git status
const git = execSync('git status --porcelain');
const uncommitted = git.length > 0;

// 7. Review recent work
const recentCommits = execSync('git log --since="yesterday" --oneline');
```

### Phase 3: Priority Generation (Automated)

```typescript
// 8. Calculate task priorities
const tasks = prioritizeTasks({
  currentState: state,
  blockers: blockers,
  milestones: milestones,
  uncommittedWork: uncommitted
});

// Priority matrix:
// P0 = Blockers, critical bugs, deployment issues
// P1 = Milestone tasks, active feature work
// P2 = Tech debt, refactoring, documentation
// P3 = Nice-to-haves, optimizations
```

### Phase 4: Plan Generation (Automated)

```typescript
// 9. Generate daily plan
const plan = {
  date: new Date().toISOString(),
  overallHealth: health.overall,
  criticalIssues: blockers.filter(b => b.severity === 'CRITICAL'),

  morningTasks: tasks.slice(0, 2), // First 2-3 hours
  afternoonTasks: tasks.slice(2, 4), // Next 2-3 hours

  milestoneProgress: milestones.map(m => ({
    id: m.id,
    target: m.targetDate,
    currentProgress: m.progress,
    daysRemaining: calculateDaysRemaining(m.targetDate),
    onTrack: m.progress >= calculateExpectedProgress(m)
  })),

  recommendations: generateRecommendations(state, tasks, milestones)
};

// 10. Save plan
writeFile('coordination/DAILY_PLAN.json', plan);
```

### Phase 5: Present to User (Interactive)

```markdown
📅 **Agro-Trade Daily Plan - [Date]**

## 🏥 System Health
🟢 Overall: GREEN (All systems operational)
🟢 Mobile: 65% complete
🟢 Backend: 80% complete
🟢 Admin: 80% complete

## 🎯 Today's Milestones
**Trade Operation Management Hub** (Target: Oct 15)
- Progress: 70% → 75% (target today)
- Status: 🟢 On Track
- Remaining: 5 days

## ⚡ Critical Items
None ✅

## 📝 Morning Focus (3 hours)
1. **[P1] Build Bulgaria Map Component** (admin-dashboard)
   - Implement Leaflet + OSM base layer
   - Add 6 Bulgaria regions (NUTS-2 GeoJSON)
   - Buyer/Seller pin markers
   - Est: 2.5 hours
   - Agent: admin-dashboard-lead

2. **[P1] Create Matching Dashboard Layout** (admin-dashboard)
   - Top: Map section
   - Middle: Order info bar
   - Bottom: Buyers (left) + Sellers (right) panels
   - Est: 1 hour
   - Agent: admin-dashboard-lead

## 🌆 Afternoon Focus (3 hours)
3. **[P1] Wire Map Interactions** (admin-dashboard)
   - Click buyer order → filter sellers
   - Display seller pins on map
   - Highlight selected pins
   - Est: 1.5 hours
   - Agent: admin-dashboard-lead

4. **[P1] Distance Calculation Service** (backend)
   - Region-to-region distance calculation
   - Transport cost estimation (15¢/km)
   - API endpoint: POST /api/trade-operations/calculate-transport
   - Est: 1.5 hours
   - Agent: backend-lead

## 🔄 Parallel Track (If time permits)
5. **[P2] Bulgaria Regions Seed Data** (backend)
   - Seed 6 NUTS-2 regions
   - Major cities per region
   - Region center coordinates
   - Est: 30 minutes
   - Agent: backend-lead

## 📊 Success Metrics
- [ ] Map displays Bulgaria with 6 regions
- [ ] Buyer pins visible on map
- [ ] Can select buyer order and see sellers
- [ ] Distance calculation working
- [ ] Admin dashboard at 85% (+5%)

## 🚀 Execution Plan
**Mode**: Parallel (multi-component feature)
**Coordinator**: Product Architect
**Agents**: admin-dashboard-lead + backend-lead

**Would you like to:**
1. Execute full plan autonomously
2. Start with morning focus only
3. Customize plan
4. Skip and work on something else

[Type '1' to auto-execute entire plan]
```

---

## 🎯 Autonomous Execution Flow

### When user selects "Execute full plan autonomously":

```typescript
// 1. Switch to parallel mode
updateProjectState({ currentMode: 'parallel' });

// 2. Deploy Product Architect
deployAgent('product-architect', {
  objective: 'Execute daily plan',
  tasks: plan.morningTasks.concat(plan.afternoonTasks),
  mode: 'autonomous',
  checkpoints: [
    'After morning tasks',
    'After afternoon tasks'
  ]
});

// 3. Product Architect coordinates specialists
productArchitect.deployTeam({
  'admin-dashboard-lead': [tasks[0], tasks[1], tasks[2]],
  'backend-lead': [tasks[3], tasks[4]]
});

// 4. Specialists work in parallel
// admin-dashboard-lead: Builds map components
// backend-lead: Builds distance calculation API

// 5. Integration checkpoints
// After each major task completion:
checkIntegration();

// 6. End of day validation
runIntegrationTests();
updateProjectState(results);
generateTomorrowPlan();
```

---

## 📈 Progress Tracking (Real-time)

Orchestrator updates PROJECT_STATE.json throughout the day:

```json
{
  "activeTasks": {
    "morning": {
      "tasks": [
        {
          "id": "TASK-MAP-001",
          "title": "Build Bulgaria Map Component",
          "status": "IN_PROGRESS",
          "progress": 60,
          "agent": "admin-dashboard-lead",
          "startedAt": "2025-10-11T09:00:00Z",
          "estimatedCompletion": "2025-10-11T11:30:00Z"
        }
      ]
    }
  },
  "todayProgress": {
    "completedTasks": 2,
    "totalPlanned": 5,
    "hoursSpent": 3.5,
    "componentsUpdated": ["adminDashboard", "backend"]
  }
}
```

---

## 🔄 Self-Correction System

### If blocker encountered:

```typescript
// Agent reports blocker
agent.reportBlocker({
  task: "Wire Map Interactions",
  issue: "Backend endpoint /api/regions missing",
  severity: "HIGH"
});

// Orchestrator auto-responds
orchestrator.handleBlocker({
  // 1. Add to blockers list
  addToState: true,

  // 2. Reassign agent
  reassign: {
    from: 'admin-dashboard-lead',
    to: 'backend-lead',
    newTask: 'Create /api/regions endpoint'
  },

  // 3. Adjust plan
  adjustPriorities: true,

  // 4. Notify user
  alert: "⚠️ Blocker detected. Reassigning agents to unblock."
});
```

### If ahead of schedule:

```typescript
// Completed morning tasks 1 hour early
if (currentTime < plan.morningEnd) {
  orchestrator.suggestBonus({
    message: "Great progress! Completed morning tasks 1 hour early.",
    options: [
      "Start afternoon tasks now",
      "Add bonus task from P2 queue",
      "Take break and resume on schedule"
    ]
  });
}
```

---

## 🌙 End-of-Day Auto-Report

At end of day (or when user types `/eod`):

```markdown
📊 **Daily Summary - [Date]**

## ✅ Completed (4/5 tasks)
1. ✅ Build Bulgaria Map Component (2.5h)
2. ✅ Create Matching Dashboard Layout (1h)
3. ✅ Wire Map Interactions (1.5h)
4. ✅ Distance Calculation Service (1.5h)
5. ⏳ Bulgaria Regions Seed Data (Moved to tomorrow)

## 📈 Progress Updates
- **Admin Dashboard**: 80% → 87% (+7%)
- **Backend**: 80% → 83% (+3%)
- **Overall Milestone**: 70% → 78% (+8%)

## 🎯 Milestone Status
**Trade Operation Management Hub**
- Target: Oct 15 (4 days remaining)
- Progress: 78% (+8% today)
- Status: 🟢 ON TRACK (Need 22% in 4 days = 5.5%/day)

## 🧪 Integration Status
- ✅ Admin-Backend API: PASS
- ✅ Distance Calculation: PASS
- ✅ Map Rendering: PASS

## ⏰ Time Analysis
- Planned: 6.5 hours
- Actual: 6.5 hours
- Efficiency: 100%

## 🚀 Tomorrow's Preview
**Top Priorities:**
1. Pricing Modal with Profit Calculator
2. Offer Creation API Integration
3. Multi-Seller Selection Logic

**Estimated:** 6 hours
**Goal:** Reach 85% milestone completion

---

**Status**: All systems GREEN ✅
**Ready for commit**: Yes
**Ready for deployment**: Not yet (70% of milestone needed)
```

---

## 🎬 How to Activate

### Option 1: Start of Day
```
User: "/daily" or "start daily workflow"
Orchestrator: [Runs full diagnostic, generates plan, presents options]
```

### Option 2: Quick Status
```
User: "what's the plan today?"
Orchestrator: [Shows generated plan without full diagnostic]
```

### Option 3: Auto-Execute
```
User: "/daily auto"
Orchestrator: [Generates plan, immediately starts execution]
```

### Option 4: Continuous Mode
```
User: "/daily continuous"
Orchestrator: [Runs all day, auto-suggests next tasks after each completion]
```

---

## 📝 Configuration

User can customize in `coordination/DAILY_CONFIG.json`:

```json
{
  "autoExecute": false,
  "workHoursPerDay": 6,
  "breakReminderInterval": 90,
  "priorityWeights": {
    "blockers": 10,
    "milestones": 8,
    "techDebt": 3,
    "features": 7
  },
  "agents": {
    "parallelLimit": 3,
    "autoDeployThreshold": "P1"
  }
}
```

---

## ✅ Success Criteria

Daily workflow is working if:
- User starts day knowing exactly what to do
- Plan is realistic (achievable in available time)
- Blockers are caught early and resolved
- Milestone progress is predictable
- End-of-day report shows actual vs planned
- Tomorrow's plan builds on today's progress

---

**Version**: 1.0
**Last Updated**: 2025-10-11
**Status**: Ready for implementation
