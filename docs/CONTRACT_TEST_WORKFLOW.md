# API Contract Workflow

This note captures the repeatable flow for keeping the OpenAPI contract, the Postman collection, and the Dredd contract tests in sync while we iterate on the backend.

## 1. Prerequisites

- Install backend deps once: `npm install`
- Ensure the database has an admin user (`admin@agrotrade.com` / `admin123`). The quickest option during development is `npm run prisma:seed` or `npx ts-node src/scripts/add-admin.ts`.
- Dredd runs against a live API at `http://localhost:4000`, so start the Nest API in another terminal before running the contract suite: `npm run start:dev`.

You can override the credentials Dredd uses by exporting `DREDD_EMAIL` / `DREDD_PASSWORD`.

## 2. Update the contract

```
npm run openapi:export
```

This refreshes `openapi/agro-trade.yaml` and the JSON variant. Always run it after controller/DTO changes.

## 3. Regenerate Postman collection

```
npm run openapi:postman
```

This uses `openapi-to-postmanv2` to write `openapi/agro-trade.postman_collection.json`. Import that file in Postman to get the latest routes with auth headers pre-wired.

## 4. Run contract tests (Dredd)

```
DREDD_EMAIL=admin@agrotrade.com \
DREDD_PASSWORD=admin123 \
npm run contract:test
```

What happens:

1. `dredd.yml` boots the API (already running) and loads the exported OpenAPI document.
2. `dredd-hooks.js` logs in with the provided credentials and injects the bearer token into every request.
3. Dredd exercises each path/verb and fails fast if the response body or status doesn’t match the contract.

## 5. CI / Troubleshooting checklist

- Regenerate the OpenAPI and Postman artifacts in the same commit as controller changes.
- If contract tests fail with `401`, confirm the admin credentials exist and match the env vars.
- When DTOs change, update both the controller serializer and the sample examples in the spec so Postman remains useful for manual testing.

Keeping these steps in our PR checklist prevents silent contract drift and ensures the orchestrator dashboard can trust the documented payloads.
