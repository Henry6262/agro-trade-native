# AgroTrade — App-Wide 3D Visual System

**Date:** 2026-06-17
**Scope:** Cinematic 3D moments across the entire mobile app. Dark agricultural aesthetic. Same pipeline as Trench Royale (Three.js + meshopt GLBs) via expo-gl + @react-three/fiber for React Native.

---

## Vision

AgroTrade should feel like a game you live in, not a finance app you tolerate. Every key moment — opening the Invest tab, completing an investment, claiming a harvest payout — is punctuated by a cinematic 3D animation. Users feel like they own real things: real farms, real drones, real harvests.

The reference is the Trench Royale landing page hero: full 3D scene, animated characters, dark cinematic atmosphere. We apply that same energy to agriculture.

---

## Tech Stack

| Layer | Library | Notes |
|-------|---------|-------|
| WebGL context | `expo-gl` | Native OpenGL ES bridge |
| 3D renderer | `@react-three/fiber` (React Native build) | Same API as Trench Royale web |
| Asset loading | `expo-asset` + `expo-file-system` | GLBs bundled in `front-end/assets/3d/` |
| Model loader | `three/examples/jsm/loaders/GLTFLoader` | Via expo-three |
| Animation | `three` AnimationMixer | GLB-embedded animations |
| 2D overlay | React Native Reanimated | UI layered over the GL canvas |
| Compression | meshopt (pre-compressed GLBs) | Target: ≤500KB per asset |

**Asset pipeline rule:** All GLBs are pre-compressed with meshopt before dropping into `assets/3d/`. Raw files go in `assets/3d/raw/` (gitignored). Compressed production files go in `assets/3d/`. Target: ≤500KB each. Same rule as Trench Royale.

---

## Asset Registry

Every asset listed here is a required deliverable. Henry generates via Meshy AI. Drop compressed GLB into `front-end/assets/3d/agro/`.

| File | Description | Animations needed | Target size |
|------|-------------|-------------------|-------------|
| `drone.glb` | Modern agricultural drone, dark carbon + green accent | `hover` (idle float), `fly` (forward motion), `land` | ≤400KB |
| `plantation-field.glb` | Bird's-eye low-poly plantation — rows of avocado trees, red volcanic soil, misty hills | None (static scene) | ≤500KB |
| `truck.glb` | Modern agricultural truck, side profile, dark green | `drive` (wheel spin + body bob) | ≤400KB |
| `avocado-tree.glb` | Single avocado tree, 3/4 view, fruit-heavy | `sway` (gentle wind loop), `grow` (sapling → full tree, 2s) | ≤200KB |
| `coffee-branch.glb` | Coffee branch with red cherries | `sway` | ≤150KB |
| `cocoa-pod.glb` | Cocoa pod on branch | `sway` | ≤150KB |
| `olive-branch.glb` | Olive branch with fruit | `sway` | ≤150KB |
| `coins.glb` | Stack of cUSD coins (golden, teal logo) | `rain` (coins fall + scatter), `orbit` (coins circle a point) | ≤100KB |
| `harvest-drop.glb` | Avocados falling from branch | `fall` (loop, 1.5s) | ≤100KB |

---

## 3D Moments — Full Map

### 1. Invest Tab Entry — Plantation Hero Scene

**Trigger:** User taps the Invest tab for the first time per session.

**What happens:**
- Full-width GL canvas renders below the pill toggle (Discover | My Farms)
- Scene: `plantation-field.glb` as ground + environment
- `drone.glb` enters from the right edge, plays `fly` animation, slows to `hover` above the field center
- Camera: fixed bird's-eye angle, slight parallax with device tilt (gyroscope)
- Dark vignette + mist particle system over the field
- After 3s: scene smoothly fades to reveal the map underneath (opacity tween)
- Scene stays loaded in memory; re-tapping tab skips the intro, goes straight to map

**Canvas placement:** Absolute positioned, full width, 320px tall, behind the tab pill controls.

