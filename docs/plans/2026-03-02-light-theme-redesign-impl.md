# Light Theme Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Re-theme the entire AgroTrade mobile app from dark (black/neutral) to light (white base + green highlights), and clean up the top navbar.

**Architecture:** Two-pass approach — (1) remap Tailwind `neutral` color tokens globally so all `bg-neutral-800/900` classes auto-resolve to white/light-gray without touching 49 individual files; (2) surgically fix the 6 shell files that use hardcoded hex or need specific logic changes.

**Tech Stack:** React Native + NativeWind (Tailwind for RN), TypeScript. No new dependencies needed.

---

## Task 1: Remap Tailwind neutral colors (kills 80% of dark in one shot)

**File:** `front-end/tailwind.config.js`

**What it does:** Tailwind's default `neutral-800` = `#262626` (very dark), `neutral-900` = `#171717` (near-black). We override these so every existing `bg-neutral-800` class across the 49 files automatically becomes white, without editing those files.

**Step 1: Open the file and replace the `extend.colors` section**

Replace the entire `colors` block inside `extend:` with:

```js
colors: {
  // Brand green palette (unchanged)
  primary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  secondary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  // REMAPPED: neutral → light theme
  // Before: neutral-800 = #262626 (dark card), neutral-900 = #171717 (near-black bg)
  // After:  neutral-800 = white (card surface), neutral-900 = gray-50 (subtle bg)
  neutral: {
    50:  '#FFFFFF',  // pure white
    100: '#F9FAFB',  // gray-50
    200: '#F3F4F6',  // gray-100
    300: '#1F2937',  // dark text (was light gray — now body text on white)
    400: '#6B7280',  // muted gray
    500: '#6B7280',  // muted gray
    600: '#4B5563',  // medium gray
    700: '#E5E7EB',  // border (was dark #404040 — now light border)
    800: '#FFFFFF',  // card surface (was dark #262626)
    900: '#F9FAFB',  // app bg / subtle surface (was near-black #171717)
  },
},
```

**Step 2: Verify the change compiled** (NativeWind rebuilds on save, no manual step needed in dev)

Just save the file — Metro bundler picks it up automatically.

---

## Task 2: Fix Container default background color

**File:** `front-end/src/shared/components/Container.tsx` — line 53

**What it does:** Container wraps every screen. Its default `backgroundColor` prop is `'#000000'`. Change it to white so any screen that doesn't pass `backgroundColor` explicitly goes light.

**Step 1: Change the default prop**

Find:
```tsx
backgroundColor = '#000000',
```

Replace with:
```tsx
backgroundColor = '#FFFFFF',
```

**Step 2: Save and confirm** — no test needed, visual check in simulator.

---

## Task 3: Fix DashboardMainScreen — navbar + remove switcher

**File:** `front-end/src/features/dashboard/screens/DashboardMainScreen.tsx`

This is the main shell. Three changes: (A) white background + status bar, (B) light toolbar, (C) remove dashboard switcher entirely.

**Step 1: Fix Container and StatusBar (line ~208–210)**

Find:
```tsx
<Container safeArea={true} noPadding={true} backgroundColor="#000000">
  <StatusBar backgroundColor="#000000" barStyle="light-content" />
```

Replace with:
```tsx
<Container safeArea={true} noPadding={true} backgroundColor="#FFFFFF">
  <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
```

**Step 2: Fix the top toolbar (line ~216)**

Find:
```tsx
<View className="h-16 bg-neutral-800 border-b border-neutral-700 flex-row items-center justify-between px-6">
```

Replace with:
```tsx
<View className="h-16 bg-white border-b border-gray-200 flex-row items-center justify-between px-6">
```

**Step 3: Fix the wordmark text (line ~218)**

Find:
```tsx
<Text className="text-green-500 font-bold text-lg tracking-wider">AGRI TRADE</Text>
```

Replace with:
```tsx
<Text className="text-green-600 font-bold text-xl tracking-widest">AGRO TRADE</Text>
```

