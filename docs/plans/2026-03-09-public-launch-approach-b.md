# AgroTrade Public Launch — Approach B Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a fully-functional public demo where every user role (Buyer, Seller, Inspector, Transporter) can complete all their operations AND receive real-time updates.

**Architecture:** Logic-first — wire existing endpoints to actually work end-to-end, add the missing WebSocket gateway (packages already installed, gateway was never built), integrate Expo Push, then rebuild the dev client so native modules work.

**Tech Stack:**
- Backend: NestJS 10 + Prisma + `@nestjs/websockets` + `socket.io` 4 (already in package.json)
- Frontend: Expo (new arch enabled, `expo-image-picker`, `expo-notifications`, `expo-location` all in app.json)
- Push: `expo-server-sdk` on backend, Expo Push Service

---

## Current State (Read Before Starting)

### Already Works — Just Needs Testing
| Feature | Backend endpoint | Frontend call |
|---|---|---|
| Buyer confirm-receipt | `POST /api/buyer/orders/:id/confirm-receipt` | `buyerService.confirmDelivery(orderId)` |
| Inspector job list | `GET /api/inspector/jobs` | `inspectionService.getInspectorMissions()` |
| Inspector accept job | `POST /api/inspector/jobs/:id/accept` | `inspectionService.acceptJob()` |
| Inspector submit results | `POST /api/inspections/:id/results` | `inspectionService.submitInspectionResults()` |
| Inspector photo capture | `expo-image-picker` in `VerificationForm.tsx` | local URI → passed as `photos[]` string array |

### Critical Gaps
| Gap | Impact |
|---|---|
| **No WebSocket gateway** (packages installed, never wired up) | All real-time events are silent — offers, trade updates, inspection results never push |
| **No Expo Push** (`expo-server-sdk` not installed) | No background notifications |
| **No device token endpoint** | App can't register for push |
| **EAS dev build may be stale** | `newArchEnabled: true` + Sentry plugin = won't run in Expo Go |

---

## Task 1: Backend Socket.IO Gateway

**Files:**
- Create: `backend/src/realtime/realtime.module.ts`
- Create: `backend/src/realtime/realtime.gateway.ts`
- Create: `backend/src/realtime/realtime.service.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/negotiations/services/negotiation.service.ts`
- Modify: `backend/src/trade-operations/services/trade-operation.service.ts` (line ~1299)

> **Context for implementor:**
> - `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io@4.6.2` are already installed in `backend/package.json`. Do NOT run `npm install` for these.
> - The frontend `socketService.ts` connects to `WS_URL` (production: `wss://agro-trade-native-production.up.railway.app`) and listens for: `offer:new`, `offer:updated`, `offer:expired`, `trade:updated`.
> - `SocketProvider.tsx` also calls `socket.emit('join', { userId })` on connect — your gateway should handle this to let you send user-specific events later.
> - CORS: in production, Railway's origin will be the frontend URL. To keep it simple, allow all origins for now (it's already effectively public API).

**Step 1: Create `realtime.service.ts`**

```typescript
// backend/src/realtime/realtime.service.ts
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emit(event: string, data: unknown) {
    if (!this.server) return;
    this.server.emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
```

**Step 2: Create `realtime.gateway.ts`**

```typescript
// backend/src/realtime/realtime.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly realtimeService: RealtimeService) {}

  afterInit(server: Server) {
    this.realtimeService.setServer(server);
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, payload: { userId: string }) {
    if (payload?.userId) {
      client.join(`user:${payload.userId}`);
      this.logger.debug(`Client ${client.id} joined room user:${payload.userId}`);
    }
  }
}
```

**Step 3: Create `realtime.module.ts`**

```typescript
// backend/src/realtime/realtime.module.ts
import { Global, Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

@Global()
@Module({
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
```

**Step 4: Register in AppModule**

In `backend/src/app.module.ts`, add `RealtimeModule` to imports:
```typescript
import { RealtimeModule } from './realtime/realtime.module';
// ... add to imports array before other modules:
RealtimeModule,
```

**Step 5: Wire offer events in NegotiationService**

In `backend/src/negotiations/services/negotiation.service.ts`:
- Inject `RealtimeService` in the constructor
- After creating a new negotiation/offer: `this.realtimeService.emit('offer:new', negotiation)`
- After updating status to ACCEPTED: `this.realtimeService.emit('offer:updated', negotiation)`
- After expiring an offer: `this.realtimeService.emit('offer:expired', { id })`

Find the constructor: `constructor(private readonly prisma: PrismaService, ...)` and add `private readonly realtimeService: RealtimeService`.

**Step 6: Wire trade:updated in TradeOperationService**

In `backend/src/trade-operations/services/trade-operation.service.ts`:
- Inject `RealtimeService`
- After `buyerConfirmDelivery()` completes: emit `trade:updated` with the updated operation
- After `updatePhase()` or any status change: emit `trade:updated`

**Step 7: Build and push**

