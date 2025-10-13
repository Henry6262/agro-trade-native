# 🚀 Agro-Trade Multi-Agent Development System
## Complete Architecture & Implementation Guide

---

## 🎯 System Overview

### The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCT ARCHITECT                             │
│            (Strategic Coordination Layer)                        │
│  • Feature planning & prioritization                            │
│  • Agent deployment & coordination                              │
│  • Blocker resolution & decisions                               │
│  • Cross-platform integration validation                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
      ┌──────────┴──────────┬──────────────┬─────────────┐
      │                     │              │             │
┌─────▼──────┐    ┌────────▼────────┐  ┌─▼──────────┐ ┌▼────────────┐
│   MOBILE   │    │    BACKEND      │  │   ADMIN    │ │  TESTING    │
│    LEAD    │◄───┤     LEAD        │──►  DASHBOARD │ │   SYSTEM    │
│            │    │                 │  │    LEAD    │ │             │
│ • Buyer    │    │ • NestJS APIs   │  │ • Scenario │ │ • E2E Tests │
│ • Seller   │    │ • Prisma DB     │  │   Orchestr.│ │ • Scenarios │
│ • Transp.  │    │ • Auth & Logic  │  │ • Monitoring│ │ • API Val. │
│ • Inspector│    │ • WebSockets    │  │ • Analytics│ │ • Reports  │
└────────────┘    └─────────────────┘  └────────────┘ └─────────────┘
      │                    │                   │              │
      └────────────────────┴───────────────────┴──────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   INTEGRATION STATUS    │
                    │    (Coordination Hub)   │
                    │                         │
                    │  • Milestone tracking   │
                    │  • Blocker escalation   │
                    │  • Contract validation  │
                    │  • Quality gates        │
                    └─────────────────────────┘
```

### Core Philosophy

**Specialized Autonomy with Coordinated Integration**

- Each agent has **clear domain ownership**
- Agents work **autonomously** within their domain
- **Contracts enforce** cross-domain boundaries
- **Automated testing** validates integration
- **Status files** coordinate async work

---

## 📂 File Structure

```
/Users/henry/agro-trade/
├── .claude/                              # Agent Configuration
│   ├── CLAUDE.md                         # Master routing config
│   ├── ARCHITECT.md                      # Product Architect identity
│   ├── MOBILE_LEAD.md                    # Mobile development agent
│   ├── BACKEND_LEAD.md                   # Backend development agent
│   ├── ADMIN_DASHBOARD_LEAD.md          # Admin tools agent
│   ├── INTEGRATION_TEST_LEAD.md         # Integration testing agent
│   └── SCENARIO_TEST_LEAD.md            # Trade scenario testing agent
│
├── coordination/                         # Shared coordination files
│   ├── INTEGRATION_STATUS.json          # Central coordination hub
│   ├── TEST_REPORT.json                 # Latest test results
│   ├── SPRINT_PLAN.json                 # Current sprint milestones
│   └── BLOCKERS.json                    # Active blockers & escalations
│
├── contracts/                            # Interface contracts (THE LAW)
│   ├── api-contract.ts                  # REST API contract
│   ├── event-contract.ts                # WebSocket event contract
│   ├── database-schema.prisma           # Source of truth schema
│   └── mobile-components.ts             # Shared UI patterns
│
├── front-end/                            # React Native Mobile App
│   ├── src/
│   │   ├── features/                    # Feature modules
│   │   ├── shared/                      # Shared components
│   │   └── contracts/                   # Symlink to /contracts
│   └── tests/
│       └── integration/                 # Mobile E2E tests
│
├── backend/                              # NestJS Backend
│   ├── src/
│   │   ├── modules/                     # Feature modules
│   │   ├── prisma/                      # Database schema
│   │   └── contracts/                   # Symlink to /contracts
│   └── tests/
│       └── integration/                 # API integration tests
│
├── admin-dashboard/                      # React Admin Dashboard
│   ├── src/
│   │   ├── components/                  # Admin components
│   │   ├── services/                    # API clients
│   │   └── contracts/                   # Symlink to /contracts
│   └── tests/
│
├── test-suite/                           # Integration & Scenario Tests
│   ├── integration/                     # Cross-platform tests
│   ├── scenarios/                       # Trade flow scenarios
│   └── reports/                         # Test reports
│
└── docs/
    ├── DEVELOPMENT_WORKFLOW.md          # Daily workflows
    ├── API_DOCUMENTATION.md             # Generated from contracts
    └── TESTING_GUIDE.md                 # Testing strategies
```

---

## 🤖 Agent Definitions

### 1. Product Architect (Orchestrator)

**When to Use:**
- Starting new sprint/feature
- Multiple blockers need resolution
- Strategic decisions needed
- Cross-platform coordination required

**Responsibilities:**
- Plan features across mobile/backend/admin
- Deploy specialized agents for tasks
- Monitor INTEGRATION_STATUS.json for blockers
- Make architectural decisions
- Ensure contract synchronization
- Validate integration before sprint completion

**Daily Workflow:**
```
Morning:
1. Review INTEGRATION_STATUS.json
2. Check TEST_REPORT.json from previous day
3. Plan today's milestones
4. Deploy specialized agents with clear objectives

During:
5. Monitor for blocker escalations
6. Resolve cross-domain issues
7. Validate contract changes