**Performance:** Lazy loaded. Tab renders with a static gradient fallback until GL context is ready. Target: GL context up in <1.5s on mid-range device.

---

### 2. Round Detail Bottom Sheet — Crop Asset Header

**Trigger:** User taps a map pin, bottom sheet slides up.

**What happens:**
- Instead of a flat farm photo, the header area (180px tall) renders a small GL canvas
- Scene: the appropriate crop GLB (`avocado-tree.glb`, `coffee-branch.glb`, etc.) centered, slow `sway` animation
- Dark background with subtle ambient green light
- Feels like a product showcase — this is what you're buying into

**Fallback:** Static crop image if GL context fails or device is low-end.

---

### 3. Investment Success — The Planting Moment

**Trigger:** User taps "Confirm Investment" and the API call returns success.

**What happens:**
- Modal overlay (full screen, dark semi-transparent background)
- GL canvas fills 60% of screen height
- Scene: barren red soil, then `avocado-tree.glb` plays `grow` animation (sapling → full tree, 2s)
- `coins.glb` plays `orbit` animation around the tree for 1s
- `coins.glb` then plays `rain` for 0.5s (coins scatter outward), then fade
- Text below: "You own X shares · Avocado Grove Kenya" appears with Reanimated fade-in (200ms delay)
- Haptic: `Haptics.notificationAsync(NotificationFeedbackType.Success)`
- After 3.5s total: auto-dismisses, user lands on My Farms

**This is the money moment.** The planting animation is the core emotional hook — the user literally watches their investment take root.

---

### 4. Harvest Payout Claim — The Harvest Moment

**Trigger:** User taps "Claim" on a DISTRIBUTING farm card.

**What happens:**
- Same full-screen modal overlay
- GL canvas: `harvest-drop.glb` plays `fall` animation — avocados raining down from above
- After 1s: cUSD amount appears large in the center: "$183 cUSD" with a counter animation from $0
- `coins.glb` plays `orbit` around the number
- Text below: "Paid to your wallet" with green checkmark
- Haptic: heavy impact then success
- After 3s: dismisses to My Farms, card shows "Claimed" badge

---

### 5. My Farms — Crop Icon (Per Card)

**Trigger:** My Farms view renders.

**What happens:**
- Each farm position card has a 60×60px GL canvas in the top-right corner
- Renders the matching crop GLB at low fidelity (simple lighting, no shadows)
- Plays `sway` animation on a loop (very subtle, ~5° rotation oscillation)
- This replaces the emoji — the 3D asset IS the crop identity

**Performance:** All card assets share one WebGL context (instanced renders). Max 5 simultaneous contexts to avoid GPU cap.

---

### 6. Main Dashboard — Truck Scene

**Trigger:** User opens the app (any role), main dashboard loads.

**What happens:**
- Dashboard header area has a 200px tall GL canvas strip
- `truck.glb` drives left-to-right across the strip, plays `drive` animation, exits right edge
- Loops every 12s
- Dark landscape background (low-poly hills, stylized)
- Feels like: AgroTrade moves goods. This is a logistics + investment platform.

**Roles:** All roles see this (seller, buyer, transporter, inspector). It's a brand moment, not role-specific.

---

### 7. Tab Bar — Invest Tab Icon Pulse

**Trigger:** User taps the Invest tab.

**What happens:**
- The Invest tab icon (`Sprout`) scales up (1.0 → 1.3 → 1.0, 300ms spring)
- A brief particle burst emits from the icon (4–6 green dots scatter outward, fade in 200ms)
- Implemented in Reanimated + React Native Canvas (no GL needed for this)

---

### 8. Onboarding — Drone Flyover

**Trigger:** First time user opens the Invest tab (one-time experience).

