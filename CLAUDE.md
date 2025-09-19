# Claude Code Runtime Guidance for Agro-Trade

## Project Context
Agro-Trade is a React Native agricultural trading platform connecting buyers, sellers, and transporters. We're using a hybrid approach: existing code stays as-is, new features follow Spec-Driven Development (SDD).

## Current State
- Frontend: React Native + Expo (no ejecting)
- Backend: NestJS + Prisma + PostgreSQL
- Styling: NativeWind (Tailwind for React Native)
- State: Zustand + React Query
- Maps: Google Maps via react-native-maps

## Active Development
Currently implementing: Trade Operation Management Hub (Branch: 004-trade-operation-management)
- Centralized Active Operations tab for all trade operations
- Negotiation management with counter-offer handling
- Request-based updates (no polling/WebSocket)
- 48-hour offer expiration with visual indicators
- Potential sellers list with one-click offer sending
- Reuses existing OfferModal and drawer patterns

Previous: Trade Operation Creation Flow (Branch: 003-create-a-comprehensive)

## Development Rules

### For NEW Features (Maps onwards)
1. Use /specify command first
2. Use /plan for technical approach
3. Use /tasks to generate task list
4. Write tests BEFORE implementation
5. Follow TDD: Red → Green → Refactor

### For EXISTING Code
- Don't refactor unless broken
- Add tests when modifying
- Keep mock data patterns

## Key Patterns to Follow

### Component Structure
```typescript
// Use functional components with TypeScript
interface ComponentProps extends BaseComponentProps {
  // Props here
}

export const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // Implementation
};
```

### State Management
```typescript
// Zustand for feature state
const useFeatureStore = create<State>((set) => ({
  // State and actions
}));

// React Query for server state
const { data, isLoading } = useQuery({
  queryKey: ['resource'],
  queryFn: fetchResource,
});
```

### Styling
```tsx
// Always use NativeWind classes
<View className="flex-1 bg-black p-4">
  <Text className="text-white font-bold">Content</Text>
</View>
```

## File Locations
- Components: `/front-end/src/shared/components/`
- Features: `/front-end/src/features/`
- Transporter: `/front-end/src/features/dashboard/screens/transporter/`
- Inspector: `/front-end/src/features/dashboard/screens/inspector/`
- Maps Reference: `/front-end/src/shared/components/LocationMapPicker.tsx`

## Testing Approach
```typescript
// Test file naming: Component.test.tsx
describe('Component', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});
```

## Common Commands
```bash
# Frontend
cd front-end
npm run start  # Start Expo
npm run ios    # Run on iOS
npm run android # Run on Android
npm test       # Run tests

# Backend
cd backend
npm run start:dev  # Start NestJS
npm run test      # Run tests
```

## Mock Data Pattern
Always start with mock data in components:
```typescript
const mockData = [
  { id: "1", name: "Item 1", ... },
  { id: "2", name: "Item 2", ... },
];
```

## API Response Pattern
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Current Issues to Avoid
1. Don't eject from Expo
2. Don't use StyleSheet.create (use NativeWind)
3. Don't create abstractions with < 3 uses
4. Don't use complex state management (Redux, MobX)
5. Don't skip tests for new features

## Help & Context
- Constitution: `/CONSTITUTION.md` - Project principles
- Map Reference: `LocationMapPicker.tsx` - Example map implementation
- Fleet Tab: `TransporterFleetTab.tsx` - Current transporter UI
- Product Creation: `product-creation/` - Drawer flow pattern to follow

## Remember
- Mobile-first always
- Four actors: Buyer, Seller, Transporter, Inspector, Admin
- Mock data first, real API second
- Test-first for new features
- Reuse existing components

## Trade Operation Patterns
- Creation: Trade operation created in Step 1 when setting margin
- Negotiations: Managed in centralized Active Operations tab
- Updates: Request-based (no polling), refresh on navigation
- Offer expiry: 48 hours automatic with visual countdown
- Counter-offers: Inline display with Accept/Reject/Counter actions
- Status indicators: Pending (blue), Accepted (green), Countered (orange), Expired (gray)
- Progress: Shows quantity secured vs needed as percentage
- Commission: 2.5% seller, 1.5% buyer

## Inspector Feature Patterns
- Location tracking: expo-location with 10s intervals
- Job priorities: LOW (white), MEDIUM (yellow), HIGH (red)
- Verification form: Drawer pattern like product creation
- Real-time updates: WebSocket for admin monitoring
- Offline support: AsyncStorage for active job