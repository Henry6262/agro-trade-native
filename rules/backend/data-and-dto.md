# Data, DTOs & Validation

## Prisma Schema
- `prisma/schema.prisma` is the single source of truth for DB models. Update schema + migrations together (no raw SQL one-offs).
- Use descriptive relation names and explicit `@@index` / `@@unique` constraints for business rules.
- Regenerate Prisma client (`npx prisma generate`) whenever the schema changes before running tests or committing.
- Document schema updates in `docs/reference/db-schema.md` via `node scripts/atctl.mjs docs --sync`.

## DTO Guidelines
- Every request/response uses typed DTOs stored in `src/<domain>/dto/`.
- Validate inputs with `class-validator` decorators; prefer explicit `@IsEnum`, `@IsUUID`, `@IsOptional` for clarity.
- Version DTOs when breaking changes occur (`CreateOfferDtoV2`) and phase out the old version deliberately.
- Convert Prisma models to DTOs in services (or dedicated mappers) before returning to controllers; never leak raw Prisma objects.

## Error Handling & Domain Responses
- Services throw typed exceptions (`NotFoundException`, `ConflictException`, `UnprocessableEntityException`), not strings.
- Controllers should not wrap responses manually; rely on DTO classes or presenters for shape enforcement.
- When exposing list endpoints, always include pagination metadata (limit, offset, total) or document why not.

## External Integrations
- HTTP calls to third-party services (e.g., Puppeteer orchestrators, geocoding) must live in dedicated provider classes placed under `src/<domain>/services/clients/` and unit tested with mocks.
- Secrets and tokens pulled from `ConfigService`; never inline.
