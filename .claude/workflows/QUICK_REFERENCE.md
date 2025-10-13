# Quick Reference Guide

Fast lookup for common commands and patterns.

---

## 🎯 Common Commands

### Status & Information

```bash
"What's our status?"              → Current project health
"Show progress"                   → Completion percentages
"What's blocking us?"             → Active blockers
"What was completed recently?"    → Recent completions
"Show health"                     → Component health status
```

### Task Management

```bash
"What's next?"                    → Get task suggestion
"What should I work on?"          → Same as above
"Work on [task name]"             → Start specific task
"Let's do it"                     → Proceed with suggested task
"Skip this task"                  → Move to next task
```

### Feature Development

```bash
"Build [feature name]"            → Multi-component feature
"Add [feature name]"              → Same as above
"Integrate [system]"              → Integration work
```

### Testing

```bash
"Run tests"                       → Integration tests
"Run integration tests"           → Same as above
"Test [scenario name]"            → Scenario-based test
"Run all tests"                   → Complete test suite
```

### Debugging

```bash
"Fix [bug description]"           → Debug issue
"Debug [component]"               → Investigate component
"Why is [X] broken?"              → Analyze issue
"Check logs"                      → Review error logs
```

---

## 🤖 Agent Quick Lookup

### When to Use Each Agent

| I Want To... | Say This | Agent Deployed |
|--------------|----------|----------------|
| Get started | "What's next?" | Orchestrator |
| Check status | "What's our status?" | Orchestrator |
| Work on mobile | "Work on [mobile task]" | Mobile Lead |
| Work on backend | "Work on [backend task]" | Backend Lead |
| Work on admin | "Work on [admin task]" | Admin Dashboard Lead |
| Build feature | "Build [feature]" | Product Architect |
| Run tests | "Run tests" | Integration Test Lead |
| Test scenarios | "Test [scenario]" | Scenario Test Lead |

---

## 📊 Reading State Files

### PROJECT_STATE.json - Quick Scan

```bash
# Check overall health
grep "health" coordination/PROJECT_STATE.json

# Check completion percentages
grep "completionPercentage" coordination/PROJECT_STATE.json

# Check current focus
grep "currentFocus" coordination/PROJECT_STATE.json

# Check current mode
grep "currentMode" coordination/PROJECT_STATE.json
```

### TASK_QUEUE.json - See What's Next

```bash
# View all pending tasks
cat coordination/TASK_QUEUE.json | jq '.queue'

# View completed tasks
cat coordination/TASK_QUEUE.json | jq '.completed'
```

---

## 🔄 Common Workflows

### Daily Standup Pattern

```
Morning:
1. "What's our status?"           → See health
2. "What's next?"                 → Get suggestion
3. "Let's do it"                  → Start work

During Day:
4. [Agent works...]
5. "What's next?"                 → Continue

Evening:
6. "Run tests"                    → Validate
7. "Show progress"                → Review
```

### Feature Development Pattern

```
1. "Build [feature name]"         → Start feature
2. [Product Architect plans]
3. [Specialists work in parallel]
4. "Check feature progress"       → Monitor
5. "Run integration tests"        → Validate
6. "What's next?"                 → Return to daily work
```

### Bug Fix Pattern

```
1. "Fix [bug description]"        → Start debugging
2. [Specialist investigates]
3. [Specialist fixes]
4. [Specialist tests]
5. "Run tests"                    → Verify fix
6. "What's next?"                 → Continue
```

---

## 💡 Pro Tips

### Speed Up Your Workflow

✅ **Be specific**: "Work on counter-offer UI" > "Work on mobile"
✅ **Trust suggestions**: Orchestrator knows priorities
✅ **Check status first**: Start each session with "What's our status?"
✅ **Use shortcuts**: "Next" instead of "What should I work on next?"

### Common Mistakes to Avoid

❌ Don't: "Build the app" (too vague)
✅ Do: "Build price alerts feature" (specific)

❌ Don't: Skip status checks
✅ Do: Start with "What's our status?"

❌ Don't: Work on blocked tasks
✅ Do: Ask "What's unblocked?"

❌ Don't: Skip tests
✅ Do: "Run tests" after completing work

---

## 🎯 Context-Aware Commands

### Mobile Development

```bash
"Work on buyer screen"            → Mobile Lead
"Fix mobile crash"                → Mobile Lead
"Update navigation"               → Mobile Lead
"Add mobile test"                 → Mobile Lead
```

### Backend Development

```bash
"Create [endpoint]"               → Backend Lead
"Fix API bug"                     → Backend Lead
"Update database schema"          → Backend Lead
"Add backend test"                → Backend Lead
```

### Admin Dashboard

