# Agro-Trade Constitution

## Core Principles

### I. Mobile-First Architecture
Every feature must be designed for mobile devices first. Desktop/web versions are secondary. All UI components must be touch-optimized with minimum 44px touch targets.

### II. Three-Actor System
The platform serves exactly three user types: Buyers, Sellers, and Transporters. Every feature must clearly identify which actor(s) it serves. No feature should require understanding of all three roles to function.

### III. Test-First Development (NON-NEGOTIABLE)
Starting with the Maps feature onwards:
- Write tests BEFORE implementation
- Tests must be approved before coding begins
- Follow Red-Green-Refactor cycle strictly
- Minimum 80% code coverage for new features

### IV. Mock-First Development
All features start with mock data. Real API integration comes only after UI/UX is validated. Mock data must be realistic and cover edge cases.

### V. Component Reusability
Use existing shared components before creating new ones. A component needs 3+ uses before abstraction. No premature optimization.

### VI. State Management Simplicity
- Local state (useState) for component-specific data
- Zustand for feature-specific state
- React Query for server state
- No Redux, MobX, or complex state solutions

### VII. Technology Stack Constraints
Frontend: React Native + Expo only. No ejecting.
Backend: NestJS + Prisma only. No raw SQL.
Styling: NativeWind (Tailwind) only. No StyleSheet objects for new code.
Maps: Google Maps via react-native-maps only.

### VIII. API Design Principles
- RESTful endpoints for CRUD operations
- WebSockets for real-time updates only
- All responses must include success flag and data/error
- Pagination required for lists > 20 items

## Development Workflow

### Feature Development Process
1. Create specification using /specify
2. Create technical plan using /plan
3. Generate tasks using /tasks
4. Write tests first
5. Implement to pass tests
6. Refactor for clarity
7. Document changes

### Code Review Requirements
- All PRs must reference a specification
- Tests must pass before review
- No direct commits to main branch
- Minimum one approval required

### Quality Gates
- [ ] Tests written and passing
- [ ] TypeScript types complete (no `any`)
- [ ] Mock data covers edge cases
- [ ] Component works on iOS and Android
- [ ] Accessibility labels present

## Complexity Management

### Maximum Complexity Rules
- Maximum 3 levels of component nesting
- Maximum 5 props per component
- Maximum 100 lines per component file
- Maximum 3 API calls per screen

### When Complexity is Justified
Document in code comments when exceeding limits:
- Performance requirements
- Third-party integration requirements
- Platform-specific implementations

## Security & Privacy

### Data Handling
- No sensitive data in console.log
- No API keys in code (use environment variables)
- Location data requires explicit user consent
- All user data must be deletable

### Authentication
- JWT tokens with 24-hour expiry
- Refresh tokens with 7-day expiry
- Google OAuth as primary authentication
- Email/password as fallback only

## Performance Standards

### Mobile Performance
- App launch < 3 seconds
- Screen navigation < 500ms
- List scrolling at 60fps
- Image lazy loading required

### API Performance
- Response time < 1 second for queries
- Response time < 3 seconds for mutations
- Batch operations for > 10 items
- Implement caching where appropriate

## Governance

This constitution supersedes all other development practices for the Agro-Trade platform.

### Amendment Process
1. Propose change with justification
2. Team review and discussion
3. Update version and amendment date
4. Communicate changes to all developers

### Compliance Verification
- All new features must comply with constitution
- Violations must be documented with justification
- Technical debt from violations must be tracked

**Version**: 1.0.0 | **Ratified**: 2024-01-13 | **Last Amended**: 2024-01-13