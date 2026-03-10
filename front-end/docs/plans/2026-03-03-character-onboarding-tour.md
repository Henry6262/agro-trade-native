# Character Onboarding Tour Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace generic lucide icons on role cards with character PNG images, then deliver a post-onboarding overlay tour where the character guides the user through the real dashboard UI with a spotlight + speech bubble system.

**Architecture:** The character PNG images already exist in `assets/UserTypes/`. The role cards get the images inline (replacing the lucide icon box). After onboarding completes, a `CharacterTourOverlay` renders as an absolute-position View above the entire NavigationContainer — it reads `useTourStore` to know which step to show, dims the screen with a 4-strip spotlight hole, and shows the character image + speech bubble. Tour is triggered from `OnboardingCompleteScreen` before navigating to Main.

**Tech Stack:** React Native (Image, View, Pressable), react-native-reanimated (entry fade-in for overlay), Zustand + AsyncStorage (tour seen/step state), no new dependencies required.

---

## Assets Reference

```
assets/UserTypes/Buyer.png        → buyer character
assets/UserTypes/Seller.png       → seller character
assets/UserTypes/transporter.png  → transporter character
```

---

## Task 1: Add character images to RoleSelection cards

Replace the lucide icon box in `AnimatedRoleCard` with the character PNG. Keep all existing animations — just wrap the Image with the same `iconAnimatedStyle` that currently wraps the icon.

**Files:**
- Modify: `src/features/onboarding/components/AnimatedRoleCard.tsx`
- Modify: `src/features/onboarding/screens/RoleSelectionScreen.tsx`

**Step 1: Update AnimatedRoleCard interface and remove icon logic**

In `AnimatedRoleCard.tsx`, make these changes:

```tsx
// ADD to imports (top of file, after React import):
import { Image, ImageSourcePropType } from 'react-native';

// REPLACE the interface:
interface AnimatedRoleCardProps {
  id: 'buyer' | 'seller' | 'transport';
  title: string;
  color: string;
  gradient: string[];
  imageSource: ImageSourcePropType; // NEW - character PNG
  isSelected?: boolean;
  onPress: () => void;
  delay?: number;
}

// ADD imageSource to the destructured props:
export const AnimatedRoleCard: React.FC<AnimatedRoleCardProps> = ({
  id,
  title,
  color,
  imageSource,  // ADD THIS
  isSelected = false,
  onPress,
  delay = 0,
}) => {
```

**Step 2: Remove the `getIcon()` function entirely**

Delete lines 103–115 (the entire `getIcon()` function).

**Step 3: Replace icon rendering with Image**

Find this block in the JSX (the `{/* Animated Icon */}` section) and replace it:

```tsx
{/* REPLACE this entire block: */}
{/*
<View style={{ width: 64, height: 64, ... }}>
  <Animated.View style={iconAnimatedStyle}>{getIcon()}</Animated.View>
</View>
*/}

{/* WITH this: */}
<Animated.View style={[iconAnimatedStyle, {
  width: 72,
  height: 72,
  marginRight: 16,
}]}>
  <Image
    source={imageSource}
    style={{
      width: 72,
      height: 72,
      resizeMode: 'contain',
    }}
  />
</Animated.View>
```

Note: removed the container View with border/background — the character image stands on its own.

**Step 4: Remove now-unused lucide imports**

Delete line 3: `import { ShoppingCart, Wheat, Truck } from 'lucide-react-native';`

**Step 5: Update RoleSelectionScreen to pass imageSource**

In `RoleSelectionScreen.tsx`, add the image requires and update the roleCards array:

