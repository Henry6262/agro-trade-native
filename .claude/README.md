# Agro-Trade Development System

**Last Updated**: 2025-10-09
**Version**: 2.0 (Hybrid System)

---

## 🎯 Start Here

This is your **AI-powered development coordination system**. It uses specialized AI agents to build features across your mobile app, backend API, and admin dashboard.

### Quick Commands

```bash
# Daily work (sequential mode)
"What should I work on today?"      → Orchestrator suggests next task
"Work on [task name]"               → Deploy specialist for that task
"Run tests"                         → Deploy testing agent
"What's our status?"                → Show project health

# Feature development (parallel mode)
"Build [feature name]"              → Deploy Product Architect + team
"Check feature progress"            → Show integration status
"Integration test"                  → Validate cross-component work
```

---

## 📁 System Structure

```
.claude/
├── README.md (you are here)        ⭐ Start here
├── agents/                         👥 Agent identities
│   ├── ORCHESTRATOR.md            - Decides which mode to use
│   ├── ARCHITECT.md               - Coordinates multi-agent features
│   ├── MOBILE_LEAD.md             - React Native specialist
│   ├── BACKEND_LEAD.md            - NestJS/Prisma specialist
│   ├── ADMIN_DASHBOARD_LEAD.md    - Admin tools specialist
│   ├── INTEGRATION_TEST_LEAD.md   - Cross-platform testing
│   └── SCENARIO_TEST_LEAD.md      - Business logic testing
└── workflows/                      📋 How to use the system
    ├── DAILY_WORKFLOW.md          - Sequential task-based work
    ├── FEATURE_WORKFLOW.md        - Parallel multi-agent work
    └── QUICK_REFERENCE.md         - Common patterns & examples

coordination/
├── PROJECT_STATE.json              ⭐ Single source of truth
├── TASK_QUEUE.json                 📝 Daily task tracking
└── INTEGRATION_STATUS.json         🔄 Feature coordination (parallel mode)

contracts/
├── api-contract.ts                 📜 REST API contract (THE LAW)
├── event-contract.ts               📜 WebSocket events (THE LAW)
└── database-schema.prisma          📜 Database schema (THE LAW)
```

---

## 🔄 Two Workflow Modes

### Mode 1: Sequential (Daily Work)

**When to use**: Focused work on one component at a time

```
You: "What's next?"
  ↓
Orchestrator:
  - Reads PROJECT_STATE.json
  - Reads TASK_QUEUE.json
  - Suggests highest priority task
  ↓
You: "Let's do it"
  ↓
Orchestrator deploys appropriate specialist:
  - Mobile Lead (for mobile tasks)
  - Backend Lead (for backend tasks)
  - Admin Lead (for admin tasks)
  ↓
Specialist:
  - Completes task
  - Updates PROJECT_STATE.json
  - Marks task complete
  ↓
Orchestrator: "✅ Task complete. Next task: [...]"
```

**See**: `.claude/workflows/DAILY_WORKFLOW.md`

### Mode 2: Parallel (Feature Development)

**When to use**: Complex features spanning multiple components

```
You: "Build real-time price alerts feature"
  ↓
Orchestrator:
  - Switches to parallel mode
  - Deploys Product Architect
  ↓
Product Architect:
  - Plans feature across mobile/backend/admin
  - Updates contracts
  - Deploys Mobile + Backend + Admin leads simultaneously
  ↓
Specialists work in parallel:
  - Coordinate via INTEGRATION_STATUS.json
  - Escalate blockers to Architect
  - Update progress continuously
  ↓
Integration Test Lead:
  - Validates all components work together
  - Generates test report
  ↓
Architect: "✅ Feature complete, all tests passing"
```

**See**: `.claude/workflows/FEATURE_WORKFLOW.md`

---

## 📊 State Files Explained

### PROJECT_STATE.json (High-Level Overview)

**Purpose**: Single source of truth for project health and current focus

**When to read**:
- Start of every session
- Before deciding next task
- When user asks "What's our status?"

**Who updates**:
- Orchestrator (mode changes, task assignments)
- Specialist agents (progress updates)
- Testing agents (health status)

**Key sections**:
```json
{
  "components": {
    "mobile": {
      "health": "GREEN | YELLOW | RED",
      "completionPercentage": 65,
      "currentFocus": "What's being worked on"
    }
  },
  "currentMode": "sequential | parallel",
  "activeTasks": [...],  // In sequential mode
  "activeFeature": {...} // In parallel mode
}
```

### TASK_QUEUE.json (Daily Task List)

**Purpose**: Prioritized backlog of tasks to complete

**When to use**: Sequential mode only

**Who updates**:
- User (adds new tasks)
- Orchestrator (moves tasks to completed)
- Specialist agents (updates status)

### INTEGRATION_STATUS.json (Feature Coordination)

**Purpose**: Cross-component milestone tracking

**When to use**: Parallel mode only