```bash
cd /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/backend
npm run build
# Verify: dist/realtime/realtime.gateway.js should exist
ls dist/realtime/
```

Expected: `realtime.gateway.js`, `realtime.module.js`, `realtime.service.js`

**Step 8: Commit and push**

```bash
cd /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native
git add backend/src/realtime/ backend/src/app.module.ts backend/src/negotiations/ backend/src/trade-operations/
git commit -m "feat: add Socket.IO gateway for real-time events"
git push origin main
```

Railway will auto-deploy. Wait ~3 minutes.

**Step 9: Verify WebSocket connection**

From a terminal or from the running app, check that:
```bash
# Production WebSocket test (requires wscat: npm install -g wscat)
wscat -c wss://agro-trade-native-production.up.railway.app/socket.io/?EIO=4&transport=websocket
# Should receive: 0{"sid":"...","upgrades":[],"pingInterval":25000,"pingTimeout":5000}
```

---

## Task 2: Expo Push Notifications

**Files:**
- Modify: `backend/package.json` (add `expo-server-sdk`)
- Modify: `backend/src/notifications/notification.service.ts`
- Modify: `backend/src/notifications/notification.controller.ts`
- Modify: `front-end/src/providers/SocketProvider.tsx` (register push token)

> **Context for implementor:**
> - Expo Push works without Firebase/APNS setup in dev — the Expo Push Service handles that.
> - The backend `notification.service.ts` already has `sendNotification()` — it logs + stores in DB. We just add an Expo push call inside it.
> - No `Notification` DB table exists — tokens will be stored in a `pushTokens` JSON column on `User`, OR in a new `PushToken` table. Easiest: add a `pushToken` field to `User` in Prisma schema and run a migration.
> - In Expo SDK 50+, `registerForPushNotificationsAsync()` returns an `ExpoPushToken` string like `ExponentPushToken[xxxxxx]`.

**Step 1: Install expo-server-sdk in backend**

```bash
cd /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/backend
npm install expo-server-sdk
```

**Step 2: Add pushToken column to User**

In `backend/prisma/schema.prisma`, find the `User` model and add:
```prisma
pushToken   String?
```

**Step 3: Create and apply migration**

```bash
cd /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/backend
npx prisma migrate dev --name add_push_token_to_user
```

**Step 4: Add device registration endpoint**

In `backend/src/notifications/notification.controller.ts`, add:
```typescript
@Post('register-device')
@HttpCode(HttpStatus.OK)
async registerDevice(
  @Body('pushToken') pushToken: string,
  @Request() req: any,
) {
  const userId = req?.user?.id;
  if (!userId || !pushToken) {
    return { success: false, message: 'Missing userId or pushToken' };
  }
  await this.notificationService.registerPushToken(userId, pushToken);
  return { success: true };
}
```

**Step 5: Implement push sending in NotificationService**

In `backend/src/notifications/notification.service.ts`:
```typescript
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

// Add at class level:
private expo = new Expo();

// Add new method:
async registerPushToken(userId: string, pushToken: string) {
  await this.prisma.user.update({
    where: { id: userId },
    data: { pushToken },
  });
}

// Modify sendNotification() to add after the logger.log line:
private async sendPushNotification(notification: NotificationPayload, recipientId?: string) {
  try {
    const user = recipientId
      ? await this.prisma.user.findUnique({ where: { id: recipientId }, select: { pushToken: true } })
      : null;

    const token = user?.pushToken;
    if (!token || !Expo.isExpoPushToken(token)) return;

    const message: ExpoPushMessage = {
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.message,
      data: { actionUrl: notification.actionUrl, tradeOperationId: notification.tradeOperationId },
    };

    await this.expo.sendPushNotificationsAsync([message]);
    this.logger.log(`Push sent to ${token}`);
  } catch (err) {
    this.logger.error('Failed to send push notification', err);
  }
}
```

Then call `this.sendPushNotification(notification, notification.recipientId)` inside `sendNotification()`.

**Step 6: Frontend — register push token after auth**

In `front-end/src/providers/SocketProvider.tsx` (or create a new `PushNotificationProvider.tsx`), add after socket connects:

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