```tsx
// ADD after the existing imports (near line 13):
// Character images
const ROLE_IMAGES = {
  buyer: require('../../../../assets/UserTypes/Buyer.png'),
  seller: require('../../../../assets/UserTypes/Seller.png'),
  transport: require('../../../../assets/UserTypes/transporter.png'),
} as const;

// UPDATE roleCards array (add imageSource to each entry):
const roleCards = [
  {
    id: 'buyer' as const,
    title: 'Buyer',
    color: '#60A5FA',
    gradient: ['#3B82F6', '#1E40AF'],
    imageSource: ROLE_IMAGES.buyer,
  },
  {
    id: 'seller' as const,
    title: 'Seller',
    color: '#4ADE80',
    gradient: ['#10B981', '#065F46'],
    imageSource: ROLE_IMAGES.seller,
  },
  {
    id: 'transport' as const,
    title: 'Transporter',
    color: '#A78BFA',
    gradient: ['#8B5CF6', '#5B21B6'],
    imageSource: ROLE_IMAGES.transport,
  },
];
```

**Step 6: Pass imageSource prop to AnimatedRoleCard**

Find the `AnimatedRoleCard` JSX in the map and add the prop:

```tsx
<AnimatedRoleCard
  key={card.id}
  id={card.id}
  title={card.title}
  color={card.color}
  gradient={card.gradient}
  imageSource={card.imageSource}  // ADD THIS LINE
  isSelected={selectedRole === card.id}
  onPress={() => handleRoleSelect(card.id)}
  delay={index * 100}
/>
```

**Step 7: Visual check**

Run the Metro bundler (already running on :8081), open the app, navigate to role selection. Verify:
- [ ] Three character images appear in the cards
- [ ] Entry spring animation still works
- [ ] Selection state (green border + checkmark) still works
- [ ] The animations (rotation/bounce/slide) still apply to the images

---

## Task 2: Create the tour store

**Files:**
- Create: `src/stores/tour.store.ts`
- Create: `src/stores/__tests__/tour.store.test.ts`
- Modify: `src/stores/index.ts` (add export)

**Step 1: Write the failing tests first**

Create `src/stores/__tests__/tour.store.test.ts`:

```typescript
import { act, renderHook } from '@testing-library/react-hooks';

// Reset module between tests so store state doesn't bleed
beforeEach(() => {
  jest.resetModules();
});

describe('useTourStore', () => {
  it('starts with tour not active and not seen', async () => {
    const { useTourStore } = await import('../tour.store');
    const { result } = renderHook(() => useTourStore());
    expect(result.current.isTourActive).toBe(false);
    expect(result.current.hasSeenTour).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.tourRole).toBeNull();
  });

  it('startTour sets role and activates tour at step 0', async () => {
    const { useTourStore } = await import('../tour.store');
    const { result } = renderHook(() => useTourStore());
    act(() => { result.current.startTour('buyer'); });
    expect(result.current.isTourActive).toBe(true);
    expect(result.current.tourRole).toBe('buyer');
    expect(result.current.currentStep).toBe(0);
  });

  it('nextStep increments currentStep', async () => {
    const { useTourStore } = await import('../tour.store');
    const { result } = renderHook(() => useTourStore());
    act(() => { result.current.startTour('seller'); });
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(1);
  });

  it('skipTour deactivates and marks seen', async () => {
    const { useTourStore } = await import('../tour.store');
    const { result } = renderHook(() => useTourStore());
    act(() => { result.current.startTour('transport'); });
    act(() => { result.current.skipTour(); });
    expect(result.current.isTourActive).toBe(false);
    expect(result.current.hasSeenTour).toBe(true);
  });

  it('completeTour deactivates and marks seen', async () => {
    const { useTourStore } = await import('../tour.store');
    const { result } = renderHook(() => useTourStore());
    act(() => { result.current.startTour('buyer'); });
    act(() => { result.current.completeTour(); });
    expect(result.current.isTourActive).toBe(false);
    expect(result.current.hasSeenTour).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('startTour resets hasSeenTour to false', async () => {
    const { useTourStore } = await import('../tour.store');
    const { result } = renderHook(() => useTourStore());
    act(() => { result.current.startTour('buyer'); });
    act(() => { result.current.completeTour(); });
    act(() => { result.current.startTour('seller'); }); // start again
    expect(result.current.hasSeenTour).toBe(false);
  });
});
```

**Step 2: Run to see it fail**