Evening:
8. Review all agent progress
9. Deploy Integration Test Lead
10. Approve sprint completion (if tests pass)
```

**Never:**
- Write feature code directly (delegate to specialists)
- Approve sprint without passing integration tests
- Change contracts without syncing all repos

---

### 2. Mobile Lead (React Native Expert)

**When to Use:**
- Building/fixing buyer features
- Building/fixing seller features
- Building/fixing transporter features
- Building/fixing inspector features
- Mobile UI/UX improvements

**Domain:**
```
/front-end/
├── Buyer screens & flows
├── Seller screens & flows
├── Transporter screens & flows
├── Inspector screens & flows
├── Shared mobile components
├── Navigation & state management
└── Mobile-specific business logic
```

**Responsibilities:**
- Implement mobile features using React Native + Expo
- Follow NativeWind styling standards
- Use Zustand for state, React Query for server state
- Update API contract when new endpoints needed
- Test on iOS/Android before marking complete
- Update INTEGRATION_STATUS.json after each milestone

**Technical Standards:**
- TypeScript strict mode
- NativeWind classes (NO StyleSheet.create)
- Mock data first, real API second
- Test-first for new features (SDD approach)
- Functional components with hooks
- Never eject from Expo

**Coordination:**
- Read contracts/api-contract.ts before API calls
- Request new endpoints via blocker escalation
- Never modify backend code
- Update mobile test suite

---

### 3. Backend Lead (NestJS Expert)

**When to Use:**
- Creating/updating API endpoints
- Database schema changes
- Business logic implementation
- Authentication/authorization
- WebSocket events

**Domain:**
```
/backend/
├── NestJS controllers & services
├── Prisma schema & migrations
├── Authentication (JWT, Google OAuth)
├── Business logic (trade operations, negotiations, etc.)
├── WebSocket gateways (inspector tracking, notifications)
└── API validation & error handling
```

**Responsibilities:**
- Implement backend APIs following NestJS patterns
- Maintain Prisma schema as source of truth
- Implement contract endpoints exactly as specified
- Write integration tests for all endpoints
- Handle database migrations safely
- Update INTEGRATION_STATUS.json after each milestone

**Technical Standards:**
- NestJS modules, controllers, services pattern
- Prisma for all database operations
- DTOs with class-validator
- Swagger/OpenAPI documentation
- Unit tests + integration tests
- No direct SQL (use Prisma)

**Coordination:**
- Implement contracts/api-contract.ts exactly
- Never change contract without architect approval
- Notify Mobile Lead when endpoints ready
- Keep database schema synced to contracts/database-schema.prisma

---

### 4. Admin Dashboard Lead (React Expert)

**When to Use:**
- Building admin monitoring tools
- Creating scenario orchestrator features
- Analytics dashboards
- Database management tools

**Domain:**
```
/admin-dashboard/
├── Scenario Orchestrator (testing tool)
├── User management
├── Trade operation monitoring
├── Analytics & reporting
├── Database state viewer
└── Admin utilities
```

**Responsibilities:**
- Build admin tools using React + Vite
- Consume same backend APIs as mobile
- Create scenario testing interface
- Implement monitoring dashboards
- Follow same API contracts as mobile
- Update INTEGRATION_STATUS.json after each milestone

**Technical Standards:**
- React with TypeScript
- Same API client patterns as mobile
- Responsive design (admin on desktop)
- Real-time updates via WebSocket
- Test admin workflows

**Coordination:**
- Use contracts/api-contract.ts for API calls
- Share component patterns with mobile where applicable
- Never duplicate backend logic (use APIs)
- Coordinate with Scenario Test Lead for testing features

---

### 5. Integration Test Lead

**When to Use:**
- After all agents complete milestones
- Before marking sprint complete
- After contract changes
- Before production deployment

**Responsibilities:**
- Run cross-platform integration tests
- Validate API contract implementation
- Test mobile ↔ backend ↔ admin flows
- Validate database schema matches contract
- Check WebSocket event contracts
- Generate TEST_REPORT.json
- Gate sprint completion

**Test Suite:**
```
1. Contract Validation
   ├─ API contract: mobile calls match backend implementation
   ├─ Event contract: WebSocket events match schema
   └─ Database schema: Prisma matches contract

2. End-to-End Flows
   ├─ User registration → Login → Profile creation
   ├─ Seller creates listing → Buyer creates operation → Negotiation
   ├─ Inspector accepts job → Submits results
   └─ Transporter bids → Wins job → Completes delivery

3. Cross-Platform Tests
   ├─ Mobile API calls work
   ├─ Admin dashboard API calls work
   ├─ WebSocket events reach both platforms
   └─ Database constraints enforced

4. Performance
   ├─ API response time < 500ms
   ├─ Mobile app loads < 2s
   └─ No memory leaks

5. Data Integrity
   ├─ Trade operations calculate profit correctly
   ├─ Offer expiry works (48 hours)
   ├─ Status transitions valid
   └─ Foreign key constraints enforced
```

**Output:**
```json
{
  "timestamp": "2025-10-09T10:00:00Z",
  "overallStatus": "PASS | PARTIAL_PASS | FAIL",
  "testSuites": {
    "contractValidation": {"status": "PASS", "details": {}},
    "endToEndFlows": {"status": "PASS", "tests": {...}},
    "crossPlatform": {"status": "PASS"},
    "performance": {"status": "PASS"},
    "dataIntegrity": {"status": "FAIL", "failures": ["Offer expiry not working"]}
  },
  "blockers": [
    {
      "id": "TEST-FAIL-001",
      "priority": "P0",
      "test": "endToEndFlows.negotiation",
      "issue": "Counter-offer returns 500 error",
      "assignedTo": "backend-lead"
    }
  ],
  "canCompleteDay": false,
  "recommendations": ["Fix TEST-FAIL-001 before deployment"]
}
```

---

### 6. Scenario Test Lead

**When to Use:**
- Testing complex trade workflows
- Validating business logic
- Regression testing trade scenarios
- Creating reusable test scenarios

**Responsibilities:**
- Use admin dashboard scenario orchestrator
- Create test scenarios for common flows
- Validate business rules (commission, expiry, etc.)
- Test edge cases (expired offers, insufficient quantity, etc.)
- Build scenario library
- Generate scenario test reports

**Scenario Library:**
```
1. Simple Trade Flow
   ├─ 1 farmer, 1 buyer, 1 product
   ├─ Direct match, no counter-offers
   └─ Expected: Trade completes successfully

2. Negotiation Flow
   ├─ Buyer creates operation (needs 1000kg)
   ├─ 3 farmers with different prices
   ├─ Counter-offers back and forth
   └─ Expected: Optimal price negotiated

3. Expiry Test
   ├─ Send offers to seller
   ├─ Wait 48+ hours (fast-forward time)
   └─ Expected: Offers expire automatically

4. Multi-Seller Aggregation
   ├─ Buyer needs 5000kg
   ├─ 5 farmers with 1000kg each
   ├─ All accept offers
   └─ Expected: Operation reaches 100% quantity

