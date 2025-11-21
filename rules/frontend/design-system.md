# Design System & UI Primitives

## Location
- Shared primitives live under `front-end/src/app/components/ui/`.
- Layout wrappers (Header, Sidebar, SafeArea layouts) belong under `front-end/src/app/layout/`.
- Each primitive gets its own folder with `index.tsx` and optional `styles.ts`.

## Available Primitives (seed list)
- `Button`, `IconButton`
- `Text` (variants: heading, label, body, caption)
- `Input`, `Select`, `Slider`, `Checkbox`, `Switch`
- `Card`, `ListItem`, `Badge`, `Chip`
- `Modal`, `BottomSheet`
- `Grid`, `Stack`, `Spacer`
- `Skeleton`, `Shimmer`

> Update this list as you add or rename primitives. Every feature component must import from here.

## Extending the Design System
1. Create a new folder `app/components/ui/NewPrimitive/`.
2. Implement the primitive using React Native primitives + shared theme tokens.
3. Export from `app/components/ui/index.ts`.
4. Document props in JSDoc and update this file.

## Theming & Styling
- Use the shared theme (e.g., Tailwind/nativewind tokens) defined under `src/styles` or `app/utils/theme`.
- No hardcoded colors, font sizes, spacing, or radii. Pull from `theme.colors`, `theme.spacing`, etc.
- For conditional styling, prefer variant props (e.g., `<Button variant="primary" />`) rather than inline styles.

## Icons/Images
- Use centralized Icon component; do not import SVGs directly in features.
- Images live under `src/assets` and are referenced via a dedicated helper.

## Accessibility
- All primitives must expose accessibility props (e.g., `accessibilityRole`, `aria-label` equivalent when supported).
- Components in features rely on primitives to handle focus/press states consistently.