**Who updates**:
- Product Architect (creates milestones)
- Specialist agents (progress, blockers)
- Integration Test Lead (test results)

---

## 🤖 Agent Routing

### When User Says... → Deploy This Agent

| User Request | Mode | Agent Deployed |
|--------------|------|----------------|
| "What's next?" | Sequential | Orchestrator |
| "Work on [single task]" | Sequential | Appropriate Specialist |
| "Fix [bug]" | Sequential | Appropriate Specialist |
| "Build [feature]" (multi-component) | Parallel | Product Architect |
| "Add [complex feature]" | Parallel | Product Architect |
| "Run tests" | Either | Integration Test Lead |
| "Test [scenario]" | Either | Scenario Test Lead |
| "What's our status?" | Either | Orchestrator |

### Agent Hierarchy

```
ORCHESTRATOR (Meta-coordinator)
    ↓
    ├─ Sequential Mode → Specialist Agents
    │   ├─ Mobile Lead
    │   ├─ Backend Lead
    │   └─ Admin Lead
    │
    └─ Parallel Mode → PRODUCT ARCHITECT
        ↓
        ├─ Mobile Lead
        ├─ Backend Lead
        ├─ Admin Lead
        └─ Integration Test Lead
```

---

## 📜 Contracts (THE LAW)

### What Are Contracts?

Contracts define the **exact interface** between mobile, backend, and admin:

- **api-contract.ts**: Every REST endpoint, request/response shape
- **event-contract.ts**: Every WebSocket event, payload structure
- **database-schema.prisma**: Source of truth for data models

### Contract Rules

1. **Backend must implement** exactly what contract specifies
2. **Mobile/Admin must call** exactly what contract specifies
3. **Nobody can diverge** without updating the contract
4. **Integration tests** validate compliance automatically

### Example

```typescript
// contracts/api-contract.ts
{
  negotiations: {
    counterOffer: {
      method: 'POST',
      path: '/negotiations/:id/counter',
      request: { counterPrice: 'number', quantity: 'number' },
      response: { success: 'boolean', data: { negotiation: 'Negotiation' } }
    }
  }
}
```

Backend implements this **exactly** ✅
Mobile calls this **exactly** ✅
Integration tests **validate match** ✅

---

## 🚀 Getting Started

### First Time Setup

Already done! The system is ready to use.

### Your First Session

```bash
# 1. Check project status
"What's our status?"

# 2. Ask what to work on
"What should I work on today?"

# 3. Start working
"Let's do it" or "Work on [specific task]"

# 4. Check progress anytime
"Show me progress"

# 5. Run tests
"Run integration tests"
```

---

## 📚 Documentation Map

### For Daily Use
- **QUICK_REFERENCE.md** - Common commands and patterns
- **DAILY_WORKFLOW.md** - Sequential task-based workflow

### For Feature Development
- **FEATURE_WORKFLOW.md** - Parallel multi-agent workflow

### For Understanding the System
- **MULTI_AGENT_SYSTEM.md** - Complete architecture deep-dive
- **HOW_TO_USE_MULTI_AGENT_SYSTEM.md** - User guide with examples

### For Agent Configuration
- **agents/*.md** - Individual agent identities and responsibilities

---

## 🎯 Current Project State

**Phase**: 004-trade-operation-management
**Mode**: Sequential
**Components**:
- Mobile: 65% (Active Operations Tab)
- Backend: 80% (Negotiation APIs)
- Admin Dashboard: 75% (Scenario Testing Phase 1)

**Health**: 🟢 GREEN (All systems operational)

---

## 💡 Tips

### Best Practices
✅ Always start sessions with "What's our status?"
✅ Let Orchestrator suggest next task (it knows priorities)
✅ Update PROJECT_STATE.json when switching focus
✅ Run integration tests before marking features complete

### Common Mistakes
❌ Working on tasks without checking dependencies
❌ Skipping tests
❌ Not updating state files
❌ Changing contracts without syncing all repos

---

## 🆘 Troubleshooting

### "Which agent should I use?"
→ Just ask "What's next?" - Orchestrator will decide

### "I want to work on a specific feature"
→ Say "Build [feature name]" - Orchestrator will route appropriately

### "How do I know what's blocking me?"
→ Check PROJECT_STATE.json or ask "Show blockers"

### "Tests are failing"
→ Deploy Integration Test Lead: "Run tests and show failures"

---

## 📞 Quick Reference

| Want to... | Say... |
|------------|--------|
| See status | "What's our status?" |
| Get suggestion | "What's next?" |
| Work on task | "Work on [task]" |
| Build feature | "Build [feature]" |
| Run tests | "Run tests" |
| Fix bug | "Debug [bug]" |
| Check progress | "Show progress" |
| See blockers | "Show blockers" |

---

**Remember**: The system is designed to reduce your cognitive load. Trust the Orchestrator to route work appropriately. Focus on building, let the agents coordinate.

**Questions?** See `.claude/workflows/QUICK_REFERENCE.md` for more examples.