5. Inspector Integration
   ├─ Trade requires inspection
   ├─ Inspector accepts, verifies quality
   └─ Expected: Trade proceeds after verification

6. Transporter Bidding
   ├─ Transport request created
   ├─ 3 transporters bid
   ├─ Lowest bid accepted
   └─ Expected: Transport job assigned correctly
```

---

## 📋 Coordination System

### INTEGRATION_STATUS.json (The Central Nervous System)

```json
{
  "lastUpdated": "2025-10-09T10:00:00Z",
  "currentSprint": "Sprint 5 - Week 2",
  "phase": "Trade Operation Management Hub",
  "branch": "004-trade-operation-management",

  "mobile": {
    "repository": "/Users/henry/agro-trade/front-end",
    "lead": "mobile-lead",
    "currentWork": "Active Operations Tab",
    "milestones": {
      "active_operations_tab": {
        "status": "COMPLETED",
        "priority": "P0",
        "description": "Centralized view of all trade operations with status",
        "startedDate": "2025-10-08T08:00:00Z",
        "completedDate": "2025-10-08T14:00:00Z",
        "details": {
          "filesModified": [
            "front-end/src/features/dashboard/screens/buyer/BuyerOperationsTab.tsx"
          ],
          "newComponents": ["OperationCard", "StatusBadge"],
          "tested": true,
          "platforms": ["iOS", "Android"]
        },
        "blockers": []
      },
      "negotiation_management": {
        "status": "IN_PROGRESS",
        "priority": "P0",
        "description": "Manage negotiations with counter-offer handling",
        "startedDate": "2025-10-08T14:30:00Z",
        "completedDate": null,
        "details": {
          "progress": "70% - Counter-offer UI complete, testing accept/reject"
        },
        "blockers": []
      },
      "potential_sellers_list": {
        "status": "PENDING",
        "priority": "P1",
        "description": "Show matching sellers with one-click offer sending",
        "startedDate": null,
        "completedDate": null,
        "blockers": [
          {
            "id": "BLOCK-MOBILE-001",
            "dependsOn": "backend.matching_sellers_endpoint"
          }
        ]
      },
      "offer_expiry_visual": {
        "status": "PENDING",
        "priority": "P1",
        "description": "48-hour countdown with visual indicators",
        "startedDate": null,
        "completedDate": null,
        "blockers": []
      }
    }
  },

  "backend": {
    "repository": "/Users/henry/agro-trade/backend",
    "lead": "backend-lead",
    "currentWork": "Negotiation APIs & Expiry Logic",
    "milestones": {
      "negotiation_endpoints": {
        "status": "COMPLETED",
        "priority": "P0",
        "description": "APIs for counter-offer, accept, reject",
        "startedDate": "2025-10-08T08:00:00Z",
        "completedDate": "2025-10-08T12:00:00Z",
        "details": {
          "endpoints": [
            "POST /api/negotiations/:id/counter",
            "POST /api/negotiations/:id/accept",
            "POST /api/negotiations/:id/reject"
          ],
          "tested": true,
          "documented": true
        },
        "blockers": []
      },
      "offer_expiry_logic": {
        "status": "COMPLETED",
        "priority": "P0",
        "description": "Auto-expire offers after 48 hours",
        "startedDate": "2025-10-08T12:00:00Z",
        "completedDate": "2025-10-08T16:00:00Z",
        "details": {
          "implementation": "Cron job checks every hour",
          "tested": true
        },
        "blockers": []
      },
      "matching_sellers_endpoint": {
        "status": "IN_PROGRESS",
        "priority": "P1",
        "description": "GET /api/trade-operations/:id/matching-sellers",
        "startedDate": "2025-10-08T16:00:00Z",
        "completedDate": null,
        "details": {
          "progress": "Algorithm complete, writing tests"
        },
        "blockers": []
      }
    }
  },

  "adminDashboard": {
    "repository": "/Users/henry/agro-trade/admin-dashboard",
    "lead": "admin-dashboard-lead",
    "currentWork": "Scenario Testing Enhancements (Phase 1)",
    "milestones": {
      "flow_diagram": {
        "status": "COMPLETED",
        "priority": "P0",
        "description": "Visual trade flow diagram using React Flow",
        "completedDate": "2025-10-08T23:00:00Z",
        "details": {
          "component": "TradeFlowDiagram.tsx",
          "features": ["Node graph", "Animated edges", "Color coding"]
        }
      },
      "database_state_panel": {
        "status": "COMPLETED",
        "priority": "P0",
        "description": "Browse and cleanup test data",
        "completedDate": "2025-10-08T23:00:00Z",
        "details": {
          "component": "DatabaseStatePanel.tsx",
          "features": ["Tabbed view", "Cleanup endpoint"]
        }
      },
      "scenario_builder": {
        "status": "COMPLETED",
        "priority": "P0",
        "description": "UI for creating custom scenarios",
        "completedDate": "2025-10-08T23:00:00Z"
      },
      "debug_controls": {
        "status": "COMPLETED",
        "priority": "P0",
        "description": "Breakpoints and speed control",
        "completedDate": "2025-10-08T23:00:00Z"
      }
    }
  },

  "coordination": {
    "blockers": [],
    "dependencies": [
      {
        "dependent": "mobile.potential_sellers_list",
        "dependsOn": "backend.matching_sellers_endpoint",
        "status": "WAITING"
      }
    ],
    "upcomingDecisions": [
      {
        "decision": "Add WebSocket for real-time offer updates?",
        "impact": "Both mobile and backend",
        "assignedTo": "product-architect",
        "deadline": "2025-10-10"
      }
    ]
  },

  "integration": {
    "lastTest": "2025-10-08T23:30:00Z",
    "status": "NOT_RUN",
    "testReport": null,
    "nextTest": "After backend.matching_sellers_endpoint completes"
  }
}
```

---

## 🔗 Contract System (THE LAW)

### contracts/api-contract.ts

```typescript
/**
 * API Contract - THE LAW
 *
 * Rules:
 * 1. Backend MUST implement every endpoint exactly as specified
 * 2. Mobile MUST call endpoints using exact paths and schemas
 * 3. Admin dashboard MUST use same endpoints
 * 4. Changes require Product Architect approval
 * 5. Integration tests validate compliance
 */