```bash
cd /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/front-end
npx jest src/stores/__tests__/tour.store.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '../tour.store'"

**Step 3: Create `src/stores/tour.store.ts`**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TourRole = 'buyer' | 'seller' | 'transport';

interface TourState {
  hasSeenTour: boolean;
  isTourActive: boolean;
  currentStep: number;
  tourRole: TourRole | null;
  startTour: (role: TourRole) => void;
  nextStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      hasSeenTour: false,
      isTourActive: false,
      currentStep: 0,
      tourRole: null,

      startTour: (role) =>
        set({ isTourActive: true, currentStep: 0, tourRole: role, hasSeenTour: false }),

      nextStep: () =>
        set((state) => ({ currentStep: state.currentStep + 1 })),

      skipTour: () =>
        set({ isTourActive: false, hasSeenTour: true, currentStep: 0 }),

      completeTour: () =>
        set({ isTourActive: false, hasSeenTour: true, currentStep: 0 }),

      resetTour: () =>
        set({ hasSeenTour: false, isTourActive: false, currentStep: 0, tourRole: null }),
    }),
    {
      name: 'tour-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist whether user has seen the tour — step/active resets on app restart
      partialize: (state) => ({ hasSeenTour: state.hasSeenTour }),
    }
  )
);
```

**Step 4: Run tests to see them pass**

```bash
npx jest src/stores/__tests__/tour.store.test.ts --no-coverage
```

Expected: All 5 tests PASS.

**Step 5: Export from stores barrel**

In `src/stores/index.ts`, add:

```typescript
export { useTourStore } from './tour.store';
```

**Step 6: Commit**

```bash
git add src/stores/tour.store.ts src/stores/__tests__/tour.store.test.ts src/stores/index.ts
git commit -m "feat: add tour store with Zustand persistence"
```

---

## Task 3: Define tour step data per role

**Files:**
- Create: `src/features/onboarding/data/tourSteps.ts`

**Step 1: Create the tour step data file**

