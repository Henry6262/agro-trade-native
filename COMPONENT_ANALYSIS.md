# Component Analysis & Reorganization Plan

## Current State: `/admin-dashboard/src/components/`

### 📊 Component Inventory

| Component | Size | Used By | Domain | Action |
|-----------|------|---------|--------|--------|
| **AutoLogin.tsx** | 2.5KB | App.tsx | Auth/Dev | Keep in shared |
| **DatabaseStatePanel.tsx** | 13.8KB | ProfessionalScenarioRunner, ScenarioOrchestrator | Scenarios | **Move to /features/scenarios** |
| **EnhancedStepCard.tsx** | 5.2KB | ScenarioOrchestrator, ExecutionPanel | Scenarios | **Move to /features/scenarios** |
| **EnhancedTradeFlowDiagram.tsx** | 14.7KB | ProfessionalScenarioRunner | Scenarios | **Move to /features/scenarios** |
| **MetricsSidebar.tsx** | 7.5KB | ScenarioOrchestrator, ExecutionPanel | Scenarios | **Move to /features/scenarios** |
| **ProfessionalScenarioRunner.tsx** | 24.6KB | ScenariosPage | Scenarios | **DELETE (superseded)** |
| **ProgressDashboard.tsx** | 8.2KB | ScenarioOrchestrator, ExecutionPanel | Scenarios | **Move to /features/scenarios** |
| **ReplacementSellerFinder.tsx.disabled** | 17.9KB | NONE (disabled) | Trade Ops | **DELETE (unused)** |
| **ScenarioBuilder.tsx** | 9.6KB | ScenarioOrchestrator | Scenarios | **Move to /features/scenarios** |
| **ScenarioSelectorModal.tsx** | 8.2KB | ProfessionalScenarioRunner | Scenarios | **Move to /features/scenarios** |
| **SimplifiedScenarioRunner.tsx** | 20.7KB | NONE | Scenarios | **DELETE (unused)** |
| **StepContextPanel.tsx** | 7.7KB | ProfessionalScenarioRunner | Scenarios | **Move to /features/scenarios** |
| **TradeCreationWizard.tsx** | 15.6KB | OperationsPage | Trade Ops | **Move to /features/trade-operations** |
| **TradeFlowDiagram.tsx** | 13.7KB | SimplifiedScenarioRunner, ScenarioOrchestrator | Scenarios | **Move to /features/scenarios** |
| **TradeOperationsTable.tsx** | 12.3KB | OperationsPage | Trade Ops | **Move to /features/trade-operations** |

### 📁 Subdirectories

