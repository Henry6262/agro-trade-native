# Agro-Trade Documentation

**Last Updated**: 2025-10-09
**Maintained By**: Development Team

---

## 📁 Documentation Structure

```
docs/
├── README.md (this file)           📍 Start here
│
├── project/                        📋 Project-level docs
│   ├── CONSTITUTION.md            - Project principles & values
│   ├── CLAUDE.md                  - Claude AI instructions
│   └── README.md                  - Agro-Trade overview
│
├── development/                    💻 Development guides
│   ├── multi-agent-system/        - AI development system
│   ├── backend/                   - Backend documentation
│   ├── mobile/                    - Mobile app documentation
│   └── admin-dashboard/           - Admin docs
│
├── features/                       ✨ Feature documentation
│   ├── implemented/               - Completed features
│   └── planned/                   - Future features
│
├── deployment/                     🚀 Deployment & setup
│   ├── DEPLOYMENT_GUIDE.md        - How to deploy
│   ├── oauth/                     - OAuth setup guides
│   └── infrastructure/            - Server setup
│
└── archive/                        📦 Historical docs
    └── old-plans/                 - Outdated planning docs
```

---

## 🎯 Quick Links

### For Development
- [Multi-Agent System](./development/multi-agent-system/README.md) - AI development workflow
- [Backend Docs](./development/backend/) - API & database
- [Mobile Docs](./development/mobile/) - React Native app

### For Features
- [Implemented Features](./features/implemented/) - What's built
- [Profit Model](./features/implemented/PROFIT_MODEL.md) - Commission calculations
- [Trade Operations](./features/implemented/TRADE_OPERATIONS.md) - Trade workflow

### For Deployment
- [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md) - How to deploy
- [OAuth Setup](./deployment/oauth/) - Google Sign-In

---

## 📝 Documentation Standards

### Where to Put New Docs

| Type of Document | Location | Example |
|------------------|----------|---------|
| Project principles | `docs/project/` | CONSTITUTION.md |
| Development guides | `docs/development/` | How to add feature |
| Feature specs | `docs/features/planned/` | New feature spec |
| Feature completion | `docs/features/implemented/` | Completed feature |
| Deployment guides | `docs/deployment/` | Setup guides |
| Old planning docs | `docs/archive/` | Outdated roadmaps |

### Naming Conventions

- Use UPPERCASE for important docs: `README.md`, `CONSTITUTION.md`
- Use kebab-case for feature docs: `trade-operations.md`
- Include dates in time-sensitive docs: `roadmap-2025-q4.md`
- Prefix reports with date: `2025-10-09-completion-report.md`

### Required Sections

Every doc should have:
```markdown
# Title

**Last Updated**: YYYY-MM-DD
**Status**: Draft | Active | Archived
**Related**: Links to related docs

## Overview
[What this doc covers]

## Content
[Main content]
```

---

## 🔄 Maintenance

### Quarterly Review
- Archive outdated planning docs
- Update completion status
- Remove duplicate content
- Check broken links

### When Creating New Docs
1. Check if similar doc exists
2. Use proper location (see table above)
3. Follow naming conventions
4. Link from this README if important

---

## 🤖 Agent Awareness

The multi-agent system is aware of this structure:
- `.claude/` - Agent configuration (separate from docs)
- `docs/` - Human-readable documentation
- `coordination/` - Runtime state files
- `contracts/` - Interface contracts

Agents should:
- ✅ Create feature docs in `docs/features/`
- ✅ Update completion reports in `docs/features/implemented/`
- ✅ Archive old plans to `docs/archive/`
- ❌ Not create root-level .md files

---

## 📚 Main Documents

### Project Level
- [Constitution](./project/CONSTITUTION.md) - Project principles
- [Claude Instructions](./project/CLAUDE.md) - AI development guidelines

### Development System
- [Multi-Agent System Overview](./development/multi-agent-system/README.md)
- [How to Use the System](./development/multi-agent-system/HOW_TO_USE.md)
- [Daily Workflow](./development/multi-agent-system/workflows/DAILY_WORKFLOW.md)

### Key Features
- [Trade Operations](./features/implemented/TRADE_OPERATIONS.md)
- [Profit Model](./features/implemented/PROFIT_MODEL.md)
- [Simulation Module](./features/implemented/SIMULATION_MODULE.md)

### Deployment
- [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md)
- [OAuth Setup](./deployment/oauth/GOOGLE_SIGNIN_SETUP.md)

---

**Need help finding something?** Check the structure above or search: `grep -r "keyword" docs/`
