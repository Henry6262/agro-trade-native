# StableHacks PPT Build Guide
**AgroTrade | Demo Day PowerPoint build guide**

This file is the practical build spec for your PowerPoint.

Use it to assemble the deck manually without drifting from the narrative we already cleaned up.

---

## Core Narrative

This is the message:

> AgroTrade is a compliance-aware, dual-chain stablecoin escrow platform for agricultural commodity trading, built around controlled settlement on Celo and Solana.

This is the order:

1. Big problem
2. Why current systems fail
3. What AgroTrade does
4. Why the architecture works
5. Why Solana matters
6. Why dual-chain matters
7. Why the compliance posture matters
8. Proof that this is built
9. Clean fund flow
10. Why now / why us
11. The ask

This is what not to claim:

- `production-ready`
- `fully compliant`
- `audited`
- `live institutional pilot`
- `bank-ready`

Use these instead:

- `working MVP`
- `implemented prototype`
- `tested escrow logic`
- `compliance-aware architecture`
- `controlled settlement`
- `audit-trail ready`

---

## Design System

### Background
- Deep dark background
- Recommended: `#0B0F1A` or `#0A0F14`

### Accent colors
- Primary green: `#00D1A0`
- Secondary blue: `#4DA3FF`
- Warning/orange only for pain/problem slides: `#FF8A3D`

### Fonts
- Title: Inter Bold / SF Pro Bold / Helvetica Bold
- Body: Inter Regular / SF Pro Regular

### Spacing rules
- One idea per slide
- No paragraphs
- Max 3 bullets on most slides
- Large whitespace
- Prefer diagrams over text

---

## Slide 1 — Hook

### Goal
Hit the room immediately with scale and broken infrastructure.

### On-slide text

**Title / main number**
`$3.4T`

**Subtitle**
`Agricultural trade still runs on trust, paper, and delayed settlement`

**Small footer line**
`This is the infrastructure problem we are fixing`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                       $3.4T                                  │
│                                                              │
│     Agricultural trade still runs on trust, paper,          │
│                 and delayed settlement                      │
│                                                              │
│                 This is the infrastructure                  │
│                    problem we are fixing                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Image / background
- Use a subtle darkened background image only if it does not hurt legibility
- Best options:
  - grain field texture
  - logistics/warehouse texture
  - abstract paper + wire transfer motif

### Notes
- The number must dominate the slide
- No icons needed if the layout already feels strong

---

## Slide 2 — The Problem

### Goal
Show exactly why the current system is broken.

### On-slide text

**Title**
`The System Is Broken`

**4 blocks**
- `Payment Delays`
  - `30–90 day settlement`
- `Compliance Darkness`
  - `No real-time visibility`
- `Fragmentation`
  - `Too many disconnected actors`
- `No Verifiable Workflow`
  - `Trust-based execution`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│ The System Is Broken                                         │
│                                                              │
│  ┌───────────────┐  ┌───────────────┐                        │
│  │ Payment       │  │ Compliance    │                        │
│  │ Delays        │  │ Darkness      │                        │
│  │ 30–90 day     │  │ No real-time  │                        │
│  │ settlement    │  │ visibility    │                        │
│  └───────────────┘  └───────────────┘                        │
│                                                              │
│  ┌───────────────┐  ┌───────────────┐                        │
│  │ Fragmentation │  │ No Verifiable │                        │
│  │ Too many      │  │ Workflow      │                        │
│  │ actors        │  │ Trust-based   │                        │
│  └───────────────┘  └───────────────┘                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Images / icons
- Simple icon per block only:
  - clock
  - shield with slash / visibility icon
  - broken chain / nodes
  - warning / checklist fail

### Notes
- Keep this clean and credible
- No long explanation text

---

## Slide 3 — Solution

### Goal
Make AgroTrade feel like the system replacing the chaos.

### On-slide text

**Title**
`AgroTrade`

**Subtitle**
`Mobile-first operations + controlled stablecoin settlement`

**Bullets**
- `End-to-end trade lifecycle`
- `Escrow-controlled release`
- `Multi-role coordination in one system`

