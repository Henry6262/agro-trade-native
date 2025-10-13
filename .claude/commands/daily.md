# /daily - Autonomous Daily Orchestrator

Run complete daily workflow:
1. Analyze PROJECT_STATE.json
2. Check recent progress
3. Scan for blockers
4. Generate today's task plan
5. Present execution options

**Usage:**
- `/daily` - Full diagnostic + plan generation
- `/daily auto` - Auto-execute generated plan
- `/daily status` - Quick status only (no planning)

**Output**: Today's prioritized task list with execution options
