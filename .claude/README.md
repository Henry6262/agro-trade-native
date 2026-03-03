# AgroTrade Development

## Project Docs

- `docs/API_REFERENCE.md` — Every API endpoint with auth, body, response
- `docs/STATE_MACHINES.md` — All state transitions and cascades
- `docs/TEST_SCENARIOS.md` — Simulation scenarios with exact API calls
- `docs/ARCHITECTURE.md` — Product overview and user journeys
- `rules/backend/` — NestJS coding standards
- `rules/frontend/` — React Native coding standards

## Dev Commands

```bash
# Backend
cd backend && npm run start:dev     # Dev mode with hot reload
cd backend && npm run build         # Production build
cd backend && node dist/main.js     # Run production build

# Admin Dashboard
cd admin-dashboard && npm run dev

# Mobile
cd front-end && npx expo start

# Database
cd backend && npx prisma studio     # Visual DB browser
cd backend && npx ts-node prisma/seed.ts         # Core seed (products, regions)
cd backend && npx ts-node prisma/seed-demo.ts    # Demo data (trades, users)
cd backend && npx ts-node src/scripts/add-admin.ts  # Ensure admin exists
```

## Key URLs

- Backend API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs/
- Admin Dashboard: http://localhost:5173
- Prisma Studio: http://localhost:5555