**Role row**
`Farmer • Buyer • Transporter • Inspector • Admin`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│ AgroTrade                                                    │
│ Mobile-first operations + controlled stablecoin settlement   │
│                                                              │
│  • End-to-end trade lifecycle                               │
│  • Escrow-controlled release                                │
│  • Multi-role coordination in one system                    │
│                                                              │
│  Farmer • Buyer • Transporter • Inspector • Admin           │
│                                                              │
│                                     [ app screenshot ]      │
│                                     [ phone frame ]         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Images
- Use a real mobile app screenshot
- Best screens:
  - role selection
  - dashboard
  - trade lifecycle / escrow flow

### Notes
- This is your first “product is real” slide
- Use one clean screenshot, not a collage

---

## Slide 4 — Why Solana

### Goal
Explain Solana as a settlement design choice, not as hype.

### On-slide text

**Title**
`Why Solana`

**Bullets**
- `USDC-native settlement rail`
- `High throughput, low latency`
- `Account-based control for escrow flows`

**Bottom line**
`Built for institutional-grade settlement`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│ Why Solana                                                   │
│                                                              │
│  • USDC-native settlement rail                              │
│  • High throughput, low latency                             │
│  • Account-based control for escrow flows                   │
│                                                              │
│                    Buyer → Escrow → Seller                  │
│                   lock  → verify → release                  │
│                                                              │
│             Built for institutional-grade settlement        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Diagram
- Very simple left-to-right settlement path
- Do not overcomplicate with protocol internals

### Notes
- This slide should sound precise, not promotional

---

## Slide 5 — Why Dual-Chain

### Goal
Show dual-chain as an intentional product strategy.

### On-slide text

**Title**
`Why Dual-Chain`

**Left panel**
`Celo`
- `Mobile-first`
- `Low-cost access`
- `Emerging-market fit`

**Right panel**
`Solana`
- `USDC settlement rail`
- `Institutional throughput`
- `Controlled asset flows`

**Bottom line**
`Access + Settlement`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│ Why Dual-Chain                                               │
│                                                              │
│   ┌─────────────────┐      ┌─────────────────┐              │
│   │ Celo            │      │ Solana          │              │
│   │ Mobile-first    │      │ USDC settlement │              │
│   │ Low-cost access │      │ Throughput      │              │
│   │ Market fit      │      │ Control model   │              │
│   └─────────────────┘      └─────────────────┘              │
│                                                              │
│                    Access + Settlement                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Visual notes
- Two clean boxes
- Small connecting line underneath is enough

---

## Slide 6 — Architecture

### Goal
Show that the system is actually built and structured.

### On-slide text

**Title**
`System Architecture`

**Top**
`Mobile App` | `Admin Dashboard`

**Middle**
`Backend`
- `identity`
- `workflow`
- `notifications`
- `compliance records`

**Bottom**
`Blockchain Layer`
- `lock`
- `release`
- `refund`
- `dispute`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│ System Architecture                                          │
│                                                              │
│        [ Mobile App ]        [ Admin Dashboard ]             │
│                     ↓                 ↓                      │
│          ┌────────────────────────────────────┐              │
│          │ Backend                            │              │
│          │ identity · workflow · notifications│              │
│          │ compliance records                 │              │
│          └────────────────────────────────────┘              │
│                           ↓                                  │
│          ┌────────────────────────────────────┐              │
│          │ Blockchain Layer                   │              │
│          │ lock · release · refund · dispute  │              │
│          └────────────────────────────────────┘              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Notes
- Keep labels short
- This is one of the most important slides in the deck

---

## Slide 7 — Compliance Posture

### Goal
Show discipline without overclaiming regulation.

### On-slide text

**Title**
`Compliance-Aware by Design`

**Checklist**
- `Identity layer`
- `KYT-ready audit trail`
- `AML-aware operating model`
- `Travel Rule-ready records`

**Small footer**
`Not “fully compliant” — built to integrate with regulated partners`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│ Compliance-Aware by Design                                   │
│                                                              │
│   ✓ Identity layer                                           │
│   ✓ KYT-ready audit trail                                    │
│   ✓ AML-aware operating model                                │
│   ✓ Travel Rule-ready records                                │
│                                                              │
│   Not “fully compliant” — built to integrate with           │
│   regulated partners                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Notes
- Use green checkmarks
- Keep the last line smaller and subtle

---

## Slide 8 — Proof