```typescript
// src/features/onboarding/data/tourSteps.ts

/**
 * SpotlightArea uses fractions (0–1) of screen dimensions.
 * null means full-screen dim with no spotlight hole.
 *
 * Positions are calibrated for the Market Intelligence (dashboard) screen.
 * Fine-tune topPct/heightPct if layout changes.
 */
export interface SpotlightArea {
  topPct: number;    // distance from top as fraction of screen height
  leftPct: number;   // distance from left as fraction of screen width
  widthPct: number;  // width as fraction of screen width
  heightPct: number; // height as fraction of screen height
}

export interface TourStep {
  title: string;
  message: string;
  spotlight: SpotlightArea | null; // null = full dim, character only
}

// ─── BUYER ───────────────────────────────────────────────────────────────────
const BUYER_STEPS: TourStep[] = [
  {
    title: 'Welcome! 👋',
    message:
      "Hey there! I'm your AgroTrade guide. Let me show you around — it'll take less than a minute!",
    spotlight: null,
  },
  {
    title: 'Live Market Prices 📊',
    message:
      'These are live commodity prices. They refresh every 15 minutes so you always have the latest data.',
    spotlight: { topPct: 0.1, leftPct: 0, widthPct: 1, heightPct: 0.3 },
  },
  {
    title: 'Agricultural News 📰',
    message:
      'Stay ahead of the market with curated agricultural news. Tap any article to read more.',
    spotlight: { topPct: 0.42, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: 'Price Alerts 🔔',
    message:
      "Set a target price and we'll notify you when the market hits it. Tap '+ ADD' to create your first alert.",
    spotlight: { topPct: 0.65, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: "You're all set! 🎉",
    message: 'Use the tabs below to browse products, place orders, and manage your profile. Happy buying!',
    spotlight: { topPct: 0.88, leftPct: 0, widthPct: 1, heightPct: 0.12 },
  },
];

// ─── SELLER ──────────────────────────────────────────────────────────────────
const SELLER_STEPS: TourStep[] = [
  {
    title: 'Welcome, Seller! 🌱',
    message:
      "I'm your AgroTrade guide. Let me give you a quick tour of your selling dashboard!",
    spotlight: null,
  },
  {
    title: 'Market Prices 📊',
    message:
      'Check current commodity prices here. Use these to price your products competitively and maximise margins.',
    spotlight: { topPct: 0.1, leftPct: 0, widthPct: 1, heightPct: 0.3 },
  },
  {
    title: 'Market News 📰',
    message:
      'Stay informed about supply/demand trends. News affects prices — read it before listing.',
    spotlight: { topPct: 0.42, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: 'Price Alerts 🔔',
    message:
      "Get notified when prices hit your target. Great for timing when to list your produce.",
    spotlight: { topPct: 0.65, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: "Let's sell! 🎉",
    message:
      'Navigate with the tabs below to list your products and manage incoming orders. Go get that bread!',
    spotlight: { topPct: 0.88, leftPct: 0, widthPct: 1, heightPct: 0.12 },
  },
];

// ─── TRANSPORTER ─────────────────────────────────────────────────────────────
const TRANSPORT_STEPS: TourStep[] = [
  {
    title: 'Welcome, Driver! 🚛',
    message:
      "I'm your AgroTrade guide. Let me show you how to find jobs and grow your logistics business!",
    spotlight: null,
  },
  {
    title: 'Market Intelligence 📊',
    message:
      'Track commodity price movements here. High-value commodities moving means more transport demand.',
    spotlight: { topPct: 0.1, leftPct: 0, widthPct: 1, heightPct: 0.3 },
  },
  {
    title: 'Industry News 📰',
    message:
      'Follow agricultural news to anticipate where goods will be moving before jobs even get posted.',
    spotlight: { topPct: 0.42, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: 'Price Alerts 🔔',
    message:
      "Set alerts for commodities in your region. Price spikes often mean urgent transport needs.",
    spotlight: { topPct: 0.65, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: "Hit the road! 🎉",
    message:
      'Use the tabs below to browse available transport jobs, manage your routes, and update your profile.',
    spotlight: { topPct: 0.88, leftPct: 0, widthPct: 1, heightPct: 0.12 },
  },
];

// ─── EXPORT ──────────────────────────────────────────────────────────────────
export const TOUR_STEPS: Record<'buyer' | 'seller' | 'transport', TourStep[]> = {
  buyer: BUYER_STEPS,
  seller: SELLER_STEPS,
  transport: TRANSPORT_STEPS,
};
```

No tests needed for pure data — it's a constant. Review it visually and adjust copy as desired.

**Step 2: Commit**

```bash
git add src/features/onboarding/data/tourSteps.ts
git commit -m "feat: add tour step data for all three roles"
```

---

## Task 4: Build CharacterTourOverlay component

This is the main visual layer. It renders above everything using `position: absolute` + `zIndex: 9999`. It reads tour state from `useTourStore` and step data from `TOUR_STEPS`.

**Files:**
- Create: `src/features/onboarding/components/CharacterTourOverlay.tsx`

**Step 1: Create the component**