**Step 4: Remove the entire dashboard switcher button from the toolbar right side**

Find and DELETE this block (the `__DEV__ &&` TouchableOpacity with LayoutGrid icon):
```tsx
{/* Dashboard Switcher Button - DEV only */}
{__DEV__ && (
  <TouchableOpacity
    onPress={() => setShowDashboardSwitcher(!showDashboardSwitcher)}
    className="flex-row items-center bg-neutral-700 px-3 py-2 rounded-lg"
  >
    <LayoutGrid color="#9CA3AF" size={16} />
    <Text className="text-neutral-300 text-sm ml-2">Switch Dashboard</Text>
  </TouchableOpacity>
)}
```

**Step 5: Remove the bell and refresh icons from the right side**

Find and DELETE these two TouchableOpacity elements:
```tsx
<TouchableOpacity className="p-2">
  <Bell color="#9CA3AF" size={16} />
</TouchableOpacity>
<TouchableOpacity className="p-2">
  <RefreshCw color="#9CA3AF" size={16} />
</TouchableOpacity>
```

Keep only the avatar TouchableOpacity (the one that opens ProfileDrawer).

**Step 6: Remove the entire dashboard switcher dropdown block**

Find and DELETE the entire block (lines ~246–324):
```tsx
{/* Dashboard Switcher Dropdown - DEV only */}
{__DEV__ && showDashboardSwitcher && (
  <View ... >
    ...all the role option TouchableOpacity blocks...
  </View>
)}
```

**Step 7: Clean up now-unused imports and state**

Remove from imports: `Bell`, `RefreshCw`, `LayoutGrid` (if no longer used elsewhere in file)

Remove these state declarations:
```tsx
const [testRole, setTestRole] = useState<...>(null);
const [showDashboardSwitcher, setShowDashboardSwitcher] = useState(false);
```

Remove the `roleOptions` array (lines ~200–206).

Update `userRole` memo to remove `testRole` dependency:
```tsx
const userRole = React.useMemo(() => {
  const role = route.params?.userRole || user?.role || 'FARMER';
  const normalizedRole = role.toLowerCase();
  if (normalizedRole === 'farmer') return 'seller' as const;
  return normalizedRole as 'admin' | 'seller' | 'buyer' | 'transporter' | 'inspector';
}, [user?.role, route.params?.userRole]);
```

---

## Task 4: Fix BottomNavigation — light tab bar

**File:** `front-end/src/features/dashboard/components/BottomNavigation.tsx`

**Step 1: Update the SafeAreaView wrapper**

Find:
```tsx
<SafeAreaView className="bg-neutral-900 border-t border-neutral-700">
```

Replace with:
```tsx
<SafeAreaView className="bg-white border-t border-gray-200" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 }}>
```

**Step 2: Update active/inactive icon colors**

Find:
```tsx
<Icon size={26} color={isActive ? '#10B981' : '#6B7280'} />
```

Replace with:
```tsx
<Icon size={26} color={isActive ? '#16A34A' : '#9CA3AF'} />
```

**Step 3: Wrap each tab in a pill container for active state**

Replace the return of each tab item:
```tsx
<TouchableOpacity
  key={item.id}
  onPress={() => onSectionChange(item.id)}
  className="flex-1 items-center justify-center py-3 h-full"
  activeOpacity={0.7}
>
  <Icon size={26} color={isActive ? '#16A34A' : '#9CA3AF'} />
  <Text
    className={`text-xs mt-1.5 font-medium ${
      isActive ? 'text-green-600' : 'text-gray-400'
    }`}
    numberOfLines={1}
  >
    {item.label}
  </Text>
</TouchableOpacity>
```

Replace with:
```tsx
<TouchableOpacity
  key={item.id}
  onPress={() => onSectionChange(item.id)}
  className="flex-1 items-center justify-center py-2 h-full"
  activeOpacity={0.7}
>
  <View className={`items-center px-3 py-1.5 rounded-xl ${isActive ? 'bg-green-50' : ''}`}>
    <Icon size={24} color={isActive ? '#16A34A' : '#9CA3AF'} />
    <Text
      className={`text-xs mt-1 font-semibold ${
        isActive ? 'text-green-600' : 'text-gray-400'
      }`}
      numberOfLines={1}
    >
      {item.label}
    </Text>
  </View>
</TouchableOpacity>
```

