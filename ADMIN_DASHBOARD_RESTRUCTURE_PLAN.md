# Admin Dashboard Restructure Plan

## Current State Analysis

### File Size Issues
- **ScenarioOrchestrator.tsx**: 1,193 lines 🚨🚨🚨
- **TradeDetails.tsx**: 759 lines 🚨
- **ProfessionalScenarioRunner.tsx**: 718 lines 🚨
- **SimplifiedScenarioRunner.tsx**: 583 lines
- **CompanyDashboard.tsx**: 465 lines
- **TradeCreationWizard.tsx**: 447 lines
- **TradeFlowDiagram.tsx**: 442 lines

### Structural Issues
1. **Flat component dump** - No feature-based organization
2. **Duplicate files** - TransportManagement.tsx exists both as file and folder
3. **No routing** - Everything conditionally rendered in App.tsx
4. **Mixed concerns** - AutoLogin in components folder
5. **Inconsistent naming** - Some feature folders (InspectorPortal), some files (TradeDetails.tsx)

### Folder Structure Issues
```
src/
├── components/  ← EVERYTHING IS HERE 🚨
│   ├── AutoLogin.tsx  ← Should be in services/auth/
│   ├── ScenarioOrchestrator.tsx (1,193 lines!) ← Should be broken down
│   ├── TradeDetails.tsx (759 lines!) ← Should be broken down
│   ├── TransportManagement.tsx ← DUPLICATE! Folder also exists
│   ├── InspectorPortal/ ← Feature folder (good)
│   ├── MatchingDashboard/ ← Feature folder (good)
│   └── TransportManagement/ ← Feature folder (good)
├── pages/
│   └── CompanyDashboard.tsx ← Only 1 page?!
```

## Proposed New Structure

