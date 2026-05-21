# AgroTrade Mobile Brand Guidelines

> Official color palette, typography, and motion standards for the AgroTrade React Native app.
> Last updated: 2026-05-19

---

## Color Palette

### Primary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `COLORS.accentGreen` | `#4ADE80` | Primary CTAs, success states, active indicators, brand highlights |
| `COLORS.accentGold` | `#FCD34D` | Revenue/earnings stats, premium badges, warning states |

### Functional Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `COLORS.success` | `#4ADE80` | Completed deliveries, verified badges, positive trends |
| `COLORS.danger` | `#F87171` | Errors, rejected offers, expired items, alerts |
| `COLORS.warning` | `#FCD34D` | Pending states, in-progress items, medium-priority alerts |
| `COLORS.info` | `#60A5FA` | Available jobs, in-transit status, neutral highlights |

### Text Colors
| Token | Value | Usage |
|-------|-------|-------|
| `COLORS.textPrimary` | `#FFFFFF` | Headlines, card titles, primary labels |
| `COLORS.textSecondary` | `rgba(255,255,255,0.65)` | Body text, descriptions, secondary info |
| `COLORS.textMuted` | `rgba(255,255,255,0.35)` | Timestamps, metadata, placeholders, disabled text |

### Background
| Token | Value | Usage |
|-------|-------|-------|
| App Background | `#0a0a0f` | All screen backgrounds |
| `GLASS.subtle.fill` | `rgba(255,255,255,0.08)` | Inactive cards, secondary surfaces |
| `GLASS.medium.fill` | `rgba(255,255,255,0.14)` | Primary cards, active list items |
| `GLASS.strong.fill` | `rgba(255,255,255,0.22)` | Modals, emphasis cards, hero elements |

### Rules
- **Never introduce new hex colors** outside this palette.
- **Never hardcode colors** — always import from `design-system/tokens.ts`.
- Opacity variations of brand colors should be derived from the base tokens (e.g., `rgba(74,222,128,0.15)` for green at 15% opacity).
- White opacity scales (`rgba(255,255,255,0.x)`) are allowed for text hierarchy and glass effects.

---

## Typography

| Role | Size | Weight | Color | Transform |
|------|------|--------|-------|-----------|
| Screen Header | 22px | 800 | textPrimary | none |
| Card Title | 15px | 700 | textPrimary | none |
| Section Label | 13px | 700 | textSecondary | UPPERCASE, letter-spacing 0.8 |
| Body Text | 13–14px | 400–600 | textSecondary | none |
| Metadata | 11–12px | 400–600 | textMuted | none |
| Stat Value | 18–22px | 800 | accentGreen / accentGold | none |
| Button Label | 14–16px | 700 | textPrimary | none |

---

## Glassmorphism System

All cards use the `GlassCard` component with these tiers:
- **subtle** — secondary list items, inactive tabs, background layers
- **medium** — primary cards, active list items, form containers
- **strong** — modals, hero elements, emphasis callouts

Never use solid opaque backgrounds (e.g., `#1F2937`, `#fff`) for cards. The app's identity is dark glass.

---

## Motion Principles

### Philosophy
Motion should be **functional, not decorative**. Every animation guides the user or provides feedback.

### Standard Durations
| Context | Duration | Easing |
|---------|----------|--------|
| Card entrance | 300–400ms | Spring (damping 18, stiffness 200) |
| Tab switch | 200ms | Ease-out |
| Button press | 100ms | Ease-in-out |
| Pull-to-refresh | 600ms | Spring |
| Page transition | 300ms | Ease-out |

### Tools
- **Moti** — declarative entrance/exit animations (`from` / `animate` props)
- **Reanimated 4** — gesture-driven interactions, scroll-linked effects
- **Lottie** — complex illustrations (onboarding, empty states)

### Rules
- Animate `opacity` and `transform` only — never animate layout properties (width, height, margin).
- Stagger list items by 40–60ms for a cascading entrance effect.
- Use `delay` on cards to create visual rhythm (e.g., stat cards stagger 0ms, 50ms, 100ms, 150ms).
- Avoid animations longer than 500ms — users perceive them as slow.

---

## Component Patterns

### Stats Row
- Always 4 stat cards in a 2×2 grid on mobile.
- Use `accentGold` for money/revenue metrics.
- Use `accentGreen` for completion/active metrics.
- Use `info` blue for available/neutral metrics.
- Use `warning` gold for pending metrics.

### Status Badges
| Status | Badge Variant | Color |
|--------|--------------|-------|
| Completed / Delivered | success | accentGreen |
| Pending / Assigned | warning | accentGold |
| In Transit / In Progress | info | info blue |
| Rejected / Cancelled / Expired | danger | danger red |
| Available | success | accentGreen |

### Empty States
- Icon at 32px, `rgba(255,255,255,0.3)` color.
- Title: 16px, textPrimary, centered.
- Subtitle: 13px, textSecondary, centered, max-width 280px.
- Never show raw error messages to users — wrap in friendly copy.

---

## Do Not
- ❌ Use white backgrounds (`#fff`, `#f9fafb`) — the app is dark-only.
- ❌ Use Material Design colors (purple, teal, pink).
- ❌ Animate width, height, or margin — use transform + opacity only.
- ❌ Hardcode hex colors — always use `COLORS` from `design-system`.
- ❌ Use more than 2 accent colors on a single card.
- ❌ Show "Coming Soon" or "TODO" text — build a real empty state instead.