### Goal
Prove this is built, not just described.

### On-slide text

**Title**
`Built, Not Just Designed`

**Metrics / proof blocks**
- `37 Foundry tests`
- `Anchor escrow program`
- `Mobile + backend flows implemented`
- `Admin operations layer built`
- `StableHacks Top 10 finalist`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│ Built, Not Just Designed                                     │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│   │ 37 Foundry   │  │ Anchor       │  │ Mobile +     │       │
│   │ tests        │  │ escrow prog. │  │ backend      │       │
│   └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐                         │
│   │ Admin layer  │  │ Top 10       │                         │
│   │ built        │  │ StableHacks  │                         │
│   └──────────────┘  └──────────────┘                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Notes
- Use cards or stat blocks
- Keep them visually balanced

---

## Slide 9 — Fund Flow

### Goal
Make the escrow logic easy to understand in seconds.

### On-slide text

**Title**
`Controlled Settlement Flow`

**Main flow**
`Buyer → Escrow → Trade Execution → Verification → Release to Seller`

**Small labels**
`lock → track → confirm → release`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│ Controlled Settlement Flow                                   │
│                                                              │
│  Buyer → Escrow → Trade Execution → Verification → Seller   │
│                                                              │
│   lock    track / deliver      confirm         release      │
│                                                              │
│  [optional icons under each step]                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Notes
- This is a critical judge slide
- Make arrows large and obvious

---

## Slide 10 — Why Now / Why Us

### Goal
Show timing + capability.

### On-slide text

**Title**
`Why Now / Why Us`

**Left column**
`Why Now`
- `Stablecoin rails are maturing`
- `Trade infrastructure is still broken`
- `Regulated workflows need better tooling`

**Right column**
`Why Us`
- `Full-stack system already built`
- `Deep focus on real workflows`
- `Not just DeFi — operational execution`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│ Why Now / Why Us                                             │
│                                                              │
│  Why Now                    Why Us                           │
│  • Stablecoin rails         • Full-stack system built        │
│    are maturing             • Real workflow focus            │
│  • Trade infra broken       • Operational execution          │
│  • Better tooling needed                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Slide 11 — The Ask

### Goal
Close clearly and confidently.

### On-slide text

**Title**
`What We Need`

**Bullets**
- `Pilot / design partners`
- `Audit-readiness feedback`
- `Ecosystem support and introductions`
- `Data / infrastructure collaboration`

**Closing line**
`We are replacing a system that already moves grain across the EU`

### Placement

```text
┌──────────────────────────────────────────────────────────────┐
│ What We Need                                                 │
│                                                              │
│  • Pilot / design partners                                  │
│  • Audit-readiness feedback                                 │
│  • Ecosystem support and introductions                      │
│  • Data / infrastructure collaboration                      │
│                                                              │
│      We are replacing a system that already moves           │
│                   grain across the EU                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Notes
- This should sound strong, not needy
- If you use partner logos, keep them small and tasteful

---

## Image Checklist

Use these image types:

1. **Slide 1**
- grain / warehouse / logistics texture

2. **Slide 3**
- real mobile app screenshot

3. **Slide 6**
- no photo needed, diagram only

4. **Slide 8**
- no photo needed, proof cards only

5. **Slide 9**
- no photo needed, arrows + icons only

6. **Optional final slide**
- subtle EU corridor map if it helps the ask

Do not use:
- cheesy crypto visuals
- cartoon chains
- random drone hero images as the main story
- crowded dashboards with unreadable UI

---

## Build Priorities

If you have limited time, do these first:

1. Slide 1
2. Slide 3
3. Slide 6
4. Slide 9
5. Slide 11

Those five slides carry the story.

---

## Final Slide Check

Before you finish, every slide should pass this test:

> Can someone understand the point in 3 seconds?

If not:
- remove text
- enlarge hierarchy
- simplify layout
- replace bullets with a diagram

---

## Related Files

- `docs/STABLEHACKS_SUBMISSION.md`
- `docs/PRESENTATION_ZURICH_DEMO_DAY_2026.md`
- `docs/stablehacks-demo-day/SPEAKER_CHEAT_SHEET.md`
- `docs/stablehacks-demo-day/SOFTSTACK_MEETING_BRIEF.md`

Use those for narrative consistency.