```
src/
├── app/                                    # App-level configuration
│   ├── App.tsx                            # Main app component
│   ├── Router.tsx                         # React Router setup
│   └── layout/                            # Layout components
│       ├── AppLayout.tsx                  # Main layout wrapper
│       ├── Header.tsx                     # App header with navigation
│       └── Sidebar.tsx                    # Optional sidebar
│
├── pages/                                  # Top-level pages/views
│   ├── DashboardPage.tsx                  # Main dashboard (/dashboard)
│   ├── MatchingPage.tsx                   # Map matching view (/matching)
│   ├── TradeOperationsPage.tsx            # Trade ops list (/operations)
│   ├── ScenariosPage.tsx                  # Scenarios testing (/scenarios)
│   ├── InspectionsPage.tsx                # Inspections view (/inspections)
│   └── TransportPage.tsx                  # Transport management (/transport)
│
├── features/                               # Feature-based modules
│   ├── trade-operations/                  # Trade operations feature
│   │   ├── components/
│   │   │   ├── TradeOperationsTable.tsx   # List view
│   │   │   ├── TradeOperationRow.tsx      # Table row component
│   │   │   ├── TradeDetailsModal.tsx      # Details modal (break down TradeDetails.tsx)
│   │   │   ├── TradeCreationWizard/       # Wizard subfolder
│   │   │   │   ├── TradeCreationWizard.tsx
│   │   │   │   ├── StepOne.tsx
│   │   │   │   ├── StepTwo.tsx
│   │   │   │   └── StepThree.tsx
│   │   │   ├── TradeFlowDiagram/          # Flow visualization
│   │   │   │   ├── TradeFlowDiagram.tsx
│   │   │   │   ├── StepCard.tsx
│   │   │   │   └── FlowConnector.tsx
│   │   │   └── metrics/
│   │   │       ├── MetricsSidebar.tsx
│   │   │       └── ProgressDashboard.tsx
│   │   ├── hooks/
│   │   │   ├── useTradeOperations.ts
│   │   │   └── useTradeDetails.ts
│   │   ├── services/
│   │   │   └── tradeOperationsApi.ts
│   │   └── types/
│   │       └── tradeOperation.types.ts
│   │
│   ├── matching/                          # Map-based matching feature
│   │   ├── components/
│   │   │   ├── MatchingDashboard.tsx      # Main dashboard
│   │   │   ├── BulgariaMap.tsx
│   │   │   ├── BuyerOrdersPanel.tsx
│   │   │   ├── SellerCardsPanel.tsx
│   │   │   ├── OrderInfoBar.tsx
│   │   │   ├── PricingModal.tsx
│   │   │   ├── OfferDetailsModal.tsx
│   │   │   ├── OffersTrackingPanel.tsx
│   │   │   └── SpecificationBadge.tsx
│   │   ├── hooks/
│   │   │   ├── useMatchingData.ts
│   │   │   └── useOffers.ts
│   │   └── types/
│   │       └── matching.types.ts
│   │
│   ├── scenarios/                         # Scenario testing feature
│   │   ├── components/
│   │   │   ├── ScenarioRunner.tsx         # Break down ProfessionalScenarioRunner
│   │   │   ├── ScenarioList.tsx
│   │   │   ├── ScenarioBuilder.tsx
│   │   │   ├── ScenarioOrchestrator/      # Break down 1,193 line monster!
│   │   │   │   ├── ScenarioOrchestrator.tsx  (main coordinator - 200 lines max)
│   │   │   │   ├── ActorSelection.tsx
│   │   │   │   ├── ScenarioConfig.tsx
│   │   │   │   ├── ExecutionPanel.tsx
│   │   │   │   ├── ResultsView.tsx
│   │   │   │   └── hooks/
│   │   │   │       ├── useScenarioExecution.ts
│   │   │   │       └── useScenarioState.ts
│   │   │   └── ScenarioSelectorModal.tsx
│   │   ├── scenarios/                     # Scenario definitions
│   │   │   └── [scenario files]
│   │   └── types/
│   │       └── scenario.types.ts
│   │
│   ├── inspections/                       # Inspections feature
│   │   ├── components/
│   │   │   ├── InspectorPortal.tsx
│   │   │   ├── InspectionForm.tsx
│   │   │   └── InspectionList.tsx
│   │   └── types/
│   │       └── inspection.types.ts
│   │
│   ├── transport/                         # Transport management feature
│   │   ├── components/
│   │   │   ├── TransportManagement.tsx
│   │   │   ├── BidReviewModal.tsx
│   │   │   ├── RouteMapModal.tsx
│   │   │   └── TransportBidMap.tsx
│   │   └── types/
│   │       └── transport.types.ts
│   │
│   └── auth/                              # Authentication feature
│       ├── components/
│       │   └── AutoLogin.tsx              # Move from components root
│       └── hooks/
│           └── useAuth.ts
│
├── components/                            # Shared/common components only!
│   ├── common/                            # Basic UI components
│   │   ├── MetricBadge.tsx
│   │   ├── LoadingState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── forms/                             # Form components
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   └── index.ts
│   └── layout/                            # Layout components
│       ├── Panel.tsx
│       ├── Sidebar.tsx
│       └── index.ts
│
├── hooks/                                 # Global shared hooks
│   ├── useApi.ts
│   └── useLocalStorage.ts
│
├── services/                              # API services
│   ├── api.ts                            # Base API client
│   └── [feature-specific services moved to features/]
│
├── utils/                                # Utilities
│   ├── locationHelpers.ts
│   ├── specificationHelpers.ts
│   └── formatters.ts
│
├── types/                                # Global types
│   ├── listings.ts
│   └── [other shared types]
│
├── config/                               # Configuration
│   └── api.ts
│
└── styles/                               # Global styles
    └── designSystem.ts
```

## Migration Steps

### Phase 1: Setup New Structure (30 min)
1. Create new folder structure
2. Set up React Router
3. Create layout components
4. Create page components (empty shells)

### Phase 2: Move & Reorganize Features (2 hours)
1. **Matching feature** - Already well-organized, just move
2. **Inspections feature** - Move InspectorPortal
3. **Transport feature** - Consolidate duplicate files
4. **Auth feature** - Move AutoLogin

### Phase 3: Break Down Monster Components (4 hours)
1. **ScenarioOrchestrator.tsx (1,193 lines)** → 6-8 smaller components
   - Extract state management to custom hooks
   - Split UI into ActorSelection, Config, Execution, Results
   - Create ScenarioOrchestrator subfolder

2. **TradeDetails.tsx (759 lines)** → 4-5 smaller components
   - Extract sections into separate components
   - Create TradeDetails subfolder

3. **ProfessionalScenarioRunner.tsx (718 lines)** → 4-5 smaller components
   - Split into logical sections
   - Extract scenario execution logic

### Phase 4: Update Imports & Test (1 hour)
1. Update all imports
2. Test each view
3. Fix TypeScript errors
4. Verify everything works

## Success Metrics
- ✅ No file over 300 lines
- ✅ Feature-based organization
- ✅ Proper routing with React Router
- ✅ Clear separation of concerns
- ✅ Shared components in `components/common/`
- ✅ Feature-specific components in `features/*/components/`

## Timeline
- **Total Estimated Time**: 7-8 hours
- Can be done incrementally feature-by-feature