```bash
"Build admin panel"               → Admin Dashboard Lead
"Add monitoring"                  → Admin Dashboard Lead
"Create dashboard"                → Admin Dashboard Lead
```

### Testing

```bash
"Test [feature]"                  → Integration Test Lead
"Validate [component]"            → Integration Test Lead
"Run scenario"                    → Scenario Test Lead
"Load test"                       → Integration Test Lead
```

---

## 📋 Task Priority Levels

| Priority | Meaning | Action |
|----------|---------|--------|
| P0 | Critical, blocks progress | Do immediately |
| P1 | Important, needed soon | Do today/tomorrow |
| P2 | Nice-to-have | Do when P0/P1 done |

**Check priorities**: "Show P0 tasks"

---

## 🚦 Health Status Colors

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 GREEN | Good | All systems operational |
| 🟡 YELLOW | Caution | Minor issues, not critical |
| 🔴 RED | Critical | Blockers, broken builds |

**Check health**: "Show health status"

---

## 🔗 Useful File Paths

```bash
# State files
coordination/PROJECT_STATE.json           # Project overview
coordination/TASK_QUEUE.json              # Task list
coordination/INTEGRATION_STATUS.json      # Feature coordination

# Contracts
contracts/api-contract.ts                 # API definitions
contracts/event-contract.ts               # WebSocket events
contracts/database-schema.prisma          # Database schema

# Agents
.claude/agents/ORCHESTRATOR.md            # Meta-coordinator
.claude/agents/ARCHITECT.md               # Feature coordinator
.claude/agents/MOBILE_LEAD.md             # Mobile specialist
.claude/agents/BACKEND_LEAD.md            # Backend specialist

# Workflows
.claude/workflows/DAILY_WORKFLOW.md       # Sequential mode
.claude/workflows/FEATURE_WORKFLOW.md     # Parallel mode
.claude/workflows/QUICK_REFERENCE.md      # This file
```

---

## 💬 Natural Language Examples

The system understands natural language. Here are real examples:

### Good Requests (Clear & Specific)

✅ "Let's work on the active operations tab"
✅ "Build push notifications"
✅ "Fix the counter-offer bug"
✅ "Test the negotiation flow"
✅ "What's blocking mobile?"
✅ "Update the offers API"

### Less Effective (Too Vague)

❌ "Fix the app" → Which component? What's broken?
❌ "Make it better" → What specifically?
❌ "Add features" → Which features?
❌ "Work on stuff" → What stuff?

**When in doubt**: Ask "What's next?" and let Orchestrator suggest.

---

## 🎨 Output Interpretation

### When You See This... It Means...

```
"Deploying [Agent Name]..."
→ Agent is being activated

"✅ Task complete"
→ Work finished, tests passed

"⚠️ Blocked by..."
→ Can't proceed, dependency needed

"🟢 Health: GREEN"
→ All systems operational

"📊 Status: 65%"
→ Component 65% complete

"🔄 Mode: Sequential"
→ Working on one task at a time

"🔄 Mode: Parallel"
→ Multi-component feature in progress
```

---

## 🆘 Troubleshooting

### "I'm stuck, what do I do?"

```bash
1. "What's our status?"        → See current state
2. "Show blockers"             → See what's blocking
3. "What's unblocked?"         → Find available work
4. "Skip this task"            → Move to next
```

### "Which agent should I use?"

```bash
Just ask: "What's next?"
→ Orchestrator decides for you
```

### "How do I know what's done?"

```bash
"What was completed recently?"
→ See recent completions
```

### "Tests are failing"

```bash
"Run tests and show failures"
→ Detailed test report
```

### "I want to change priority"

```bash
"Work on [specific task]"
→ Override suggested task
```

---

## 🔥 Power User Shortcuts

### Chain Commands

```bash
# Complete current task and move to next
"Mark complete and next"

# Run tests and show failures only
"Test and show failures"

# Status and suggestion
"Status and next task"
```

### Filters

```bash
"Show mobile tasks"            → Filter by component
"Show P0 tasks"                → Filter by priority
"Show blocked tasks"           → Show blockers
"Show ready tasks"             → Show unblocked work
```

### Bulk Operations

```bash
"Run all tests"                → Complete test suite
"Update all contracts"         → Sync all contracts
"Check all health"             → Full health check
```

---

## 📖 Learn More

- **Full System**: See `.claude/README.md`
- **Daily Workflow**: See `.claude/workflows/DAILY_WORKFLOW.md`
- **Feature Workflow**: See `.claude/workflows/FEATURE_WORKFLOW.md`
- **Agent Details**: See `.claude/agents/[AGENT_NAME].md`

---

**Tip**: Bookmark this file for quick reference during development!

**Last Updated**: 2025-10-09
**Version**: 2.0
