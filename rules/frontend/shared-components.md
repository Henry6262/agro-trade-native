# Shared Components & Multi-Role Feature Guidance

Some onboarding flows share UI/logic across roles (e.g., ProductSelection for sellers & buyers). Use this structure:

```
pages/Onboarding/
├── components/shared/       # fully shared components
├── hooks/shared/            # shared hooks
├── sections/
│   ├── Seller/
│   │   └── features/
│   ├── Buyer/
│   └── Transporter/
├── features/shared/         # shared functional modules
└── features/<RoleSpecific>/
```

## Rules
- If a feature is used by more than one role, create it under `pages/Onboarding/features/shared/<FeatureName>/` with the full structure (`components/`, `hooks/`, `service.ts`, etc.).
- Role-specific wrappers live in each section and reuse the shared feature by composition (passing role-specific props/filters).
- Shared stores belong in `features/shared/<Feature>/store.ts` if state crosses roles.
- Documentation must note when a feature is shared and how roles customize it.