```tsx
// src/features/onboarding/components/CharacterTourOverlay.tsx

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTourStore } from '@stores/tour.store';
import { TOUR_STEPS, SpotlightArea } from '../data/tourSteps';

// ─── Character images ────────────────────────────────────────────────────────
const CHARACTER_IMAGES = {
  buyer: require('../../../../assets/UserTypes/Buyer.png'),
  seller: require('../../../../assets/UserTypes/Seller.png'),
  transport: require('../../../../assets/UserTypes/transporter.png'),
} as const;

// ─── Spotlight (4-strip approach) ────────────────────────────────────────────
interface SpotlightProps {
  area: SpotlightArea | null;
  W: number;
  H: number;
}

const Spotlight: React.FC<SpotlightProps> = ({ area, W, H }) => {
  const DIM = 'rgba(0,0,0,0.82)';

  if (!area) {
    // Full-screen dim — no hole
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: DIM }]} pointerEvents="none" />;
  }

  const top    = area.topPct    * H;
  const left   = area.leftPct   * W;
  const width  = area.widthPct  * W;
  const height = area.heightPct * H;

  return (
    <>
      {/* Top strip */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: top, backgroundColor: DIM }}
        pointerEvents="none"
      />
      {/* Bottom strip */}
      <View
        style={{ position: 'absolute', top: top + height, left: 0, right: 0, bottom: 0, backgroundColor: DIM }}
        pointerEvents="none"
      />
      {/* Left strip */}
      <View
        style={{ position: 'absolute', top, left: 0, width: left, height, backgroundColor: DIM }}
        pointerEvents="none"
      />
      {/* Right strip */}
      <View
        style={{ position: 'absolute', top, left: left + width, right: 0, height, backgroundColor: DIM }}
        pointerEvents="none"
      />
      {/* Glow border around the spotlight hole */}
      <View
        style={{
          position: 'absolute',
          top: top - 2,
          left: left - 2,
          width: width + 4,
          height: height + 4,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: 'rgba(74, 222, 128, 0.85)',
        }}
        pointerEvents="none"
      />
    </>
  );
};

// ─── Main overlay ────────────────────────────────────────────────────────────
export const CharacterTourOverlay: React.FC = () => {
  const { width: W, height: H } = useWindowDimensions();
  const { isTourActive, currentStep, tourRole, nextStep, skipTour, completeTour } = useTourStore();

  // Fade-in the overlay when it becomes active
  const overlayOpacity = useSharedValue(0);
  useEffect(() => {
    if (isTourActive) {
      overlayOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
    } else {
      overlayOpacity.value = 0;
    }
  }, [isTourActive]);

  // Fade bubble when step changes
  const bubbleOpacity = useSharedValue(1);
  useEffect(() => {
    bubbleOpacity.value = 0;
    bubbleOpacity.value = withTiming(1, { duration: 250 });
  }, [currentStep]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const bubbleStyle  = useAnimatedStyle(() => ({ opacity: bubbleOpacity.value }));

  if (!isTourActive || !tourRole) return null;

  const steps = TOUR_STEPS[tourRole];
  const step  = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  if (!step) {
    // Stepped past the last step — complete
    completeTour();
    return null;
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFill, overlayStyle, { zIndex: 9999 }]} pointerEvents="box-none">

      {/* Spotlight */}
      <Spotlight area={step.spotlight} W={W} H={H} />

      {/* Character image — bottom-right corner */}
      <Image
        source={CHARACTER_IMAGES[tourRole]}
        style={{
          position: 'absolute',
          bottom: 88,
          right: 20,
          width: 110,
          height: 110,
          resizeMode: 'contain',
        }}
      />

      {/* Speech bubble */}
      <Animated.View
        style={[
          bubbleStyle,
          {
            position: 'absolute',
            bottom: 206,   // sits above character (88 + 110 + 8)
            right: 16,
            left: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
            borderRadius: 18,
            padding: 18,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 14,
          },
        ]}
      >
        {/* Bubble tail (triangle pointing down-right toward character) */}
        <View
          style={{
            position: 'absolute',
            bottom: -11,
            right: 48,
            width: 0,
            height: 0,
            borderLeftWidth: 11,
            borderRightWidth: 11,
            borderTopWidth: 11,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: 'rgba(255, 255, 255, 0.97)',
          }}
        />

        {/* Step title */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 }}>
          {step.title}
        </Text>

        {/* Step message */}
        <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20 }}>
          {step.message}
        </Text>

        {/* Footer: skip | dots | next */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>

          {/* Skip */}
          <Pressable onPress={skipTour} hitSlop={8}>
            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '500' }}>Skip</Text>
          </Pressable>

          {/* Step dots */}
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentStep ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === currentStep ? '#4ADE80' : '#D1FAE5',
                }}
              />
            ))}
          </View>

          {/* Next / Done */}
          <Pressable
            onPress={isLastStep ? completeTour : nextStep}
            style={{
              backgroundColor: '#4ADE80',
              paddingHorizontal: 18,
              paddingVertical: 9,
              borderRadius: 22,
            }}
          >
            <Text style={{ color: '#052e16', fontWeight: '700', fontSize: 14 }}>
              {isLastStep ? 'Done 🎉' : 'Next →'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
};
```

