# /component-audit - Automated Code Quality Review

Run the Component Reusability & Folder Structure Architect agent.

**Auto-Triggers:**
- After 5+ component files modified in session
- When detecting duplicate code patterns
- When large files (>300 lines) are created
- On user request

**What it does:**
1. Scans for duplicate code across components
2. Analyzes folder structure and organization
3. Checks component sizes and complexity
4. Reviews naming conventions
5. Suggests reusable component extractions
6. Recommends folder structure improvements
7. Provides actionable refactoring steps

**Usage:**
- `/component-audit` - Full audit report
- `/component-audit --focus duplicates` - Only find duplicates
- `/component-audit --focus structure` - Only review structure
- `/component-audit --focus size` - Only check component sizes

**Output:** Comprehensive report with:
- Duplicate code instances
- Large component warnings
- Folder structure recommendations
- Reusability suggestions
- Estimated time to fix each issue
- Before/after metrics

**Proactive Suggestion:**
Claude will automatically suggest running this when:
- Multiple components have been modified
- Similar code patterns are detected
- Component files exceed 300 lines
- Import paths are getting too long

Use the `component-reusability-architect` agent to maintain clean, reusable code.