export const API_VERSION = 'v1';
export const BASE_URL = 'http://localhost:4000/api';

export const ENDPOINTS = {
  // ==================== AUTH ====================
  auth: {
    login: {
      method: 'POST',
      path: '/auth/login',
      request: {
        email: 'string',
        password: 'string',
      },
      response: {
        success: 'boolean',
        data: {
          user: 'User',
          accessToken: 'string',
          refreshToken: 'string',
        },
      },
      errors: [401, 400],
    },
    register: {
      method: 'POST',
      path: '/auth/register',
      request: {
        email: 'string',
        password: 'string',
        role: 'BUYER | SELLER | TRANSPORTER | INSPECTOR',
      },
      response: {
        success: 'boolean',
        data: { user: 'User' },
      },
    },
    // ... more auth endpoints
  },

  // ==================== TRADE OPERATIONS ====================
  tradeOperations: {
    create: {
      method: 'POST',
      path: '/trade-operations',
      auth: 'required',
      request: {
        productId: 'string',
        quantity: 'number',
        targetPrice: 'number',
        marginPercentage: 'number',
        deliveryLocation: 'string',
      },
      response: {
        success: 'boolean',
        data: { operation: 'TradeOperation' },
      },
    },
    getAll: {
      method: 'GET',
      path: '/trade-operations',
      auth: 'required',
      query: {
        status: 'PLANNING | ACTIVE | COMPLETED | CANCELLED (optional)',
        page: 'number (optional)',
        limit: 'number (optional)',
      },
      response: {
        success: 'boolean',
        data: {
          operations: 'TradeOperation[]',
          pagination: {
            total: 'number',
            page: 'number',
            limit: 'number',
          },
        },
      },
    },
    getMatchingSellers: {
      method: 'GET',
      path: '/trade-operations/:id/matching-sellers',
      auth: 'required',
      params: { id: 'string' },
      query: {
        maxPrice: 'number (optional)',
        minQuantity: 'number (optional)',
      },
      response: {
        success: 'boolean',
        data: {
          sellers: Array<{
            id: 'string',
            name: 'string',
            listing: {
              id: 'string',
              price: 'number',
              quantity: 'number',
              location: 'string',
            },
            matchScore: 'number (0-100)',
          }>,
        },
      },
    },
    // ... more trade operation endpoints
  },

  // ==================== NEGOTIATIONS ====================
  negotiations: {
    getByTradeOperation: {
      method: 'GET',
      path: '/negotiations/trade-operations/:tradeOperationId/negotiations',
      auth: 'required',
      params: { tradeOperationId: 'string' },
      response: {
        success: 'boolean',
        data: {
          negotiations: 'Negotiation[]',
        },
      },
    },
    sendOffer: {
      method: 'POST',
      path: '/negotiations/trade-operations/:tradeOperationId/offers',
      auth: 'required',
      params: { tradeOperationId: 'string' },
      request: {
        sellerId: 'string',
        offeredPrice: 'number',
        quantity: 'number',
      },
      response: {
        success: 'boolean',
        data: { negotiation: 'Negotiation' },
      },
    },
    counterOffer: {
      method: 'POST',
      path: '/negotiations/negotiations/:negotiationId/counter',
      auth: 'required',
      params: { negotiationId: 'string' },
      request: {
        counterPrice: 'number',
        quantity: 'number (optional)',
      },
      response: {
        success: 'boolean',
        data: { negotiation: 'Negotiation' },
      },
    },
    accept: {
      method: 'POST',
      path: '/negotiations/negotiations/:negotiationId/accept',
      auth: 'required',
      params: { negotiationId: 'string' },
      response: {
        success: 'boolean',
        data: { negotiation: 'Negotiation' },
      },
    },
    reject: {
      method: 'POST',
      path: '/negotiations/negotiations/:negotiationId/reject',
      auth: 'required',
      params: { negotiationId: 'string' },
      response: {
        success: 'boolean',
        data: { negotiation: 'Negotiation' },
      },
    },
  },

  // ==================== SELLER ====================
  seller: {
    createListing: {
      method: 'POST',
      path: '/seller/listings',
      auth: 'required',
      request: {
        productId: 'string',
        quantity: 'number',
        pricePerUnit: 'number',
        location: 'string',
        harvestDate: 'string (ISO date)',
      },
      response: {
        success: 'boolean',
        data: { listing: 'SaleListing' },
      },
    },
    getMyListings: {
      method: 'GET',
      path: '/seller/listings',
      auth: 'required',
      query: {
        status: 'ACTIVE | SOLD | CANCELLED (optional)',
      },
      response: {
        success: 'boolean',
        data: { listings: 'SaleListing[]' },
      },
    },
    // ... more seller endpoints
  },

  // ... more endpoint groups
};

// Type definitions
export interface User {
  id: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'TRANSPORTER' | 'INSPECTOR' | 'ADMIN';
  profile: {
    name: string;
    phone: string;
    // ...
  };
}