async function registerForPush() {
  if (Platform.OS === 'web') return;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '9a2f3b44-4a6b-49e4-a05a-83c3f0a864db', // from app.json extra.eas.projectId
  });
  // POST to backend
  await fetch(`${API_URL}/notifications/register-device`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ pushToken: token.data }),
  });
}
```

Call `registerForPush()` when `user` and `token` are available in the auth store.

**Step 7: Handle tap-to-navigate**

In `App.tsx` or the root provider, add:
```typescript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Foreground listener — already handled by SocketProvider in-app notifications
// Background tap navigation: listen to lastNotificationResponseAsync
```

**Step 8: Build, migrate, push**

```bash
cd /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/backend
npm run build
git add prisma/schema.prisma prisma/migrations/ src/notifications/ package.json package-lock.json
git commit -m "feat: add Expo push notifications with device token registration"
git push origin main
```

Wait for Railway auto-deploy (~3 min). The `startCommand` includes `npx prisma migrate deploy` which will apply the new `pushToken` migration.

---

## Task 3: Verify Buyer Confirm-Receipt (E2E)

**Files:** No code changes — this is a verification task.

> **Context:** `POST /api/buyer/orders/:orderId/confirm-receipt` calls `tradeOperationService.buyerConfirmDelivery(tradeOperationId, buyerId)` which expects a trade operation in `DELIVERED` phase and transitions it to `COMPLETED`. The `orderId` param is actually the **tradeOperationId**. Both frontend and backend are already implemented.

**Step 1: Find a trade operation in DELIVERED phase**

```bash
# Use production API (get a bearer token first from app login)
curl -H "Authorization: Bearer <TOKEN>" \
  https://agro-trade-native-production.up.railway.app/api/buyer/trades | jq '.[] | select(.phase == "DELIVERED") | .id'
```

If none exist (demo data not progressed that far), either:
- (a) Use Swagger at `https://agro-trade-native-production.up.railway.app/api/docs` to manually advance a trade to DELIVERED
- (b) Create a simulation or directly check what phases exist in DB

**Step 2: Call the confirm-receipt endpoint**

```bash
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  https://agro-trade-native-production.up.railway.app/api/buyer/orders/<TRADE_OP_ID>/confirm-receipt
```

Expected: `{ success: true, message: "Delivery confirmed", id: "..." }`

**Step 3: Verify in the app**

Open the Buyer dashboard → Orders tab → Pull to refresh → Confirm the trade shows as COMPLETED.

---

## Task 4: EAS Dev Client Build

> **Context:**
> - `app.json` has `"newArchEnabled": true` + `@sentry/react-native/expo` plugin → **Expo Go will NOT work**. You need an EAS dev build.
> - `expo-camera`, `expo-image-picker`, `expo-location`, `expo-notifications` are all already in `app.json` plugins. No changes needed.
> - EAS project ID: `9a2f3b44-4a6b-49e4-a05a-83c3f0a864db`
> - Expo owner: `henry6262`
> - The current production API URL should already be set in `front-end/.env`.

**Step 1: Check current dev build profile in eas.json**

```bash
cat /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/front-end/eas.json
```

Ensure the `development` profile exists and has `"developmentClient": true`.

**Step 2: Trigger iOS dev build**

```bash
cd /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/front-end
eas build --profile development --platform ios
```

This takes 10-20 minutes on EAS servers. You don't need to wait — it runs async.

**Step 3: (Optional) Android dev build**

```bash
eas build --profile development --platform android
```

**Step 4: Install on device**

When build completes, scan the QR code from the EAS dashboard or `eas build:list`. Install the `.ipa` via TestFlight internal or direct install.

**Step 5: Start Metro bundler**

```bash
cd /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/front-end
npx expo start --dev-client
```

---

## Task 5: Verify Inspector End-to-End (Post-Build)

**Files:** No code changes — verification only.

> **Context:** The inspector VerificationForm uses `expo-image-picker` for photos. Photos are stored as local device URIs (e.g. `file:///...`), passed as `photos: string[]` to `POST /inspections/:id/results`. Backend stores them as JSON strings. They won't be viewable by others but the submission itself works fine for MVP.

**Step 1: Log in as an Inspector user in the new dev build**

**Step 2: Check available jobs**

Inspector dashboard → Available Jobs → verify jobs list loads.

**Step 3: Accept a job**

Tap Accept → calls `POST /inspector/jobs/:id/accept` → job should appear in Active Job.

**Step 4: Submit verification**

Active Job tab → Start Verification → fill in specs → Add Photo (camera or gallery) → set quality score (e.g. 85) → Submit.

Expected: success alert, job disappears from active, trade operation advances to `TRANSPORT_MATCHING` (verify via `GET /trade-operations/:id`).

---

## Bonus Task: Real-Time Smoke Test

After Task 1 (WebSocket gateway) is deployed:

**Step 1:** Log in on two devices/simulators — one as Buyer, one as Seller.

**Step 2:** Seller creates a new offer → Buyer device should show in-app notification immediately (no refresh needed). This exercises `offer:new` from `SocketProvider.tsx`.

**Step 3:** Buyer accepts the offer → both devices should see updated state without manual refresh. This exercises `trade:updated`.

---

## Priority Order

| # | Task | Time | Blocks |
|---|---|---|---|
| 1 | Backend WebSocket gateway | 45 min | Real-time for all roles |
| 2 | EAS dev build (async) | 10 min setup, 20 min cloud | Inspector camera works |
| 3 | Verify buyer confirm-receipt | 15 min | Buyer complete flow |
| 4 | Expo Push notifications | 60 min | Background updates |
| 5 | E2E inspector verification | 20 min | Inspector complete flow |
| 6 | Real-time smoke test | 20 min | Demo confidence |

**Run Task 2 (EAS build) in parallel with Task 1 — kick it off first so it's building while you implement the gateway.**
