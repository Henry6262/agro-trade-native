# Verify Command

## Purpose
Daily verification command to run after completing work and calling `/execute`. Focused on testing and validating the day's work.

## When to Use
Run this command at the end of every work session:
1. Complete your work tasks
2. Run `/execute` to generate summary
3. Run `/verify` to test everything works

## What It Checks

### 1. Backend Health
- NestJS server running on port 4001
- Database connectivity
- API endpoints responding

### 2. Frontend Health
- Vite dev server running on port 5173
- Admin dashboard accessible
- No build errors

### 3. Test Suite Status
- All E2E tests passing
- Unit tests passing
- No test failures

### 4. Code Quality
- TypeScript compilation succeeds
- No ESLint errors
- No console.log statements in production code

### 5. Integration Status
- Check INTEGRATION_STATUS.json
- Verify no new blockers
- Confirm milestones match completion status

## Usage

```bash
/verify
```

## Expected Output

```
✅ Verification Complete - All Checks Passed

Backend Health: ✅ Running on port 4001
Frontend Health: ✅ Running on port 5173
Test Suite: ✅ All tests passing
Code Quality: ✅ No errors
Integration: ✅ No blockers

Summary: Ready for next work session
```

## If Verification Fails

1. Check which specific check failed
2. Fix the issue before ending the work session
3. Re-run `/verify` until all checks pass
4. Only end work session when verification is clean

## Automation

This command is designed to be:
- Fast (< 2 minutes)
- Comprehensive (catches common issues)
- Actionable (clear what to fix)
- Daily routine (run every single day)

## Integration with Workflow

```
/daily → work → /execute → /verify (AUTO-SUGGESTED) → done
```

Every day:
1. Start with `/daily` to plan (Claude suggests this)
2. Do the work
3. Run `/execute` to execute tasks (Claude suggests this)
4. Run `/verify` to test (Claude AUTO-SUGGESTS after execute)
5. Fix any issues
6. End session when verify passes

**Auto-Suggestion:**
- You don't need to remember to run `/verify`
- After `/execute` completes, Claude will say: "Run `/verify` to validate?"
- Just click yes!
- Keeps the workflow smooth and fast
