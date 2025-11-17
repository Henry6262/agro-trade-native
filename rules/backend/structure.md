# Structure & Naming Rules

## Directory Layout
```
backend/
├── src/
│   ├── <domain>/              # One folder per bounded-context (buyer, seller, transport, etc.)
│   │   ├── dto/               # Request/response DTOs, validation pipes
│   │   ├── controllers/       # Optional subfolder if >1 controller
│   │   ├── services/          # Business services, queue handlers
│   │   ├── entities/          # Prisma mappers / aggregates (optional)
│   │   ├── *.module.ts        # Nest module wiring providers/controllers
│   │   └── index.ts           # Re-exports if the domain is consumed elsewhere
│   ├── common/                # Shared guards, interceptors, filters, decorators
│   ├── config/                # Configuration providers
│   ├── main.ts                # Bootstrap (no business logic)
│   └── app.module.ts          # Root module only imports feature modules
├── prisma/                    # Schema + migrations (single source of truth)
├── test/                      # Jest unit suites (match service/controller file names)
├── tests/                     # E2E suites (Supertest)
└── scripts/                   # Seeders / automation helpers (TypeScript only)
```

## Module Rules
- Every domain folder with a module must contain `<domain>.module.ts`, `<domain>.controller.ts`, `<domain>.service.ts`, and a `dto/` folder with exported DTOs.
- Additional controllers/services live under `controllers/` or `services/` subfolders, but the module file must import/export them explicitly.
- No business logic in controllers; they delegate to services.
- Cross-domain access happens through provider injection (e.g., `TradeOperationsService` injected into `InspectionsService`). Never import repositories/services directly without Nest DI.

## Naming
- Files use kebab-case; classes/interfaces use PascalCase.
- DTOs end with `Dto` or `ResponseDto` and live under `dto/`.
- Services end with `Service`; controllers end with `Controller`.
- Background processors live under `services/` (e.g., `transport-bidding-queue.service.ts`) and are registered in the module providers.

## Forbidden Patterns
- No mixed responsibilities (controller/service/dto) inside the same file.
- No global singletons outside Nest modules (use DI providers instead).
- No direct Prisma client usage outside `PrismaService` – inject `PrismaService` via constructor.
- Feature-specific constants belong in the domain folder (e.g., `transport/constants.ts`). Shared constants go in `src/common/constants/`.