**Step 2: Visual checklist before wiring**

The component is self-contained — it renders nothing when `isTourActive === false`. Wire it next.

**Step 3: Commit**

```bash
git add src/features/onboarding/components/CharacterTourOverlay.tsx
git commit -m "feat: build CharacterTourOverlay with spotlight and speech bubble"
```

---

## Task 5: Wire tour into the app

Two changes: (1) trigger the tour when entering the dashboard after onboarding, (2) render the overlay above everything.

**Files:**
- Modify: `src/features/onboarding/screens/OnboardingCompleteScreen.tsx`
- Modify: `src/navigation/RootNavigator.tsx`

**Step 1: Trigger tour in OnboardingCompleteScreen**

Find the "Enter Dashboard" button handler and add `startTour` call before navigation:

```tsx
// ADD imports at the top of OnboardingCompleteScreen.tsx:
import { useTourStore } from '@stores/tour.store';

// INSIDE the component, add:
const { startTour } = useTourStore();
const { selectedRole } = useOnboardingStore(); // already imported most likely

// FIND the "Enter Dashboard" onPress handler and UPDATE it:
const handleEnterDashboard = () => {
  // Trigger the guided tour before navigating — it waits until overlay renders on dashboard
  if (selectedRole && !useTourStore.getState().hasSeenTour) {
    startTour(selectedRole as 'buyer' | 'seller' | 'transport');
  }
  // existing navigation logic (keep whatever is already here):
  resetOnboarding();
  navigation.dispatch(
    CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
  );
};
```

**Step 2: Render CharacterTourOverlay in RootNavigator**

Open `src/navigation/RootNavigator.tsx` and wrap the existing return in a Fragment, adding the overlay after the NavigationContainer:

```tsx
// ADD import:
import { CharacterTourOverlay } from '../features/onboarding/components/CharacterTourOverlay';

// WRAP existing return (keep all existing NavigationContainer code exactly as-is):
return (
  <>
    <NavigationContainer
      // ... all existing props stay unchanged ...
    >
      {/* ... all existing Stack.Navigator code stays unchanged ... */}
    </NavigationContainer>

    {/* Character tour overlay — renders above navigation on first dashboard visit */}
    <CharacterTourOverlay />
  </>
);
```

**Step 3: Manual end-to-end test**

Run through the full flow:
1. Clear app data (or call `useTourStore.getState().resetTour()` from a dev button)
2. Select a role (e.g. Buyer) → complete the onboarding steps
3. Press "Enter Dashboard"
4. **Expect:** Overlay appears, character (Buyer.png) shows in bottom-right, welcome message shown
5. Press Next → spotlight highlights market prices section
6. Press Next → spotlight moves to news section
7. Press Next → spotlight moves to alerts section
8. Press Next → spotlight highlights bottom tabs
9. Press "Done 🎉" → overlay disappears, app fully usable
10. Navigate away and back → overlay does NOT re-appear (`hasSeenTour: true`)

**Step 4: Test skip flow**

1. `resetTour()`, go through onboarding again
2. On step 2, press "Skip"
3. **Expect:** overlay disappears immediately, `hasSeenTour: true`

**Step 5: Commit**

```bash
git add src/features/onboarding/screens/OnboardingCompleteScreen.tsx src/navigation/RootNavigator.tsx
git commit -m "feat: trigger character tour on first dashboard entry"
```

---

## Task 6: Fix tab reloading (data refetch on tab switch)

The cause: React Navigation's tab navigator unmounts/remounts tab screens when switching, causing `useEffect` data fetches to re-run on every tab visit.

**Fix strategy:** Two-pronged:
1. Add `unmountOnBlur={false}` to prevent unmounting (if using React Navigation's BottomTabNavigator)
2. Add TTL guard in each screen's fetch call (so even if it remounts, it won't refetch fresh data)

