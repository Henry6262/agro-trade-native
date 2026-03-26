# Edge Cases Roadmap & Priority Matrix

> **Generated:** 2026-03-26 | **Total Issues:** 30 (#6–#35) | **Edge Cases:** 23 (#13–#35)

---

## 1. Dependency Graph (All Roles)

This diagram shows how edge-case issues depend on each other. Work flows left-to-right.

```mermaid
flowchart LR
    subgraph SELLER["\U0001F33E Seller #13–#18"]
        S13["#13 Offline & Retry\n\U0001F534 P0"] --> S14["#14 Auth Errors\n\U0001F534 P0"]
        S14 --> S15["#15 Socket.io\n\U0001F7E1 P1"]
        S13 --> S16["#16 Listing Edge Cases\n\U0001F534 P0"]
        S16 --> S17["#17 Inspection Confirm\n\U0001F534 P0"]
        S15 --> S18["#18 Tests\n\U0001F7E2 P2"]
        S17 --> S18
    end

    subgraph TRANSPORTER["\U0001F69A Transporter #19–#24"]
        T19["#19 Offline & Retry\n\U0001F534 P0"] --> T20["#20 Auth Errors\n\U0001F534 P0"]
        T20 --> T21["#21 Socket.io\n\U0001F7E1 P1"]
        T19 --> T22["#22 Bid & Delivery\n\U0001F534 P0"]
        T22 --> T23["#23 GPS & Location\n\U0001F7E1 P1"]
        T21 --> T24["#24 Tests\n\U0001F7E2 P2"]
        T23 --> T24
    end

    subgraph BUYER["\U0001F6D2 Buyer #25–#29"]
        B25["#25 Offline & Retry\n\U0001F534 P0"] --> B26["#26 Auth Errors\n\U0001F534 P0"]
        B26 --> B27["#27 Socket.io\n\U0001F7E1 P1"]
        B25 --> B28["#28 Request & Order\n\U0001F534 P0"]
        B27 --> B29["#29 Tests\n\U0001F7E2 P2"]
        B28 --> B29
    end

    subgraph INSPECTOR["\U0001F50D Inspector #30–#35"]
        I30["#30 Offline & Retry\n\U0001F534 P0"] --> I31["#31 Auth Errors\n\U0001F534 P0"]
        I31 --> I32["#32 Socket.io\n\U0001F7E1 P1"]
        I30 --> I33["#33 Execution Edge\n\U0001F534 P0"]
        I33 --> I35["#35 GPS & Location\n\U0001F7E1 P1"]
        I32 --> I34["#34 Tests\n\U0001F7E2 P2"]
        I35 --> I34
    end

    S13 -.->|shared offline util| T19
    T19 -.->|shared offline util| B25
    B25 -.->|shared offline util| I30
    S14 -.->|shared auth| T20
    T20 -.->|shared auth| B26
    B26 -.->|shared auth| I31
```

---

## 2. Priority Matrix

```mermaid
quadrantChart
    title Edge Cases Priority vs Effort
    x-axis Low Effort --> High Effort
    y-axis Low Priority --> High Priority
    quadrant-1 Do First
    quadrant-2 Plan Carefully
    quadrant-3 Quick Wins
    quadrant-4 Defer
    #13 Seller Offline: [0.35, 0.92]
    #14 Seller Auth: [0.40, 0.90]
    #16 Seller Listings: [0.55, 0.88]
    #17 Seller Inspection: [0.50, 0.85]
    #25 Buyer Offline: [0.38, 0.91]
    #26 Buyer Auth: [0.42, 0.89]
    #28 Buyer Orders: [0.65, 0.87]
    #30 Inspector Offline: [0.40, 0.90]
    #31 Inspector Auth: [0.43, 0.88]
    #33 Inspector Exec: [0.70, 0.86]
    #19 Transport Offline: [0.37, 0.91]
    #20 Transport Auth: [0.41, 0.89]
    #22 Transport Bid: [0.60, 0.86]
    #15 Seller Socket: [0.30, 0.60]
    #21 Transport Socket: [0.32, 0.58]
    #27 Buyer Socket: [0.31, 0.59]
    #32 Inspector Socket: [0.33, 0.57]
    #23 Transport GPS: [0.55, 0.62]
    #35 Inspector GPS: [0.57, 0.60]
    #18 Seller Tests: [0.25, 0.30]
    #24 Transport Tests: [0.27, 0.28]
    #29 Buyer Tests: [0.26, 0.29]
    #34 Inspector Tests: [0.28, 0.27]
```

---

## 3. Execution Timeline (Gantt)

```mermaid
gantt
    title Edge Cases Implementation Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Phase 1 - P0 Critical
    #13 Seller Offline & Retry       :p0_s13, 2026-03-27, 3d
    #19 Transporter Offline & Retry   :p0_t19, 2026-03-27, 3d
    #25 Buyer Offline & Retry         :p0_b25, 2026-03-27, 3d
    #30 Inspector Offline & Retry     :p0_i30, 2026-03-27, 3d
    #14 Seller Auth Errors            :p0_s14, after p0_s13, 2d
    #20 Transporter Auth Errors       :p0_t20, after p0_t19, 2d
    #26 Buyer Auth Errors             :p0_b26, after p0_b25, 2d
    #31 Inspector Auth Errors         :p0_i31, after p0_i30, 2d
    #16 Seller Listing Edge Cases     :p0_s16, after p0_s14, 3d
    #22 Transporter Bid & Delivery    :p0_t22, after p0_t20, 3d
    #28 Buyer Request & Order         :p0_b28, after p0_b26, 3d
    #33 Inspector Execution Edge      :p0_i33, after p0_i31, 3d
    #17 Seller Inspection Confirm     :p0_s17, after p0_s16, 2d

    section Phase 2 - P1 Important
    #15 Seller Socket.io              :p1_s15, after p0_s17, 2d
    #21 Transporter Socket.io         :p1_t21, after p0_t22, 2d
    #27 Buyer Socket.io               :p1_b27, after p0_b28, 2d
    #32 Inspector Socket.io           :p1_i32, after p0_i33, 2d
    #23 Transporter GPS & Location    :p1_t23, after p0_t22, 3d
    #35 Inspector GPS & Location      :p1_i35, after p0_i33, 3d

    section Phase 3 - P2 Tests
    #18 Seller Tests                  :p2_s18, after p1_s15, 3d
    #24 Transporter Tests             :p2_t24, after p1_t23, 3d
    #29 Buyer Tests                   :p2_b29, after p1_b27, 3d
    #34 Inspector Tests               :p2_i34, after p1_i35, 3d
```

---

## 4. Issue Summary Table

| # | Role | Issue | Priority | Effort | Depends On | Risk |
|---|------|-------|----------|--------|------------|------|
| 13 | Seller | Offline & Retry Logic | \U0001F534 P0 | High | — | Lost data |
| 14 | Seller | Privy Auth Error Handling | \U0001F534 P0 | Medium | #13 | White screen |
| 15 | Seller | Real-time Socket.io | \U0001F7E1 P1 | Medium | #14 | Stale data |
| 16 | Seller | Listing & Offer Edge Cases | \U0001F534 P0 | High | #13 | Duplicate listings |
| 17 | Seller | Inspection Confirmation | \U0001F534 P0 | Medium | #16 | Missed inspections |
| 18 | Seller | Unit & UI Tests | \U0001F7E2 P2 | Medium | #15, #17 | Regressions |
| 19 | Transporter | Offline & Retry Logic | \U0001F534 P0 | High | — | Lost bids |
| 20 | Transporter | Auth & Backend Errors | \U0001F534 P0 | Medium | #19 | White screen |
| 21 | Transporter | Real-time Socket.io | \U0001F7E1 P1 | Medium | #20 | Missed jobs |
| 22 | Transporter | Bid & Delivery Edge Cases | \U0001F534 P0 | High | #19 | Duplicate bids |
| 23 | Transporter | GPS & Location | \U0001F7E1 P1 | Medium | #22 | Navigation failure |
| 24 | Transporter | Unit & UI Tests | \U0001F7E2 P2 | Medium | #21, #23 | Regressions |
| 25 | Buyer | Offline & Retry Logic | \U0001F534 P0 | High | — | Lost requests |
| 26 | Buyer | Privy Auth & Backend Errors | \U0001F534 P0 | Medium | #25 | White screen |
| 27 | Buyer | Real-time Socket.io | \U0001F7E1 P1 | Medium | #26 | Stale orders |
| 28 | Buyer | Request & Order Edge Cases | \U0001F534 P0 | High | #25 | Duplicate orders |
| 29 | Buyer | Unit & UI Tests | \U0001F7E2 P2 | Medium | #27, #28 | Regressions |
| 30 | Inspector | Offline & Retry Logic | \U0001F534 P0 | High | — | Lost inspections |
| 31 | Inspector | Auth & Backend Errors | \U0001F534 P0 | Medium | #30 | White screen |
| 32 | Inspector | Real-time Socket.io | \U0001F7E1 P1 | Medium | #31 | Missed assignments |
| 33 | Inspector | Execution Edge Cases | \U0001F534 P0 | High | #30 | Duplicate submissions |
| 34 | Inspector | Unit & UI Tests | \U0001F7E2 P2 | Medium | #32, #35 | Regressions |
| 35 | Inspector | GPS & Location | \U0001F7E1 P1 | Medium | #33 | Can't start inspection |

---

## 5. Execution Strategy

### Phase 1: P0 Critical (Week 1–2)
All offline/retry + auth + core edge cases across all 4 roles in parallel.
- **Shared work first:** Build reusable `useOfflineQueue` and `useAuthRetry` hooks
- **Then role-specific:** Each role implements its own offline + auth + business logic edge cases

### Phase 2: P1 Important (Week 2–3)
Socket.io notifications + GPS/location for Transporter and Inspector.
- **Shared work:** Verify `useSocket` hook works across all roles
- **Then role-specific:** Each role adds its own event listeners

### Phase 3: P2 Tests (Week 3–4)
Unit and UI tests for all roles, using the hardened code from Phase 1–2.
- Tests should cover all edge cases implemented in prior phases
- Target: 80% coverage on hooks and services

### Cross-Role Dependencies
- `useOfflineQueue` → shared by #13, #19, #25, #30
- `useAuthRetry` → shared by #14, #20, #26, #31
- `useSocket` → shared by #15, #21, #27, #32
- `useLocation` → shared by #23, #35

---

## 6. Color Legend

| Color | Priority | Action |
|-------|----------|--------|
| \U0001F534 Red | P0 — Critical | Do immediately, blocks MVP |
| \U0001F7E1 Yellow | P1 — Important | Schedule for Phase 2 |
| \U0001F7E2 Green | P2 — Nice to have | After hardening is done |