| Directory | Contents | Action |
|-----------|----------|--------|
| **common/** | Shared UI components | Keep as shared |
| **forms/** | Form components | Keep as shared |
| **layout/** | Layout components (AppLayout, etc.) | Keep as shared |

---

## 🎯 Reorganization Plan

### Phase 4.1: Move Scenario Components
**Target:** `/features/scenarios/components/shared/`

Components to move:
- ✅ DatabaseStatePanel.tsx
- ✅ EnhancedStepCard.tsx
- ✅ EnhancedTradeFlowDiagram.tsx
- ✅ MetricsSidebar.tsx
- ✅ ProgressDashboard.tsx
- ✅ ScenarioBuilder.tsx
- ✅ ScenarioSelectorModal.tsx
- ✅ StepContextPanel.tsx
- ✅ TradeFlowDiagram.tsx

### Phase 4.2: Move Trade Operation Components
**Target:** `/features/trade-operations/components/`

Components to move:
- ✅ TradeCreationWizard.tsx
- ✅ TradeOperationsTable.tsx

### Phase 4.3: Delete Obsolete Components

Components to delete:
- ❌ ProfessionalScenarioRunner.tsx (superseded by /features/scenarios/components/ProfessionalScenarioRunner/)
- ❌ SimplifiedScenarioRunner.tsx (unused - no imports found)
- ❌ ReplacementSellerFinder.tsx.disabled (disabled and unused)

### Phase 4.4: Update Import Paths

Files that need import updates:
- ✅ `/features/scenarios/components/ProfessionalScenarioRunner/ProfessionalScenarioRunner.tsx`
- ✅ `/features/scenarios/components/ScenarioOrchestrator/ScenarioOrchestrator.tsx`
- ✅ `/features/scenarios/components/ScenarioOrchestrator/panels/ExecutionPanel.tsx`
- ✅ `/pages/OperationsPage.tsx`

---

## 📋 Detailed Component Analysis

### Scenario Components (9 files)

**DatabaseStatePanel.tsx**
- Purpose: Shows database state during scenario execution (users, listings, trades, etc.)
- Used by: ProfessionalScenarioRunner, ScenarioOrchestrator
- Domain: Scenarios testing
- Move to: `/features/scenarios/components/shared/`

**EnhancedStepCard.tsx**
- Purpose: Display card for individual scenario execution steps
- Used by: ScenarioOrchestrator, ExecutionPanel
- Domain: Scenarios testing
- Move to: `/features/scenarios/components/shared/`

**EnhancedTradeFlowDiagram.tsx**
- Purpose: Visual trade flow diagram with enhanced features
- Used by: ProfessionalScenarioRunner
- Domain: Scenarios testing
- Move to: `/features/scenarios/components/shared/`

**MetricsSidebar.tsx**
- Purpose: Real-time metrics during scenario execution
- Used by: ScenarioOrchestrator, ExecutionPanel
- Domain: Scenarios testing
- Move to: `/features/scenarios/components/shared/`

**ProgressDashboard.tsx**
- Purpose: Scenario execution progress tracking
- Used by: ScenarioOrchestrator, ExecutionPanel
- Domain: Scenarios testing
- Move to: `/features/scenarios/components/shared/`

**ScenarioBuilder.tsx**
- Purpose: UI for building custom scenarios
- Used by: ScenarioOrchestrator
- Domain: Scenarios testing
- Move to: `/features/scenarios/components/shared/`

**ScenarioSelectorModal.tsx**
- Purpose: Modal for selecting predefined scenarios
- Used by: ProfessionalScenarioRunner
- Domain: Scenarios testing
- Move to: `/features/scenarios/components/shared/`

**StepContextPanel.tsx**
- Purpose: Shows context for current scenario step
- Used by: ProfessionalScenarioRunner
- Domain: Scenarios testing
- Move to: `/features/scenarios/components/shared/`

**TradeFlowDiagram.tsx**
- Purpose: Basic trade flow visualization
- Used by: SimplifiedScenarioRunner (unused), ScenarioOrchestrator
- Domain: Scenarios testing
- Move to: `/features/scenarios/components/shared/`

### Trade Operations Components (2 files)

**TradeCreationWizard.tsx**
- Purpose: Multi-step wizard for creating new trade operations
- Used by: OperationsPage
- Domain: Trade operations management
- Move to: `/features/trade-operations/components/`

**TradeOperationsTable.tsx**
- Purpose: Table listing all trade operations with filters
- Used by: OperationsPage
- Domain: Trade operations management
- Move to: `/features/trade-operations/components/`

### Obsolete Components (3 files)

**ProfessionalScenarioRunner.tsx (24.6KB)**
- Status: SUPERSEDED
- Reason: Replaced by `/features/scenarios/components/ProfessionalScenarioRunner/`
- Action: DELETE after confirming new version works
- Currently imported by: ScenariosPage (needs update)

**SimplifiedScenarioRunner.tsx (20.7KB)**
- Status: UNUSED
- Reason: No imports found anywhere in codebase
- Action: DELETE immediately
- Risk: Low (no dependencies)

**ReplacementSellerFinder.tsx.disabled (17.9KB)**
- Status: DISABLED & UNUSED
- Reason: Already disabled with .disabled extension, no imports
- Action: DELETE immediately
- Risk: None (explicitly disabled)

### Shared Components (Keep in place)

**AutoLogin.tsx**
- Purpose: Development helper for auto-authentication
- Used by: App.tsx
- Keep in: `/components/` (dev utility)

**common/**
- Purpose: Shared UI components (Badge, Button, Card, etc.)
- Keep in: `/components/common/`

**forms/**
- Purpose: Reusable form components
- Keep in: `/components/forms/`

**layout/**
- Purpose: Layout components (AppLayout, Header, Sidebar)
- Keep in: `/components/layout/`

---

## 🔄 Migration Strategy

### Step 1: Create Target Directories
```bash
mkdir -p /features/scenarios/components/shared
mkdir -p /features/trade-operations/components
```

### Step 2: Move Scenario Components (9 files)
Move to `/features/scenarios/components/shared/`:
- DatabaseStatePanel.tsx
- EnhancedStepCard.tsx
- EnhancedTradeFlowDiagram.tsx
- MetricsSidebar.tsx
- ProgressDashboard.tsx
- ScenarioBuilder.tsx
- ScenarioSelectorModal.tsx
- StepContextPanel.tsx
- TradeFlowDiagram.tsx

### Step 3: Move Trade Operation Components (2 files)
Move to `/features/trade-operations/components/`:
- TradeCreationWizard.tsx
- TradeOperationsTable.tsx

### Step 4: Update All Import Paths
Update imports in:
- ProfessionalScenarioRunner.tsx (new version)
- ScenarioOrchestrator.tsx
- ExecutionPanel.tsx
- OperationsPage.tsx
- Any other files that reference moved components

### Step 5: Delete Obsolete Components (3 files)
Delete:
- components/ProfessionalScenarioRunner.tsx
- components/SimplifiedScenarioRunner.tsx
- components/ReplacementSellerFinder.tsx.disabled

### Step 6: Create Barrel Exports
Create index.ts files for clean imports:
- `/features/scenarios/components/shared/index.ts`
- `/features/trade-operations/components/index.ts`

---

## ✅ Success Criteria

1. All scenario components moved to `/features/scenarios/components/shared/`
2. All trade operation components moved to `/features/trade-operations/components/`
3. All import paths updated correctly
4. Obsolete components deleted
5. No TypeScript errors
6. Application builds successfully
7. All pages render correctly

---

## 📊 Impact Summary

**Before:**
- 15 components in `/components/` (112.9 KB)
- Mixed domains and purposes
- Some unused/obsolete code
- Unclear organization

**After:**
- 4 shared components in `/components/` (AutoLogin + subdirectories)
- 9 scenario components in `/features/scenarios/components/shared/`
- 2 trade operation components in `/features/trade-operations/components/`
- 3 obsolete components deleted (63.2 KB removed)
- Clear feature-based organization
- ~56% reduction in `/components/` directory size
