import React, { useState, useEffect, useCallback } from 'react';
import { simulationApi } from '../../../../services/simulationApi';
import { scenarioContext } from '../../../../services/scenarioContext';
import type { ScenarioStep } from '../../../../types/scenario';
import { EnhancedTradeFlowDiagram } from '../shared/EnhancedTradeFlowDiagram';
import { StepContextPanel } from '../shared/StepContextPanel';
import { ScenarioSelectorModal } from '../shared/ScenarioSelectorModal';
import { DatabaseStatePanel } from '../shared/DatabaseStatePanel';
import {
  getHappyPathScenario,
  getInspectionFailureScenario,
  getMultiCounterScenario,
  getPartialRejectionScenario,
  getQualityDisputeScenario,
  getRushOrderScenario,
  getTransportBiddingScenario,
  getMultiBuyerScenario,
} from '../../../../scenarios';
import { LoginPanel, ControlsPanel } from './panels';
import { stepExecutor } from './services/stepExecutor';

interface ScenarioState {
  createdUsers: {
    farmers: any[];
    buyers: any[];
    transporters: any[];
    inspector: any | null;
  };
  saleListings: any[];
  buyListings: any[];
  tradeOperations: any[];
  negotiations: any[];
  inspections: any[];
  transportRequests: any[];
  transportBids: any[];
  transportJobs: any[];
}

const scenarios = {
  'happy-path': {
    name: 'Happy Path',
    description: 'Complete successful trade from start to finish',
    steps: getHappyPathScenario()
  },
  'inspection-failure': {
    name: 'Inspection Failure',
    description: 'Handles inspection failure and re-negotiation',
    steps: getInspectionFailureScenario()
  },
  'multi-counter': {
    name: 'Multi Counter',
    description: 'Multiple counter-offers between parties',
    steps: getMultiCounterScenario()
  },
  'partial-rejection': {
    name: 'Partial Rejection',
    description: 'Some sellers reject, requiring additional sourcing',
    steps: getPartialRejectionScenario()
  },
  'quality-dispute': {
    name: 'Quality Dispute',
    description: 'Disagreement over product quality requires resolution',
    steps: getQualityDisputeScenario()
  },
  'rush-order': {
    name: 'Rush Order',
    description: 'Expedited order with tight deadlines',
    steps: getRushOrderScenario()
  },
  'transport-bidding': {
    name: 'Transport Bidding',
    description: 'Multiple transporters bid on delivery job',
    steps: getTransportBiddingScenario()
  },
  'multi-buyer': {
    name: 'Multi Buyer',
    description: 'Multiple buyers competing for same listings',
    steps: getMultiBuyerScenario()
  },
};