export interface TradeOperation {
  id: string;
  buyerId: string;
  productId: string;
  quantity: number;
  targetPrice: number;
  marginPercentage: number;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentProgress: {
    quantitySecured: number;
    percentageComplete: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Negotiation {
  id: string;
  tradeOperationId: string;
  sellerId: string;
  status: 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  currentOffer: {
    price: number;
    quantity: number;
    offeredBy: 'BUYER' | 'SELLER';
    offeredAt: string;
  };
  expiresAt: string; // 48 hours from last offer
  history: Array<{
    price: number;
    quantity: number;
    offeredBy: 'BUYER' | 'SELLER';
    offeredAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ... more type definitions
```

### contracts/event-contract.ts

```typescript
/**
 * WebSocket Event Contract - THE LAW
 *
 * Rules:
 * 1. Backend emits events exactly as specified
 * 2. Mobile/Admin listen for events using exact event names
 * 3. Event payloads must match schema
 * 4. Integration tests validate event flow
 */

export const EVENT_VERSION = 'v1';

export const EVENTS = {
  // ==================== NEGOTIATIONS ====================
  NEGOTIATION_UPDATED: {
    eventName: 'negotiation:updated',
    description: 'Fired when negotiation status changes',
    payload: {
      negotiationId: 'string',
      tradeOperationId: 'string',
      status: 'PENDING | COUNTERED | ACCEPTED | REJECTED | EXPIRED',
      currentOffer: {
        price: 'number',
        quantity: 'number',
        offeredBy: 'BUYER | SELLER',
      },
      updatedAt: 'string (ISO timestamp)',
    },
    listeners: ['mobile:buyer', 'mobile:seller', 'admin:dashboard'],
  },

  OFFER_EXPIRED: {
    eventName: 'offer:expired',
    description: 'Fired when offer expires (48 hours)',
    payload: {
      negotiationId: 'string',
      tradeOperationId: 'string',
      expiredAt: 'string (ISO timestamp)',
    },
    listeners: ['mobile:buyer', 'mobile:seller'],
  },

  // ==================== TRADE OPERATIONS ====================
  OPERATION_PROGRESS_UPDATED: {
    eventName: 'operation:progress',
    description: 'Fired when operation quantity secured changes',
    payload: {
      tradeOperationId: 'string',
      quantitySecured: 'number',
      percentageComplete: 'number',
      updatedAt: 'string',
    },
    listeners: ['mobile:buyer', 'admin:dashboard'],
  },

  // ==================== INSPECTOR ====================
  INSPECTOR_LOCATION_UPDATE: {
    eventName: 'inspector:location',
    description: 'Fired every 10s when inspector tracking active job',
    payload: {
      inspectorId: 'string',
      jobId: 'string',
      location: {
        latitude: 'number',
        longitude: 'number',
        accuracy: 'number',
        timestamp: 'string',
      },
    },
    listeners: ['admin:dashboard'],
  },

  INSPECTION_COMPLETED: {
    eventName: 'inspection:completed',
    description: 'Fired when inspector submits results',
    payload: {
      inspectionId: 'string',
      tradeOperationId: 'string',
      result: {
        quality: 'PASS | FAIL',
        notes: 'string',
        images: 'string[]',
      },
      completedAt: 'string',
    },
    listeners: ['mobile:buyer', 'mobile:seller', 'admin:dashboard'],
  },

  // ... more events
};
```

### contracts/database-schema.prisma

```prisma
// Database Schema - THE LAW
// Source of truth for data structure

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USER & AUTH ====================

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  role          Role

  // Profile
  firstName     String?
  lastName      String?
  phone         String?

  // Role-specific relations
  saleListings     SaleListing[]
  buyListings      BuyListing[]
  tradeOperations  TradeOperation[]
  negotiationsAsBuyer   Negotiation[] @relation("BuyerNegotiations")
  negotiationsAsSeller  Negotiation[] @relation("SellerNegotiations")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Role {
  BUYER
  SELLER
  TRANSPORTER
  INSPECTOR
  ADMIN
}

// ==================== TRADE OPERATIONS ====================

model TradeOperation {
  id                String             @id @default(uuid())
  buyerId           String
  buyer             User               @relation(fields: [buyerId], references: [id])

  productId         String
  product           Product            @relation(fields: [productId], references: [id])

  quantity          Float
  targetPrice       Float
  marginPercentage  Float
  deliveryLocation  String

  status            OperationStatus    @default(PLANNING)
  phase             OperationPhase     @default(MARGIN_SETTING)

  // Progress tracking
  quantitySecured   Float              @default(0)

  // Relations
  negotiations      Negotiation[]
  tradeSellers      TradeSeller[]

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

enum OperationStatus {
  PLANNING
  ACTIVE
  COMPLETED
  CANCELLED
}

enum OperationPhase {
  MARGIN_SETTING
  SOURCING
  TRANSPORT
  INSPECTION
  COMPLETED
}

// ==================== NEGOTIATIONS ====================

model Negotiation {
  id                 String            @id @default(uuid())

  tradeOperationId   String
  tradeOperation     TradeOperation    @relation(fields: [tradeOperationId], references: [id])

  sellerId           String
  seller             User              @relation("SellerNegotiations", fields: [sellerId], references: [id])

  buyerId            String
  buyer              User              @relation("BuyerNegotiations", fields: [buyerId], references: [id])

  status             NegotiationStatus @default(PENDING)

  // Current offer
  currentPrice       Float
  currentQuantity    Float
  lastOfferedBy      OfferSide
  lastOfferedAt      DateTime

  // Expiry (48 hours from last offer)
  expiresAt          DateTime

  // Offer history (JSON)
  offerHistory       Json              @default("[]")

  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
}

enum NegotiationStatus {
  PENDING
  COUNTERED
  ACCEPTED
  REJECTED
  EXPIRED
}

enum OfferSide {
  BUYER
  SELLER
}

// ==================== PRODUCTS ====================

model Product {
  id              String           @id @default(uuid())
  name            String
  category        String
  unit            String

  // Relations
  saleListings    SaleListing[]
  tradeOperations TradeOperation[]

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

// ==================== LISTINGS ====================

model SaleListing {
  id              String           @id @default(uuid())
  sellerId        String
  seller          User             @relation(fields: [sellerId], references: [id])

  productId       String
  product         Product          @relation(fields: [productId], references: [id])

  quantity        Float
  pricePerUnit    Float
  location        String
  harvestDate     DateTime?

  status          ListingStatus    @default(ACTIVE)

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

enum ListingStatus {
  ACTIVE
  SOLD
  CANCELLED
}

// ... more models (BuyListing, TradeSeller, TransportJob, InspectionRequest, etc.)
```

---

## 🔄 Development Workflows

### Daily Workflow: Feature Development

```
DAY START
─────────
User: "Let's work on Active Operations Tab"

1. Product Architect spawns
   ├─ Reads INTEGRATION_STATUS.json
   ├─ Checks yesterday's TEST_REPORT.json
   ├─ Plans today's milestones:
   │   ├─ Mobile: Active Operations UI
   │   ├─ Backend: GET /trade-operations with filters
   │   ├─ Admin: Monitor dashboard integration
   └─ Creates deployment plan

2. Architect deploys agents IN PARALLEL
   ├─ Mobile Lead: "Build Active Operations Tab"
   │   └─ Reads MOBILE_LEAD.md identity
   │   └─ Checks contracts/api-contract.ts
   │   └─ Starts coding
   │
   └─ Backend Lead: "Implement trade operations endpoint"
       └─ Reads BACKEND_LEAD.md identity
       └─ Implements contract endpoint
       └─ Writes tests

DURING WORK
───────────
Mobile Lead:
├─ Creates BuyerOperationsTab.tsx
├─ Uses mock data first
├─ Implements UI with NativeWind
├─ Updates INTEGRATION_STATUS.json:
│   {
│     "mobile": {
│       "milestones": {
│         "active_operations_tab": {
│           "status": "IN_PROGRESS",
│           "progress": "50% - UI complete, integrating API"
│         }
│       }
│     }
│   }
└─ Hits blocker: "Need pagination in endpoint"
    └─ Escalates blocker:
        {
          "coordination": {
            "blockers": [
              {
                "id": "BLOCK-001",
                "agent": "mobile-lead",
                "issue": "GET /trade-operations needs pagination",
                "priority": "P1",
                "suggestedFix": "Add page and limit query params",
                "assignedTo": "backend-lead"
              }
            ]
          }
        }

Backend Lead:
├─ Sees blocker in INTEGRATION_STATUS.json
├─ Adds pagination to endpoint
├─ Updates contract: contracts/api-contract.ts
├─ Notifies mobile:
│   {
│     "blockers": [
│       {
│         "id": "BLOCK-001",
│         "status": "RESOLVED",
│         "resolution": "Added pagination, see updated contract"
│       }
│     ]
│   }
└─ Marks milestone complete

Mobile Lead:
├─ Sees blocker resolved
├─ Integrates paginated API
├─ Tests on iOS + Android
├─ Updates INTEGRATION_STATUS.json:
│   {
│     "milestones": {
│       "active_operations_tab": {
│         "status": "COMPLETED",
│         "completedDate": "2025-10-09T14:00:00Z",
│         "tested": true
│       }
│     }
│   }

DAY END
───────
Product Architect:
├─ Reviews INTEGRATION_STATUS.json
├─ Sees all milestones COMPLETED
├─ Deploys Integration Test Lead
└─ Integration tests run:
    ├─ Contract validation: PASS
    ├─ E2E flow: PASS
    ├─ Mobile API calls: PASS
    └─ Performance: PASS

Integration Test Lead:
└─ Generates TEST_REPORT.json:
    {
      "overallStatus": "PASS",
      "canCompleteDay": true
    }

Architect:
└─ Marks day COMPLETE in INTEGRATION_STATUS.json
```

---

### Workflow: Cross-Platform Feature

**Example: Real-Time Offer Expiry Countdown**

```
PLANNING
────────
User: "Add 48-hour offer expiry with countdown"

Product Architect:
├─ Feature spans: Mobile, Backend, Contract
├─ Plan:
│   ├─ Backend: Cron job to expire offers
│   ├─ Backend: WebSocket event for expiry
│   ├─ Mobile: Countdown timer UI
│   └─ Contract: Define expiry event
└─ Deploy plan

STEP 1: Contract Definition
───────────────────────────
Architect updates contracts/event-contract.ts:
{
  OFFER_EXPIRING_SOON: {
    eventName: 'offer:expiring-soon',
    payload: {
      negotiationId: 'string',
      expiresAt: 'string',
      timeRemaining: 'number (hours)'
    }
  }
}

STEP 2: Backend Implementation
───────────────────────────────
Backend Lead:
├─ Implements cron job
├─ Emits WebSocket event
├─ Updates INTEGRATION_STATUS.json:
│   {
│     "backend": {
│       "milestones": {
│         "offer_expiry_cron": {
│           "status": "COMPLETED",
│           "details": {
│             "cronSchedule": "0 * * * * (every hour)",
│             "emitsEvent": "offer:expiring-soon"
│           }
│         }
│       }
│     }
│   }

STEP 3: Mobile Implementation
──────────────────────────────
Mobile Lead:
├─ Waits for backend.offer_expiry_cron COMPLETED
├─ Implements WebSocket listener
├─ Creates countdown timer component
├─ Tests:
│   ├─ Receive event
│   ├─ Display countdown
│   └─ Update when time changes
└─ Marks complete

STEP 4: Integration Testing
────────────────────────────
Integration Test Lead:
├─ Create test negotiation
├─ Set expiresAt to 1 hour from now
├─ Wait for WebSocket event
├─ Verify mobile receives event
├─ Verify countdown displays correctly
└─ Result: PASS
```

---

### Workflow: Handling Blockers

**Example: Database Migration Conflict**

```
BLOCKER OCCURS
──────────────
Backend Lead:
├─ Adding new column to Negotiation table
├─ Migration conflicts with deployed schema
└─ Escalates:
    {
      "coordination": {
        "blockers": [
          {
            "id": "BLOCK-DB-001",
            "priority": "P0",
            "agent": "backend-lead",
            "issue": "Migration conflicts with production schema",
            "impact": "Cannot deploy negotiation features",
            "details": {
              "migration": "20251009_add_offer_history.sql",
              "conflict": "Column 'offerHistory' already exists in prod"
            },
            "status": "ESCALATED",
            "assignedTo": "product-architect"
          }
        ]
      }
    }

ARCHITECT RESOLVES
──────────────────
Product Architect:
├─ Reviews blocker
├─ Decision: "Use Prisma introspect to sync"
├─ Instructs Backend Lead:
│   "Run: npx prisma db pull to update schema.prisma"
└─ Updates blocker:
    {
      "status": "RESOLVED",
      "resolution": "Synced schema with db pull",
      "resolvedAt": "2025-10-09T10:30:00Z"
    }

Backend Lead:
├─ Follows architect's instruction
├─ Schema now in sync
├─ Creates proper migration
└─ Continues work
```

---

## 🧪 Testing Strategy

### Level 1: Unit Tests (Each Agent)

**Mobile Lead:**
```typescript
// front-end/tests/components/OperationCard.test.tsx
describe('OperationCard', () => {
  it('displays operation details correctly', () => {
    const operation = mockTradeOperation();
    const { getByText } = render(<OperationCard operation={operation} />);
    expect(getByText(operation.productName)).toBeTruthy();
  });

  it('shows progress percentage', () => {
    const operation = mockTradeOperation({ quantitySecured: 500, quantity: 1000 });
    const { getByText } = render(<OperationCard operation={operation} />);
    expect(getByText('50%')).toBeTruthy();
  });
});
```

**Backend Lead:**
```typescript
// backend/tests/negotiations.test.ts
describe('NegotiationController', () => {
  it('should create negotiation with correct expiry', async () => {
    const response = await request(app)
      .post('/api/negotiations/trade-operations/123/offers')
      .send({ sellerId: '456', price: 50, quantity: 1000 });

    expect(response.status).toBe(201);
    expect(response.body.data.negotiation.expiresAt).toBeDefined();

    const expiryDate = new Date(response.body.data.negotiation.expiresAt);
    const now = new Date();
    const hoursDiff = (expiryDate - now) / (1000 * 60 * 60);
    expect(hoursDiff).toBeCloseTo(48, 0);
  });
});
```

### Level 2: Integration Tests (Integration Test Lead)

```typescript
// test-suite/integration/negotiation-flow.test.ts

describe('Negotiation Flow Integration', () => {
  let buyer, seller, tradeOperation;

  beforeAll(async () => {
    // Setup: Create test users and operation
    buyer = await createTestUser({ role: 'BUYER' });
    seller = await createTestUser({ role: 'SELLER' });
    tradeOperation = await createTestTradeOperation({ buyerId: buyer.id });
  });

  it('should handle complete negotiation flow', async () => {
    // Step 1: Buyer sends offer to seller
    const offer = await apiClient.post(
      `/negotiations/trade-operations/${tradeOperation.id}/offers`,
      { sellerId: seller.id, price: 50, quantity: 1000 },
      { auth: buyer.token }
    );
    expect(offer.data.negotiation.status).toBe('PENDING');
    expect(offer.data.negotiation.lastOfferedBy).toBe('BUYER');

    // Step 2: Seller counters
    const counter = await apiClient.post(
      `/negotiations/negotiations/${offer.data.negotiation.id}/counter`,
      { counterPrice: 55, quantity: 1000 },
      { auth: seller.token }
    );
    expect(counter.data.negotiation.status).toBe('COUNTERED');
    expect(counter.data.negotiation.currentPrice).toBe(55);
    expect(counter.data.negotiation.lastOfferedBy).toBe('SELLER');

    // Step 3: Buyer accepts
    const accept = await apiClient.post(
      `/negotiations/negotiations/${counter.data.negotiation.id}/accept`,
      {},
      { auth: buyer.token }
    );
    expect(accept.data.negotiation.status).toBe('ACCEPTED');

    // Step 4: Verify trade operation updated
    const operation = await apiClient.get(
      `/trade-operations/${tradeOperation.id}`,
      { auth: buyer.token }
    );
    expect(operation.data.operation.quantitySecured).toBe(1000);
  });

  it('should expire offers after 48 hours', async () => {
    const offer = await createTestOffer({ expiresAt: '2025-10-07T00:00:00Z' }); // Past date

    // Trigger expiry cron
    await runCronJob('offer-expiry');

    const negotiation = await apiClient.get(`/negotiations/negotiations/${offer.id}`);
    expect(negotiation.data.negotiation.status).toBe('EXPIRED');
  });
});
```

### Level 3: Scenario Tests (Scenario Test Lead)

```typescript
// test-suite/scenarios/multi-seller-aggregation.test.ts

describe('Scenario: Multi-Seller Aggregation', () => {
  it('should aggregate offers from 5 sellers to fulfill 5000kg order', async () => {
    // Setup
    const buyer = await scenarioHelper.createBuyer();
    const sellers = await scenarioHelper.createSellers(5); // 5 farmers
    const operation = await scenarioHelper.createOperation({
      buyer,
      quantity: 5000,
      targetPrice: 50,
    });

    // Each seller creates listing for 1000kg at varying prices
    const listings = await Promise.all(
      sellers.map((seller, i) =>
        scenarioHelper.createListing({
          seller,
          quantity: 1000,
          price: 48 + i, // 48, 49, 50, 51, 52
        })
      )
    );

    // Buyer sends offers to all sellers
    const offers = await scenarioHelper.sendOffers({
      operation,
      sellers,
      price: 50,
    });

    // All sellers accept
    const acceptances = await Promise.all(
      offers.map(offer => scenarioHelper.acceptOffer(offer))
    );

    // Verify operation complete
    const finalOperation = await scenarioHelper.getOperation(operation.id);
    expect(finalOperation.quantitySecured).toBe(5000);
    expect(finalOperation.status).toBe('COMPLETED');
    expect(finalOperation.currentProgress.percentageComplete).toBe(100);

    // Verify average price
    const avgPrice = acceptances.reduce((sum, a) => sum + a.price, 0) / 5;
    expect(avgPrice).toBeCloseTo(50, 1);
  });
});
```

### Level 4: Manual Testing (QA Checklist)

```markdown
# Manual Test Guide: Active Operations Tab

## Prerequisites
- [ ] Backend running on http://localhost:4000
- [ ] Mobile app running on Expo
- [ ] Test buyer account created
- [ ] Test seller accounts created (3+)
- [ ] Test listings created

## Test Case 1: View Active Operations
1. Login as buyer
2. Navigate to "Active Operations" tab
3. **Expected**: See list of operations with:
   - Product name
   - Quantity needed vs secured
   - Progress bar
   - Status badge
   - "View Details" button

## Test Case 2: Negotiation Management
1. Tap operation with status "Active"
2. See "Negotiations" section
3. **Expected**: See list of negotiations with:
   - Seller name
   - Current offer price
   - Status (Pending/Countered/Accepted)
   - Counter-offer button (if pending)
   - Accept/Reject buttons

## Test Case 3: Counter-Offer Flow
1. Tap "Counter" on pending negotiation
2. Enter new price
3. Tap "Send Counter"
4. **Expected**:
   - Loading state
   - Success message
   - Status updates to "Countered"
   - New price displayed

## Test Case 4: Offer Expiry Visual
1. View negotiation with < 6 hours remaining
2. **Expected**:
   - Orange countdown timer
   - "Expiring soon" badge
   - Updates every minute

## Test Case 5: Real-Time Updates
1. Open operation on mobile
2. On another device (seller), counter offer
3. **Expected**:
   - Buyer's screen updates automatically
   - No need to refresh
   - WebSocket event received

## Test Case 6: Error Handling
1. Turn off backend
2. Try to counter-offer
3. **Expected**:
   - Error message: "Unable to connect"
   - Retry button
   - No crash
```

---

## 📊 Metrics & Monitoring

### Track in INTEGRATION_STATUS.json

```json
{
  "metrics": {
    "currentSprint": {
      "name": "Sprint 5 - Week 2",
      "startDate": "2025-10-07",
      "endDate": "2025-10-13",

      "velocity": {
        "totalMilestones": 24,
        "completed": 18,
        "inProgress": 4,
        "pending": 2,
        "percentComplete": 75
      },

      "blockers": {
        "total": 8,
        "resolved": 6,
        "active": 2,
        "averageResolutionTime": "2.5 hours"
      },

      "integrationTests": {
        "totalRuns": 5,
        "passes": 4,
        "failures": 1,
        "passRate": "80%"
      },

      "agentPerformance": {
        "mobile": {
          "milestonesCompleted": 7,
          "averageTime": "3 hours/milestone",
          "blockers": 2
        },
        "backend": {
          "milestonesCompleted": 8,
          "averageTime": "2.5 hours/milestone",
          "blockers": 4
        },
        "admin": {
          "milestonesCompleted": 3,
          "averageTime": "4 hours/milestone",
          "blockers": 2
        }
      }
    },

    "trends": {
      "sprint4": { "velocity": 85, "passRate": "95%" },
      "sprint5": { "velocity": 75, "passRate": "80%" }
    }
  }
}
```

---

## ✅ Implementation Checklist

### Phase 1: Setup (1-2 hours)

- [ ] Create `.claude/` directory
- [ ] Write agent identity files:
  - [ ] ARCHITECT.md
  - [ ] MOBILE_LEAD.md
  - [ ] BACKEND_LEAD.md
  - [ ] ADMIN_DASHBOARD_LEAD.md
  - [ ] INTEGRATION_TEST_LEAD.md
  - [ ] SCENARIO_TEST_LEAD.md
- [ ] Create `coordination/` directory
- [ ] Initialize INTEGRATION_STATUS.json
- [ ] Initialize TEST_REPORT.json
- [ ] Initialize SPRINT_PLAN.json
- [ ] Update master CLAUDE.md with routing rules

### Phase 2: Contracts (2-3 hours)

- [ ] Create `contracts/` directory
- [ ] Write api-contract.ts:
  - [ ] Auth endpoints
  - [ ] Trade operation endpoints
  - [ ] Negotiation endpoints
  - [ ] Seller endpoints
  - [ ] Type definitions
- [ ] Write event-contract.ts:
  - [ ] Negotiation events
  - [ ] Operation events
  - [ ] Inspector events
- [ ] Copy database-schema.prisma to contracts/
- [ ] Create symlinks in front-end, backend, admin-dashboard

### Phase 3: First Sprint (1 week)

- [ ] Plan sprint milestones in SPRINT_PLAN.json
- [ ] Deploy Product Architect
- [ ] Architect deploys Mobile + Backend leads
- [ ] Agents update INTEGRATION_STATUS.json as they work
- [ ] Monitor for blockers daily
- [ ] Run integration tests at end of week
- [ ] Review TEST_REPORT.json
- [ ] Iterate on process

### Phase 4: Refinement (Ongoing)

- [ ] Update agent identities based on learnings
- [ ] Improve coordination protocols
- [ ] Expand integration test suite
- [ ] Build scenario library
- [ ] Document common patterns

---

## 🎓 Key Principles

### 1. Contracts Are Sacred
- Never diverge from contracts
- Sync changes across all repos
- Validate automatically in tests

### 2. Status Files > Chat
- INTEGRATION_STATUS.json is source of truth
- Update in real-time
- Machine-readable > human chat

### 3. Test Before Complete
- Unit tests per agent
- Integration tests before sprint complete
- Quality gates prevent broken deploys

### 4. Escalate Immediately
- Don't spin on blockers
- Surface to architect within 30 min
- Clear escalation path

### 5. Autonomous with Guardrails
- Agents work independently (fast)
- Must pass tests (safe)
- Architect monitors (oversight)

### 6. Documentation = Code
- Contracts are enforced
- Identity files define behavior
- Tests validate compliance

---

## 🚀 Usage Examples

### Starting a New Feature

```bash
User: "Let's add real-time price alerts for buyers"

# Product Architect deploys:
# 1. Plans feature across mobile/backend/contracts
# 2. Updates contracts/event-contract.ts (PRICE_ALERT event)
# 3. Deploys Mobile Lead: "Build price alert UI"
# 4. Deploys Backend Lead: "Implement price monitoring & alerts"
# 5. Monitors INTEGRATION_STATUS.json for completion
# 6. Runs integration tests
# 7. Marks feature complete
```

### Fixing a Bug

```bash
User: "Counter-offer returns 500 error"

# Product Architect:
# 1. Reads TEST_REPORT.json for context
# 2. Identifies: Backend issue
# 3. Deploys Backend Lead: "Fix counter-offer endpoint"
# 4. Backend Lead:
#    - Debugs issue
#    - Fixes bug
#    - Writes regression test
#    - Updates INTEGRATION_STATUS.json
# 5. Integration Test Lead:
#    - Re-runs affected tests
#    - Confirms fix
```

### Running Integration Tests

```bash
User: "Run full integration tests"

# Integration Test Lead spawns:
# 1. Contract validation
# 2. End-to-end flows
# 3. Cross-platform tests
# 4. Performance tests
# 5. Generates TEST_REPORT.json
# 6. Reports results to user
```

---

## 📖 Additional Resources

- [API Documentation](./docs/API_DOCUMENTATION.md) - Generated from contracts
- [Testing Guide](./docs/TESTING_GUIDE.md) - Comprehensive testing strategies
- [Development Workflow](./docs/DEVELOPMENT_WORKFLOW.md) - Detailed daily workflows
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues & solutions

---

**Last Updated**: 2025-10-09
**Version**: 1.0
**Maintained By**: Product Architect Agent