**Files:**
- Find: main tab navigator file (search for `createBottomTabNavigator` in `src/navigation/`)
- Modify: any screen that calls fetch in `useEffect` or `useFocusEffect`

**Step 1: Find the tab navigator**

```bash
grep -r "createBottomTabNavigator\|BottomTabNavigator" \
  /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/front-end/src/navigation/ \
  --include="*.tsx" -l
```

Open the file found. In the `<Tab.Screen>` components, look for an `options` prop or screen-level config.

**Step 2: Add unmountOnBlur={false} to all tab screens**

In the tab navigator file, add to the Tab.Navigator's `screenOptions`:

```tsx
<Tab.Navigator
  screenOptions={{
    unmountOnBlur: false,  // ADD THIS — prevents unmount/remount on tab switch
    // ... all existing screenOptions stay ...
  }}
>
  {/* existing Tab.Screen entries unchanged */}
</Tab.Navigator>
```

This is the primary fix. With `unmountOnBlur: false`, tabs stay mounted and their `useEffect` only runs once.

**Step 3: Add TTL guard as backup (market store is already fine)**

The `market.store.ts` already has `lastFetchedPrices` and `lastFetchedNews` timestamps. Check if the screen calling `fetchPrices`/`fetchNews` respects those TTLs.

Find the screen that calls `fetchPrices` (likely `IntelligenceScreen.tsx`). Verify it uses:

```typescript
const { fetchPrices, prices, lastFetchedPrices } = useMarketStore();

useFocusEffect(
  React.useCallback(() => {
    const FIFTEEN_MIN = 15 * 60 * 1000;
    const isStale = !lastFetchedPrices || Date.now() - lastFetchedPrices > FIFTEEN_MIN;
    if (isStale) fetchPrices();
  }, [fetchPrices, lastFetchedPrices])
);
```

If it's using a plain `useEffect([])` instead, replace with the `useFocusEffect` + TTL pattern above. Apply the same pattern for `fetchNews` (30-min TTL).

**Step 4: Verify fix**

1. Open Intelligence screen — watch network tab, prices + news load
2. Navigate to another tab
3. Navigate back to Intelligence screen
4. **Expect:** NO new network requests fire (data already fresh)

**Step 5: Commit**

```bash
git add src/navigation/<tab-navigator-file>.tsx
# add any modified screen files too
git commit -m "fix: prevent tab screens from refetching on every tab switch"
```

---

## Spotlight Position Tuning Guide

After wiring everything, the spotlight percentages may need small adjustments for your actual screen layout. Here's how:

```typescript
// Temporarily add this to a screen to measure element positions:
import { useWindowDimensions } from 'react-native';
const { height: H } = useWindowDimensions();

// Then in onLayout of a section:
onLayout={(e) => {
  const { y, height } = e.nativeEvent.layout;
  console.log(`Section — topPct: ${(y/H).toFixed(2)}, heightPct: ${(height/H).toFixed(2)}`);
}}
```

Use these logged values to update `TOUR_STEPS` in `src/features/onboarding/data/tourSteps.ts`.

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `src/stores/tour.store.ts` | Tour state (active, step, role, seen) |
| `src/stores/__tests__/tour.store.test.ts` | Tour store unit tests |
| `src/features/onboarding/data/tourSteps.ts` | Tour copy + spotlight coordinates per role |
| `src/features/onboarding/components/CharacterTourOverlay.tsx` | Main overlay component |

## Modified Files

| File | Change |
|------|--------|
| `AnimatedRoleCard.tsx` | PNG image replaces lucide icon |
| `RoleSelectionScreen.tsx` | Pass imageSource to each card |
| `OnboardingCompleteScreen.tsx` | Call `startTour()` before navigating |
| `RootNavigator.tsx` | Render `<CharacterTourOverlay />` above NavigationContainer |
| Tab navigator file | `unmountOnBlur: false` |
| Intelligence screen | `useFocusEffect` + TTL guard |
