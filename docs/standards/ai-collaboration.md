# AI Collaboration Charter

**Last Updated**: 2025-11-14  
**Status**: Active  
**Related**: `AGENTS.md`, `docs/runbooks/plan-mode.md`, `docs/coordination/implementation-status.md`

---

## Purpose
Define the guardrails for AI-assisted development so every feature follows the same disciplined process: plan → build → verify → document. These rules govern design extraction, blueprint creation, testing, Git hygiene, and when to escalate for manual intervention.

---

## Design & MCP Extraction Rules
- **Figma Reference**: Every UI task must cite the exact Figma node ID and parent frame. Extract the parent frame to capture layout context, spacing, and breakpoints.
- **Semantic HTML**: Use semantic elements (`header`, `section`, `main`, `button`, etc.) plus ARIA attributes where needed; no nested `<div>` soup.
- **Design Tokens**: Never hardcode colors, spacing, typography, or shadows. Pull from the design system theme (Tailwind tokens, CSS variables, or shared constants). If a token is missing, document it and add to backlog.
- **Mobile-First**: Start with the smallest breakpoint, then layer responsive styles upward. Ensure components collapse gracefully and use CSS grid/flex utilities instead of ad-hoc pixel tweaks.
- **MCP Extraction**: When using MCP to pull design data, specify the node ID, request the parent frame for context, and validate that padding/margins match tokens before implementing. Reject MCP output that lacks semantic structure.

---

## Planning & Execution Rules
1. **Blueprints per Story**  
   - Use the Software Implementer gem to generate implementation blueprints for each story (never batch entire epics at once).  
   - Store the blueprint under `docs/blueprints/<epic>/<story>.md`, including acceptance criteria, component list, data contracts, and test plan.
2. **Plan Mode Enforcement**  
   - All work happens in Plan Mode: outline tasks, get approval, then execute. The plan must be “smallest detail” precise before touching code.  
   - Interrupt execution if new information appears; rebuild the plan and continue.
3. **Continuous Feedback Loop**  
   - After implementing a story, immediately log the outcome in the blueprint and the Implementation Status doc.  
   - Provide explicit feedback comparing intent vs reality so future prompts stay aligned.
4. **Implementation Status Updates**  
- `docs/coordination/implementation-status.md` is the canonical progress log. Update it after every story so DevOps/Test agents can coordinate downstream tasks. `atctl check` fails if feature code changes without touching this file.

---

## Testing & Git Rules
- **Real Tests Only**: Validate actual flows with representative data; no placeholder/dummy tests for coverage. If data is required, seed realistic fixtures or use the existing testing helpers.
- **Test Scope**:
  - Backend: service + e2e tests for new logic.
  - Frontend/Admin/Mobile: component/integration tests with Testing Library / RNTL.
- **Git Workflow**:
  - Follow Conventional Commits and PR template.
  - Run `node scripts/atctl.mjs check --auto` (hook/CI enforced) before pushes.
  - Run `node scripts/atctl.mjs docs --sync` whenever structure/schema/docs change so generated artifacts stay accurate.

---

## Manual Intervention Guidelines
- Complex SVGs, gradients, or bespoke canvas effects that take more than two iteration cycles → switch to manual implementation and document the handoff.  
- Non-standard stacks (e.g., Rust/Solana, platform-specific build scripts) often require human intervention; attempt twice via AI, then escalate.  
- If MCP/AI output degrades quality (layout bugs, token mismatches), halt automation, implement manually for up to 10 minutes, then resume the AI loop with updated context.

---

## Compliance Checklist
- [ ] Blueprint generated + stored.
- [ ] Plan Mode approved before coding.
- [ ] Implementation Status updated post-story.
- [ ] Tests cover actual functionality (no dummy cases).
- [ ] `atctl check --auto` + `docs --sync` executed as needed.
- [ ] Manual interventions documented when applied.

Treat this charter as binding—update it whenever the workflow evolves.
