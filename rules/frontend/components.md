# Component Rules

## Design-System Only
- Import primitives from `@/app/components/ui` (alias to `front-end/src/app/components/ui/` once tsconfig paths updated).
- No custom buttons, inputs, cards, modals, badges, or typography. If a needed primitive is missing, add it under `app/components/ui/` first.
- Styling must rely on the shared theme (Tailwind/nativewind tokens or StyleSheet constants). Inline arbitrary colors/spacing are prohibited.

## Responsibilities
Components **may**:
- Render UI using props/state.
- Handle local interaction state (toggle, expanded, focus, etc.).
- Trigger callbacks received via props.
- Compose other components/layout primitives.

Components must **not**:
- Fetch data, call services, or use React Query.
- Access Zustand stores directly (except read-only selectors for purely presentational info).
- Format/transform data (delegate to hooks/utils).
- Contain business rules.

## Patterns
- Keep components functional (`function ComponentName`).
- Use prop interfaces defined in `types.ts`.
- Re-export components via `components/index.ts` when helpful.
- Apply React.memo only when measured/performance-critical.

## Example
```tsx
import { Card, Text, Button } from '@/app/components/ui';
import type { TokenCardProps } from '../types';

export function TokenCard({ token, isSelected, onSelect }: TokenCardProps) {
  return (
    <Card variant={isSelected ? 'selected' : 'default'} onPress={() => onSelect(token.id)}>
      <Text variant="label">{token.symbol}</Text>
      <Text variant="body">{token.name}</Text>
      <Button variant="secondary" onPress={() => onSelect(token.id)}>
        View details
      </Button>
    </Card>
  );
}
```

## Tests
- Use React Native Testing Library for components with logic (show/hide states, accessibility).
- Snapshot tests OK for purely visual pieces but keep them minimal.
