# Controllers, Services & Providers

## Controllers
- Expose REST endpoints only (route decorators + validation pipes).
- Translate request DTOs to service calls and map responses back to DTOs.
- No direct DB or third-party calls.
- Handle errors via Nest exception filters or rethrow typed exceptions (400/404/409/500).
- Keep controllers ≤300 lines; split by resource when necessary (e.g., `transport.controllers/transport-offers.controller.ts`).

## Services
- Contain the entire business workflow for the domain.
- Inject `PrismaService`, queue clients, HTTP clients, or other domain services via constructor.
- Perform validation/authorization beyond DTO/class-validator requirements.
- Split into smaller services when a file exceeds 400 lines or handles multiple aggregates (e.g., `TransportOffersService`, `TransportFleetService`).
- All mutations return the persisted entity or a typed DTO; never return raw Prisma promises.

## Pipes, Guards & Interceptors
- Shared utilities reside in `src/common/*` with dedicated modules.
- Domain-specific guards stay inside the domain folder and are exported via the module so controllers can inject them.

## Dependency Rules
- Domain modules import other domain modules only via the module metadata (no circular dependencies). If circularity appears, extract a shared provider into `src/common/` or `src/modules/shared/`.
- Background services (Bull processors, schedulers) live in the same domain module and register themselves using `BullModule.registerQueue` or `ScheduleModule` inside the module file.

## Providers & Configuration
- Keep configuration (API keys, cron expressions) under `src/config/` using Nest ConfigModule; inject configuration via `@Inject(ConfigService)`.
- Never read from `process.env` outside `ConfigService`.
