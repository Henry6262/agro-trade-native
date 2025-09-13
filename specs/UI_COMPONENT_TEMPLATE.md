# Component: [Component Name]

## Purpose
[Brief description of the component's purpose]

## Props Interface
```typescript
interface [ComponentName]Props {
  prop1: string;
  prop2?: number;
  onAction: () => void;
}
```

## State Management
- Local state: [useState hooks]
- Global state: [Zustand store]
- Server state: [React Query hooks]

## Styling
- Design system: NativeWind/Tailwind classes
- Responsive breakpoints
- Animation requirements

## Behavior
1. Initial render
2. User interactions
3. State updates
4. Side effects

## Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support

## Testing
- Unit tests
- Integration tests
- Visual regression tests

## Usage Example
```tsx
<ComponentName
  prop1="value"
  onAction={() => handleAction()}
/>
```
