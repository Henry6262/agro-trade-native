# Documentation Standards for Agents

**Purpose**: Ensure all agents create documentation in the correct location with proper structure.

---

## 📁 Directory Structure

```
/Users/henry/agro-trade/
├── README.md                      ✅ Keep (project root readme)
├── .claude/                       ✅ Agent configuration
│   ├── README.md                  - Agent system guide
│   ├── agents/                    - Agent identities
│   └── workflows/                 - Workflow guides
├── docs/                          ✅ All human documentation goes here
│   ├── README.md                  - Documentation index
│   ├── project/                   - Project-level docs
│   ├── development/               - Development guides
│   ├── features/                  - Feature documentation
│   ├── deployment/                - Deployment guides
│   └── archive/                   - Old/deprecated docs
├── coordination/                  ✅ Runtime state (not docs)
└── contracts/                     ✅ Code contracts (not docs)
```

---

## 🚫 NEVER Create Docs In Root

**Forbidden**:
- ❌ `/SOME_FEATURE.md` - Use `docs/features/`
- ❌ `/ROADMAP.md` - Use `docs/archive/old-plans/`
- ❌ `/COMPLETION_REPORT.md` - Use `docs/features/implemented/`

**Exception**: Only `README.md` lives in root (project overview).

---

## ✅ Where to Put New Documentation

### When You Complete a Feature

```
docs/features/implemented/FEATURE_NAME.md

Example:
docs/features/implemented/TRADE_OPERATIONS.md
docs/features/implemented/PROFIT_MODEL.md
```

### When Planning a Feature

```
docs/features/planned/FEATURE_NAME.md

Example:
docs/features/planned/real-time-notifications.md
```

### When Creating Development Guides

```
docs/development/COMPONENT/guide-name.md

Examples:
docs/development/backend/API_GUIDE.md
docs/development/mobile/TESTING_GUIDE.md
docs/development/multi-agent-system/workflows/CUSTOM_WORKFLOW.md
```

### When Documenting Deployment

```
docs/deployment/GUIDE_NAME.md

Examples:
docs/deployment/DEPLOYMENT_GUIDE.md
docs/deployment/oauth/GOOGLE_SIGNIN_SETUP.md
```

### When Archiving Old Plans

```
docs/archive/old-plans/YYYY-MM-DD-plan-name.md

Examples:
docs/archive/old-plans/2025-10-01-initial-roadmap.md
```

---

## 📝 Required Document Structure

Every new documentation file MUST include:

```markdown
# Title

**Last Updated**: YYYY-MM-DD
**Status**: Draft | Active | Completed | Archived
**Component**: Mobile | Backend | Admin | All
**Related**: [Link to related docs]

## Overview
Brief summary of what this document covers.

## [Main Content Sections]
...

## Related Documentation
- [Link 1](./path/to/doc.md)
- [Link 2](./path/to/doc.md)
```

---

## 🤖 Agent Responsibilities

### Product Architect

When coordinating features:
- ✅ Create feature plan in `docs/features/planned/`
- ✅ Update to `docs/features/implemented/` when complete
- ✅ Archive old roadmaps to `docs/archive/old-plans/`

### Mobile Lead

When completing mobile work:
- ✅ Update `docs/features/implemented/[FEATURE].md`
- ✅ Add mobile-specific guides to `docs/development/mobile/`

### Backend Lead

When completing backend work:
- ✅ Update `docs/features/implemented/[FEATURE].md`
- ✅ Document APIs in `docs/development/backend/`
- ✅ Keep API contract in `contracts/api-contract.ts` (not docs)

### Admin Dashboard Lead

When completing admin work:
- ✅ Update `docs/features/implemented/[FEATURE].md`
- ✅ Add guides to `docs/development/admin-dashboard/`

### Integration Test Lead

When creating test reports:
- ✅ Store reports in `docs/development/testing/reports/`
- ✅ Update test guide in `docs/development/testing/`

---

## 🔄 Maintenance Protocol

### Before Creating New Doc
1. Check `docs/README.md` - Does similar doc exist?
2. Choose correct location from structure above
3. Use proper naming convention
4. Include required sections

### After Creating Doc
1. Add link to `docs/README.md` if important
2. Link from related documents
3. Update PROJECT_STATE.json if needed

### Quarterly Cleanup
1. Review `docs/features/planned/` - Move completed to `implemented/`
2. Archive outdated roadmaps to `docs/archive/old-plans/`
3. Remove duplicate or obsolete docs
4. Update links in `docs/README.md`

---

## 📋 Naming Conventions

### Files
- Important docs: `UPPERCASE.md` (e.g., `README.md`, `CONSTITUTION.md`)
- Feature docs: `kebab-case.md` (e.g., `trade-operations.md`)
- Dated docs: `YYYY-MM-DD-description.md` (e.g., `2025-10-09-completion-report.md`)

### Directories
- Use lowercase with hyphens: `multi-agent-system/`
- Be specific: `oauth/` not `auth-stuff/`
- Group logically: `features/implemented/` and `features/planned/`

---

## ✅ Checklist Before Creating Doc

- [ ] Checked if similar doc already exists
- [ ] Chose correct location from standards
- [ ] Used proper naming convention
- [ ] Included required sections (title, date, status, overview)
- [ ] Will link from `docs/README.md` if important
- [ ] NOT creating in root directory

---

## 🚨 Common Mistakes to Avoid

❌ Creating `FEATURE_PLAN.md` in root
✅ Create `docs/features/planned/feature-name.md`

❌ Multiple similar docs in different locations
✅ One canonical doc, linked from others

❌ No dates or status in document
✅ Always include last updated and status

❌ No links between related docs
✅ Cross-link related documentation

---

**Remember**: Keep documentation organized from the start. It's easier to maintain structure than to clean up chaos later.

**Last Updated**: 2025-10-09
**Status**: Active
