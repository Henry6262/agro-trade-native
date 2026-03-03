# AgroTrade — Bold Fintech Glassmorphism Redesign
**Date:** 2026-03-02
**Status:** Approved — In Execution

---

## Vision
Every screen floats on a persistent deep-green gradient. Cards, inputs, nav bars — everything is frosted glass. Numbers count up. Interactions spring. The app feels like a premium trading terminal built for agriculture.

---

## Foundation

### Background
Full-screen persistent gradient on every screen:
```
#052e16 → #14532d → #166534  (vertical, top → bottom)
```

### Glass Tiers
| Token | Fill | Border | Use |
|---|---|---|---|
| `glass-subtle` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.08)` | Panels, wrappers |
| `glass-medium` | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.15)` | Cards, inputs |
| `glass-strong` | `rgba(255,255,255,0.18)` | `rgba(255,255,255,0.22)` | Modals, drawers |

All: `blur=20`, `borderRadius=16`, drop shadow `rgba(0,0,0,0.25)`.

### Colour Tokens
- Text primary: `#FFFFFF`
- Text secondary: `rgba(255,255,255,0.65)`
- Text muted: `rgba(255,255,255,0.35)`
- Accent green: `#4ADE80` (positive, active, success)
- Accent gold: `#FCD34D` (prices, values, matched)
- Danger: `#F87171`
- Active glow: `#4ADE80` with shadowRadius 12

### Typography
- Headings: `#FFFFFF`, `font-bold`
- Body: `rgba(255,255,255,0.65)`
- Prices/numbers: monospace, `#FCD34D`
- Labels: `rgba(255,255,255,0.35)`, uppercase, `tracking-widest`

### Animation Rules
1. Card entrance: `translateY 24→0` + `opacity 0→1`, stagger 60ms, spring damping 18
2. Button press: `scale 1→0.95` spring + haptic impact
3. Numbers: AnimatedCounter count-up from 0 on mount
4. Tab switch: spring `{ damping: 18, stiffness: 200 }`

---

## Component Library (`src/design-system/`)

| Component | Description |
|---|---|
| `GradientBackground` | Full-screen gradient wrapper, singleton |
| `GlassCard` | Core glass surface, variants: subtle/medium/strong |
| `GlassButton` | primary (green gradient) / secondary (glass) / ghost |
| `GlassInput` | Frosted text input |
| `GlassBadge` | Status chip — success/warning/danger/info/muted |
| `AnimatedCounter` | Count-up number animation |
| `StatCard` | Metric + label + trend on glass |
| `GlassHeader` | Top nav bar with blur |
| `GlassBottomNav` | Frosted bottom tab bar with green glow on active |

---

## Screen Application

### Auth
- **WelcomeScreen**: gradient bg, AGRO TRADE wordmark, subtitle, 2 glass buttons
- **LoginScreen / RegisterScreen**: gradient bg, glass card form

### Onboarding
- **RoleSelectionScreen**: gradient bg, staggered glass role cards, spring select animation
- **Onboarding flows**: gradient bg, glass step cards, glass progress indicator

### Dashboard Shell
- **DashboardMainScreen**: gradient bg via GradientBackground, GlassHeader
- **BottomNavigation**: BlurView frosted bar, green glow on active tab
- **DashboardWrapper**: gradient bg, glass sidebar (tablet), glass header

### Content Screens
All screens: gradient background + GlassCard containers throughout
- CommandCenterScreen, AgentNetworkScreen, IntelligenceScreen, OperationsScreen
- Seller/Buyer/Transporter/Inspector dashboards and tabs
- All modals and drawers: glass-strong tier

---

## Packages
- `expo-linear-gradient` — gradient backgrounds and button fills
- `expo-blur` — real BlurView for bottom nav and modals
- `expo-haptics` — button press feedback
- `react-native-reanimated` — all animations
