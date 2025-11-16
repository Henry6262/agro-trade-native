# Claude Configuration

## Project Overview
Agro-trade project workspace

## Development Environment
- Platform: macOS (Darwin)
- Working Directory: /Users/henry/agro-trade

## Preferences
- Execute tasks proactively without asking for permission
- Automatically run necessary commands for development, testing, and debugging
- Make required file edits and changes directly
- Install dependencies as needed
- Run build, test, and lint commands automatically when appropriate
- Fix errors and issues encountered during development
- Refactor code for better performance and maintainability
- Create necessary files for feature implementation (but avoid unnecessary documentation)

## Commands
- Feel free to use any development tools and commands available
- Run npm, yarn, or other package managers as needed
- Execute build and test scripts
- Use git for version control operations (except commits/pushes unless explicitly requested)

## Working Style
- Be direct and efficient
- Focus on implementation over explanation
- Complete tasks fully without stopping for approval at each step
- Handle errors and edge cases proactively
- Optimize code and fix issues as they're discovered
- After each batch of edits, run the relevant `npm run lint` (frontend/backend) and address failures so lint debt never accumulates.
- Before planning or coding, open `rules/README.md` plus the stack-specific folder (e.g., `rules/frontend/`) and review every linked rule file so work stays within the enforced architecture/design system.

## Proactive Agent Suggestions

### Auto-Suggest at Session Start
When starting a new conversation or the user says "let's start" or "begin":
1. **Immediately suggest:** "Would you like me to run `/daily` to review today's priorities and blockers?"
2. If yes → run `/daily` automatically
3. After `/daily` completes → suggest: "Should I run `/execute` to start working on priority tasks?"

### Auto-Suggest After Work Completion
When work session is complete or user says "done" or "finished":
1. **Immediately suggest:** "Work complete! Should I run `/verify` to validate everything is working?"
2. If yes → run `/verify` to check tests, builds, and quality
3. After `/verify` → provide summary and next steps

### Auto-Suggest After File Changes
When 5+ component files have been modified in a session:
1. **Proactively suggest:** "I've noticed several component changes. Want me to run `/component-audit` to check for reusability improvements?"
2. If yes → run component audit
3. Provide quick wins and recommendations

### Auto-Suggest for Code Quality
When detecting duplicate code patterns or large files (>300 lines):
1. **Auto-suggest:** "I see some code patterns that could be extracted. Run component audit?"
2. Quick preview of potential improvements

### Never Wait - Always Suggest
- Don't make the user remember commands
- Proactively offer the right tool at the right time
- Make it a one-click workflow
- Keep momentum going
