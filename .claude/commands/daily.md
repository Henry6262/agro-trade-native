# /daily - Daily Standup & Task Orchestrator

Run the Daily Standup Advisor agent for team coordination and planning.

**What it does:**
1. Analyzes INTEGRATION_STATUS.json and PROJECT_STATE.json
2. Reviews git commits from last 24 hours
3. Identifies blockers and urgent issues
4. Provides team-specific suggestions (Backend, Mobile, Admin)
5. Highlights integration coordination needs
6. Recommends task priorities for today
7. Detects breaking changes and API mismatches
8. Celebrates wins and progress

**Usage:**
- `/daily` - Full standup report with recommendations
- `/daily standup` - Generate meeting agenda (same as above)
- `/daily blockers` - Show blockers only
- `/daily status` - Quick project health check
- `/daily --focus backend` - Focus on specific team

**Output:** Comprehensive standup report with:
- Project health summary
- Yesterday's progress
- Blockers & urgent issues
- Team-specific suggestions (UI/UX, architecture, optimization)
- Integration coordination needs
- Recommended task priorities
- Sprint progress tracking

Use the `daily-standup-advisor` agent for cross-team coordination and actionable advice.
