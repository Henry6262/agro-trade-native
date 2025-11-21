# Structure Rules (React Native)

## Mandatory Hierarchy
```
front-end/src/
├── app/                # shared ui, layout, services, store, utils
├── pages/
│   └── PageName/
│       ├── components/
│       ├── hooks/
│       ├── sections/
│       │   └── SectionName/
│       │       ├── components/
│       │       ├── hooks/
│       │       ├── features/
│       │       │   └── FeatureName/
│       │       │       ├── components/
│       │       │       ├── hooks/
│       │       │       ├── service.ts
│       │       │       ├── types.ts
│       │       │       ├── utils.ts (optional)
│       │       │       ├── store.ts (optional)
│       │       │       └── index.tsx
│       │       ├── types.ts
│       │       └── index.tsx
│       ├── types.ts
│       └── index.tsx
└── ...
```

## Required Files per Feature
Each `FeatureName/` folder **must** contain:
- `components/` – presentation-only components (may include `index.ts` barrel). Split large components (>150 lines) into multiple files under this folder.
- `hooks/` – React hooks (`useFeature.ts`, etc.).
- `service.ts` – API/business logic (exports service object).
- `types.ts` – local interfaces/enums.
- `utils.ts` (optional) – pure helper functions.
- `store.ts` (optional) – Zustand store if state shared across feature components.
- `index.tsx` – main feature component (exports default or named component).

Sections and pages follow the same pattern (minus service/store unless needed).

### Shared Features
- If multiple roles/pages use the same feature (e.g., ProductSelection for seller + buyer), place it under `pages/<Page>/features/shared/<FeatureName>/`.
- Shared features still require the full structure (`components`, `hooks`, `service.ts`, `types.ts`, etc.) and expose configuration via props.
- Role-specific folders import shared features and wrap them with localized copy/filters rather than duplicating logic.

## File-Size Limits
| File Type  | Limit | Action if exceeded |
|------------|-------|--------------------|
| Component  | 650 lines | Split into smaller components (structure still encourages smaller units) |
| Hook       | 200 lines | Extract helpers or additional hooks |
| Service    | 200 lines | Split per domain or move helpers to utils |
| Store      | 100 lines | Break into multiple stores |
| Utils      | 150 lines | Split by concern |

No component/hook/service file may violate these limits. Enforce via lint/hook (planned).

## Naming
- Components: `PascalCase.tsx` inside `components/`.
- Hooks: `useSomething.ts`.
- Stores: `store.ts` exporting `useFeatureStore`.
- Barrel files: optional `index.ts` to re-export components/hooks.

## Migration Guidance
- New code must target `src/pages/**`. Legacy `src/features/**` remains only until migration finishes (see `docs/coordination/mobile-migration-plan.md`).
- Navigation: expose page entry components from `pages/PageName/index.tsx` and wire them into existing React Navigation stacks/tabs.