---

## Task 5: Fix DashboardWrapper (second Container wrapper)

**File:** `front-end/src/features/dashboard/components/DashboardWrapper.tsx` — lines ~180–181

**Step 1:** Find:
```tsx
<Container safeArea={true} noPadding={true} backgroundColor="#000000">
  <StatusBar backgroundColor="#000000" barStyle="light-content" />
```

Replace with:
```tsx
<Container safeArea={true} noPadding={true} backgroundColor="#FFFFFF">
  <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
```

---

## Task 6: Fix global.css — green onboarding sidebar

**File:** `front-end/src/styles/global.css`

**Step 1:** Find:
```css
.progress-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 96px;
  z-index: 100;
  background-color: #1f2937;
  border-right: 1px solid #4b5563;
}
```

Replace with:
```css
.progress-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 96px;
  z-index: 100;
  background-color: #16A34A;
  border-right: 1px solid #15803D;
}
```

---

## Task 7: Fix hardcoded dark hex in Inspector map components

These are map marker files that use hardcoded dark hex values. They're used on the map view so they need to stay legible.

**Files:**
- `front-end/src/pages/Dashboard/sections/Inspector/features/ActiveJob/components/VerificationForm.tsx`
- `front-end/src/pages/Dashboard/sections/Inspector/components/components/JobMarker.tsx`
- `front-end/src/features/dashboard/screens/inspector/components/JobMarker.tsx`

**Step 1: VerificationForm.tsx** — `#374151` is gray-700 (already a light-friendly dark color for icons on white). Leave these as-is — they're fine on a white background.

**Step 2: JobMarker.tsx** (both copies) — find:
```tsx
backgroundColor: '#1f2937', // gray-800
```

Replace with:
```tsx
backgroundColor: '#FFFFFF',
```

---

## Task 8: Verify the result in simulator

**Step 1:** Check simulator is running:
```bash
xcrun simctl list devices | grep -i "booted"
```

**Step 2:** Take a screenshot to verify light theme:
```bash
xcrun simctl io booted screenshot /tmp/light-theme-check.png
open /tmp/light-theme-check.png
```

Expected: White background, green wordmark "AGRO TRADE", no dashboard switcher, clean green-highlighted bottom nav.

**Step 3:** Inject auth to check all 4 roles quickly — top navbar should be identical (logo only) across all roles.

---

## Task 9: Run frontend lint to confirm no regressions

```bash
cd front-end && npm run lint 2>&1 | grep "error" | grep -v "no-unused-vars\|never used" | head -20
```

Expected: 0 new errors introduced.

---

## Commit

```bash
git add \
  front-end/tailwind.config.js \
  front-end/src/styles/global.css \
  front-end/src/shared/components/Container.tsx \
  front-end/src/features/dashboard/screens/DashboardMainScreen.tsx \
  front-end/src/features/dashboard/components/BottomNavigation.tsx \
  front-end/src/features/dashboard/components/DashboardWrapper.tsx \
  front-end/src/pages/Dashboard/sections/Inspector/components/components/JobMarker.tsx \
  front-end/src/features/dashboard/screens/inspector/components/JobMarker.tsx
```

---

## Notes for Executor

- **Do NOT change** any Google Maps or chart components — they define their own colors
- **Do NOT change** any API/navigation/business logic — pure visual pass only
- The Tailwind neutral remap (Task 1) is the heavy lifter. After that, most screens look correct without touching them
- If any screen looks "inverted" (dark text on dark bg or invisible text), it means it uses `text-neutral-300` which we remapped to `#1F2937` (dark) — correct behavior on white bg
- The `testRole`/`showDashboardSwitcher` state can be safely deleted — they were dev-only testing utilities