**What happens:**
- Before the plantation hero scene, a drone-eye-view sequence plays:
  - `drone.glb` descends from above toward `plantation-field.glb`
  - Camera follows from just behind the drone
  - Text overlays fade in sequentially:
    - "Pick a farm." (1s)
    - "Buy a share." (2s)
    - "Earn when it harvests." (3s)
  - "Browse Farms" button fades in at 3.5s
- One-time only. Stored in AsyncStorage: `'invest-onboarding-seen': true`

---

## Performance Budget

| Constraint | Limit |
|------------|-------|
| Max simultaneous WebGL contexts | 5 |
| Max GLB size (hero scenes) | 500KB |
| Max GLB size (card icons) | 200KB |
| Target GL context init time | <1.5s |
| Target animation frame rate | 60fps on iPhone 12+, 30fps on mid-range Android |
| Total 3D asset bundle size | <4MB |

**Low-end device fallback:** Detect via `Platform.OS` + `PixelRatio`. If PixelRatio < 2 or Android API < 28: skip GL canvas entirely, show static crop images + Lottie 2D animations as fallback.

---

## File Structure

```
front-end/
└── assets/
    └── 3d/
        └── agro/
            ├── drone.glb
            ├── plantation-field.glb
            ├── truck.glb
            ├── avocado-tree.glb
            ├── coffee-branch.glb
            ├── cocoa-pod.glb
            ├── olive-branch.glb
            ├── coins.glb
            └── harvest-drop.glb

front-end/src/
└── features/
    └── invest/
        ├── components/
        │   ├── three/
        │   │   ├── PlantationHeroScene.tsx   ← Invest tab drone + field
        │   │   ├── CropShowcaseScene.tsx     ← Bottom sheet crop asset
        │   │   ├── PlantingSuccessScene.tsx  ← Invest success moment
        │   │   ├── HarvestScene.tsx          ← Payout claim moment
        │   │   ├── CropCardIcon.tsx          ← My Farms card icon (60px)
        │   │   └── SceneCanvas.tsx           ← Shared GL canvas wrapper
        │   └── ui/
        │       └── ... (existing UI components)
        └── hooks/
            └── useAgroScene.ts              ← Shared scene lifecycle + asset loading
```

---

## Implementation Notes

**SceneCanvas.tsx** — shared wrapper that:
- Creates and manages the `expo-gl` GLView
- Tracks context count globally (enforces the ≤5 limit)
- Accepts `sceneFn: (gl: WebGLRenderingContext) => SceneControls` prop
- Exposes `play(animationName)`, `pause()`, `dispose()` via ref
- Handles app backgrounding (pauses render loop when app is not active)

**useAgroScene.ts** — hook that:
- Preloads required GLBs for the current screen using `expo-asset`
- Returns `{ ready, error }` — scenes only mount when `ready = true`
- Caches loaded geometries in module scope (singleton) so re-navigating doesn't reload

**Asset loading strategy:**
1. Drone + plantation-field: preload when Invest tab first mounts (background)
2. Crop GLBs: lazy-load on demand when a specific round is viewed
3. Coins + harvest-drop: preload when portfolio has any ACTIVE or DISTRIBUTING rounds

---

## Lighting & Aesthetic

All scenes follow a consistent look:

- **Sky:** dark (#0C1F0A to #000000 gradient)
- **Key light:** warm amber/gold directional (like golden hour)
- **Fill light:** cool teal-green (#00C896 at 20% intensity)
- **Fog:** `THREE.FogExp2(0x000000, 0.02)` — depth and atmosphere
- **No shadows** on card icons (performance). Soft shadows on hero scenes only.
- **Post-processing:** bloom on emissive materials (coins glow, drone lights glow)

This matches the existing app color palette (`GRADIENT.background`, `COLORS.accentGreen`, `COLORS.accentGold`) and the Trench Royale aesthetic.

---

## Out of Scope (this spec)

- AR mode (point phone at real field)
- 3D on the landing page (separate spec)
- Custom shader effects (keep to Three.js built-ins)
- Physics simulation
- User-generated 3D content