export const ProfessionalScenarioRunner: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('test-admin@agrotrade.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [selectedScenario, setSelectedScenario] = useState<keyof typeof scenarios>('happy-path');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [steps, setSteps] = useState<ScenarioStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [executionMode, setExecutionMode] = useState<'manual' | 'auto'>('manual');
  const [executionSpeed, setExecutionSpeed] = useState(1500);
  const [activeView, setActiveView] = useState<'flow' | 'database'>('flow');

  const [scenarioState, setScenarioState] = useState<ScenarioState>({
    createdUsers: { farmers: [], buyers: [], transporters: [], inspector: null },
    saleListings: [],
    buyListings: [],
    tradeOperations: [],
    negotiations: [],
    inspections: [],
    transportRequests: [],
    transportBids: [],
    transportJobs: [],
  });

  // Authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      const response = await simulationApi.login(loginEmail, loginPassword);
      if (response.success) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handler for scenario selection
  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId as keyof typeof scenarios);
    setIsModalOpen(false);
  };

  // Load scenario
  useEffect(() => {
    const scenario = scenarios[selectedScenario];

    // Reset context when loading new scenario
    scenarioContext.clear();

    setSteps(scenario.steps.map((s, i) => ({
      ...s,
      step: i + 1,
      status: 'pending',
      data: s.payload || s.data // Normalize data field
    })));
    setCurrentStep(0);
    setIsRunning(false);
  }, [selectedScenario]);

  // Auto execution
  useEffect(() => {
    if (executionMode === 'auto' && isRunning && currentStep < steps.length) {
      const timer = setTimeout(() => {
        executeCurrentStep();
      }, executionSpeed);
      return () => clearTimeout(timer);
    } else if (currentStep >= steps.length) {
      setIsRunning(false);
    }
  }, [executionMode, isRunning, currentStep, steps, executionSpeed]);

  // Update scenario state based on results
  const updateScenarioState = useCallback((result: any, step: ScenarioStep) => {
    if (!result) return;

    // User creation - already handled by simulationApi, but sync local state
    if (step.action === 'createTestUser') {
      // Context manager already has the user, just update local UI state
      if (result.role === 'FARMER' || result.role === 'SELLER') {
        setScenarioState((prev) => ({
          ...prev,
          createdUsers: {
            ...prev.createdUsers,
            farmers: [...prev.createdUsers.farmers, result],
          },
        }));
      } else if (result.role === 'BUYER') {
        setScenarioState((prev) => ({
          ...prev,
          createdUsers: {
            ...prev.createdUsers,
            buyers: [...prev.createdUsers.buyers, result],
          },
        }));
      } else if (result.role === 'TRANSPORTER') {
        setScenarioState((prev) => ({
          ...prev,
          createdUsers: {
            ...prev.createdUsers,
            transporters: [...prev.createdUsers.transporters, result],
          },
        }));
      } else if (result.role === 'INSPECTOR') {
        setScenarioState((prev) => ({
          ...prev,
          createdUsers: {
            ...prev.createdUsers,
            inspector: result,
          },
        }));
      }
    }

    // Update UI state for other entity types
    if (step.action.includes('SaleListing') || step.action.includes('SellListing')) {
      setScenarioState((prev) => ({
        ...prev,
        saleListings: [...prev.saleListings, result],
      }));
    } else if (step.action.includes('BuyListing')) {
      setScenarioState((prev) => ({
        ...prev,
        buyListings: [...prev.buyListings, result],
      }));
    } else if (step.action.includes('TradeOperation')) {
      setScenarioState((prev) => ({
        ...prev,
        tradeOperations: [...prev.tradeOperations, result],
      }));
    } else if (step.action.includes('Negotiation') || step.action.includes('Offer')) {
      setScenarioState((prev) => ({
        ...prev,
        negotiations: [...prev.negotiations, result],
      }));
    } else if (step.action.includes('Inspection')) {
      setScenarioState((prev) => ({
        ...prev,
        inspections: [...prev.inspections, result],
      }));
    } else if (step.action.includes('TransportRequest') || step.action === 'createTransport') {
      setScenarioState((prev) => ({
        ...prev,
        transportRequests: [...prev.transportRequests, result],
      }));
    } else if (step.action.includes('Bid')) {
      setScenarioState((prev) => ({
        ...prev,
        transportBids: [...prev.transportBids, result],
      }));
    } else if (step.action.includes('Deliver') || step.action.includes('Complete')) {
      setScenarioState((prev) => ({
        ...prev,
        transportJobs: [...prev.transportJobs, { status: 'delivered' }],
      }));
    }
  }, []);

  // Execute current step
  const executeCurrentStep = async () => {
    if (currentStep >= steps.length) return;

    const step = steps[currentStep];
    const updatedSteps = [...steps];
    updatedSteps[currentStep] = { ...step, status: 'in_progress' };
    setSteps(updatedSteps);

    try {
      const { result, duration } = await stepExecutor.execute(step);
      updateScenarioState(result, step);

      updatedSteps[currentStep] = {
        ...step,
        status: 'completed',
        result,
        duration,
      };
      setSteps(updatedSteps);
      setCurrentStep((prev) => prev + 1);

    } catch (error: any) {
      updatedSteps[currentStep] = {
        ...step,
        status: 'failed',
        error: error.message || 'Unknown error occurred',
      };
      setSteps(updatedSteps);
      setIsRunning(false);
    }
  };

  // Control handlers
  const handleStart = () => {
    setIsRunning(true);
    if (executionMode === 'manual') {
      executeCurrentStep();
    }
  };

  const handleNext = () => {
    if (!isRunning && currentStep < steps.length) {
      executeCurrentStep();
    }
  };

  const handleReset = async () => {
    try {
      await simulationApi.cleanupTestData();
      // Clear context on manual reset
      scenarioContext.clear();
      setCurrentStep(0);
      setIsRunning(false);
      const scenario = scenarios[selectedScenario];
      setSteps(scenario.steps.map((s, i) => ({
        ...s,
        step: i + 1,
        status: 'pending',
        data: s.payload || s.data
      })));
      setScenarioState({
        createdUsers: { farmers: [], buyers: [], transporters: [], inspector: null },
        saleListings: [],
        buyListings: [],
        tradeOperations: [],
        negotiations: [],
        inspections: [],
        transportRequests: [],
        transportBids: [],
        transportJobs: [],
      });
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <LoginPanel
        loginEmail={loginEmail}
        loginPassword={loginPassword}
        isAuthenticating={isAuthenticating}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onSubmit={handleLogin}
      />
    );
  }

  const currentStepData = steps[currentStep];
  const isComplete = currentStep >= steps.length && steps.length > 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Scenario Selector Modal */}
      <ScenarioSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleScenarioSelect}
        currentScenarioId={selectedScenario}
      />

      {/* Header with Controls */}
      <ControlsPanel
        selectedScenario={selectedScenario}
        scenarioName={scenarios[selectedScenario].name}
        scenarioDescription={scenarios[selectedScenario].description}
        stepsCount={scenarios[selectedScenario].steps.length}
        isRunning={isRunning}
        isComplete={isComplete}
        currentStep={currentStep}
        totalSteps={steps.length}
        executionMode={executionMode}
        executionSpeed={executionSpeed}
        activeView={activeView}
        onOpenScenarioModal={() => setIsModalOpen(true)}
        onExecutionModeChange={setExecutionMode}
        onExecutionSpeedChange={setExecutionSpeed}
        onActiveViewChange={setActiveView}
        onStart={handleStart}
        onPause={() => setIsRunning(false)}
        onNext={handleNext}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {activeView === 'flow' ? (
          <>
            {/* Trade Flow Diagram (70% width) */}
            <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
              <EnhancedTradeFlowDiagram
                scenarioState={scenarioState}
                currentPhase={currentStepData?.action || ''}
              />
            </div>

            {/* Context Panel (30% width) */}
            <div className="w-96 bg-white rounded-xl shadow-sm p-6 overflow-hidden">
              <StepContextPanel
                step={currentStepData}
                stepNumber={currentStep + 1}
                totalSteps={steps.length}
                isComplete={isComplete}
              />
            </div>
          </>
        ) : (
          /* Database View */
          <div className="flex-1 bg-white rounded-xl shadow-sm overflow-auto">
            <DatabaseStatePanel
              scenarioState={scenarioState}
              onRefresh={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};
