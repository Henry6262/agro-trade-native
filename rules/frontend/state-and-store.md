# State & Store Rules

## Local Component State
- Use `useState` / `useReducer` for purely visual toggles (modal open, expanded row, input focus).
- Reset local state when props change; keep logic simple to avoid exceeding 150-line cap.
- Long-lived flows must be split into smaller components/hooks rather than a single 300+ line file; use the Page → Section → Feature structure to keep each unit within the file-size rules.

## Feature-Level Shared State
- Use Zustand (`store.ts`) when multiple components inside the same feature need shared state (filters, wizard progress, selection lists).
- Store location: `pages/<Page>/sections/<Section>/features/<Feature>/store.ts`.
- Export `useFeatureStore` hook with selectors; keep store files ≤100 lines.
- Persist to AsyncStorage only when necessary; isolate persistence logic in the store file (with `persist` middleware).

### Example
```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FiltersState {
  category: string | null;
  setCategory: (category: string | null) => void;
  reset: () => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      category: null,
      setCategory: (category) => set({ category }),
      reset: () => set({ category: null }),
    }),
    { name: 'filters-store' }
  )
);
```

## Global App State
- Lives under `src/app/store/` (e.g., auth, theme, notification preferences).
- Keep global store usage minimal; prefer feature-level stores to avoid coupling.

## React Query Cache
- Treat React Query cache as read-only derived state.
- Never mutate query data directly; use `queryClient.setQueryData` helpers in hooks/services when necessary.

## Navigation State
- React Navigation remains configured under `src/navigation`.
- Pages export entry components consumed by navigation; avoid importing navigation directly inside feature components.
