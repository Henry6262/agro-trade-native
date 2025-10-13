import React, { useState, useEffect, useCallback } from 'react';
import { simulationApi } from '../services/simulationApi';
import { scenarioContext } from '../services/scenarioContext';
import type { ScenarioStep } from '../types/scenario';
import { EnhancedTradeFlowDiagram } from './EnhancedTradeFlowDiagram';
import { StepContextPanel } from './StepContextPanel';
import { ScenarioSelectorModal } from './ScenarioSelectorModal';
import { DatabaseStatePanel } from './DatabaseStatePanel';
import {
  getHappyPathScenario,
  getInspectionFailureScenario,
  getMultiCounterScenario,
  getPartialRejectionScenario,
  getQualityDisputeScenario,
  getRushOrderScenario,
  getTransportBiddingScenario,
  getMultiBuyerScenario,
} from '../scenarios';
import { Play, Pause, RotateCcw, ChevronRight, Zap, Grid } from 'lucide-react';

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
    // Other entities are tracked by context manager, update UI state if needed
  }, []);

  // Execute current step
  const executeCurrentStep = async () => {
    if (currentStep >= steps.length) return;

    const step = steps[currentStep];
    const updatedSteps = [...steps];
    updatedSteps[currentStep] = { ...step, status: 'in_progress' };
    setSteps(updatedSteps);

    try {
      const startTime = Date.now();
      let result;

      // Get the data/payload (normalize field name)
      const stepData = step.data || step.payload;

      // Execute based on action type - simplified with context manager
      switch (step.action) {
        case 'createTestUser':
          // API expects (role, name, data) as separate params
          result = await simulationApi.createTestUser(
            stepData.role,
            stepData.name,
            stepData.data
          );
          // Store in context
          scenarioContext.addUser(result.role, result);
          updateScenarioState(result, step);
          break;

        case 'createSaleListing':
        case 'createSellListing':
        case 'createFarmerSaleListing':
          // simulationApi.createSaleListing now handles context resolution
          result = await simulationApi.createSaleListing(stepData);
          setScenarioState((prev) => ({
            ...prev,
            saleListings: [...prev.saleListings, result],
          }));
          break;

        case 'createBuyListing':
          result = await simulationApi.createBuyListing(stepData);
          setScenarioState((prev) => ({
            ...prev,
            buyListings: [...prev.buyListings, result],
          }));
          break;

        case 'createTradeOperation':
          result = await simulationApi.createTradeOperation(stepData);
          setScenarioState((prev) => ({
            ...prev,
            tradeOperations: [...prev.tradeOperations, result],
          }));
          break;

        case 'sendNegotiation':
        case 'buyerInitiateNegotiation':
        case 'sendOffers':
          result = await simulationApi.initiateNegotiation(stepData);
          setScenarioState((prev) => ({
            ...prev,
            negotiations: [...prev.negotiations, result],
          }));
          break;

        case 'sellerAcceptOffer':
        case 'acceptNegotiation':
        case 'acceptOffer':
        case 'farmerAccept':
          result = await simulationApi.respondToNegotiation({
            ...stepData,
            response: 'accept'
          });
          break;

        case 'farmerReject':
          result = await simulationApi.respondToNegotiation({
            ...stepData,
            response: 'reject'
          });
          break;

        case 'farmerCounter':
          result = await simulationApi.respondToNegotiation({
            ...stepData,
            response: 'counter'
          });
          break;

        case 'requestInspection':
        case 'assignInspector':
          result = await simulationApi.requestInspection(stepData);
          setScenarioState((prev) => ({
            ...prev,
            inspections: [...prev.inspections, result],
          }));
          break;

        case 'submitInspection':
        case 'submitResults':
        case 'inspectorVerify':
          result = await simulationApi.submitInspection({
            ...stepData,
            result: 'PASSED'
          });
          break;

        case 'inspectorFail':
          result = await simulationApi.submitInspection({
            ...stepData,
            result: 'FAILED'
          });
          break;

        case 'createTransportRequest':
        case 'createTransport':
          result = await simulationApi.createTransportRequest(stepData);
          setScenarioState((prev) => ({
            ...prev,
            transportRequests: [...prev.transportRequests, result],
          }));
          break;

        case 'transporterSubmitBid':
        case 'submitTransportBid':
        case 'transporterBid':
          result = await simulationApi.submitTransportBid(stepData);
          setScenarioState((prev) => ({
            ...prev,
            transportBids: [...prev.transportBids, result],
          }));
          break;

        case 'adminSelectBid':
        case 'selectTransportBid':
        case 'acceptBid':
        case 'acceptTransportBid':
          result = await simulationApi.acceptTransportBid(stepData);
          break;

        case 'transporterStartJob':
        case 'startTransport':
          const transporter = scenarioContext.getUser('TRANSPORTER', stepData.transporterIndex || 0);
          const job = scenarioContext.getLatestEntity('transportJobs');
          if (transporter && job) {
            result = await simulationApi.transporter.startJob(transporter.id, job.id);
          } else {
            throw new Error('Transporter or job not found in context');
          }
          break;

        case 'transporterComplete':
        case 'completeDelivery':
        case 'transporterDeliver':
        case 'markDelivered':
          const transporter2 = scenarioContext.getUser('TRANSPORTER', stepData.transporterIndex || 0);
          const job2 = scenarioContext.getLatestEntity('transportJobs');
          if (transporter2 && job2) {
            result = await simulationApi.transporter.completeDelivery(
              transporter2.id,
              job2.id,
              stepData.notes || 'Delivery completed successfully'
            );
          } else {
            throw new Error('Transporter or job not found in context');
          }
          setScenarioState((prev) => ({
            ...prev,
            transportJobs: [...prev.transportJobs, { status: 'delivered' }],
          }));
          break;

        case 'completeTrade':
        case 'finalizeTrade':
        case 'closeTrade':
          const tradeOp = scenarioContext.getCurrentTradeOperation();
          if (tradeOp) {
            result = await simulationApi.admin.completeTrade(tradeOp.id);
          } else {
            throw new Error('Trade operation not found in context');
          }
          break;

        // Additional dispute and resolution actions
        case 'raiseDispute':
        case 'reportIssue':
          result = { message: `Dispute raised: ${stepData?.reason || 'Quality issue'}` };
          break;

        case 'resolveDispute':
        case 'adminResolve':
          result = { message: 'Dispute resolved by admin' };
          break;

        // Buyer-specific actions
        case 'buyerAccept':
          result = await simulationApi.respondToNegotiation({
            ...stepData,
            response: 'accept'
          });
          break;

        case 'buyerReject':
          result = await simulationApi.respondToNegotiation({
            ...stepData,
            response: 'reject'
          });
          break;

        // Admin intervention actions
        case 'adminIntervene':
        case 'adminFindSellers':
        case 'adminSourceMore':
          result = { message: 'Admin intervention completed' };
          break;

        default:
          console.warn(`Unhandled action: ${step.action}`, stepData);
          result = { message: `Action ${step.action} executed (simulated)` };
      }

      const duration = Date.now() - startTime;
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-96">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🌾</div>
            <h1 className="text-2xl font-bold text-gray-800">Agro-Trade Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Scenario Testing Platform</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isAuthenticating ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
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

      {/* Minimal Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-800">Scenario Testing</h1>

              {/* Scenario Selection Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Grid size={18} />
                <span className="font-semibold">{scenarios[selectedScenario].name}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {scenarios[selectedScenario].steps.length} steps
                </span>
              </button>

              <span className="text-sm text-gray-600 italic">
                {scenarios[selectedScenario].description}
              </span>
            </div>

            {/* Clean Control Panel */}
            <div className="flex items-center gap-3">
              {/* Execution Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setExecutionMode('manual')}
                  className={`px-3 py-1 text-sm font-medium rounded transition ${
                    executionMode === 'manual'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Manual
                </button>
                <button
                  onClick={() => setExecutionMode('auto')}
                  className={`px-3 py-1 text-sm font-medium rounded transition ${
                    executionMode === 'auto'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Auto
                </button>
              </div>

              {/* Speed Control (only in auto mode) */}
              {executionMode === 'auto' && (
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-gray-500" />
                  <input
                    type="range"
                    min="500"
                    max="3000"
                    step="500"
                    value={executionSpeed}
                    onChange={(e) => setExecutionSpeed(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-xs text-gray-500 w-12">{executionSpeed / 1000}s</span>
                </div>
              )}

              {/* Action Buttons */}
              {!isRunning && !isComplete && (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Play size={16} />
                  <span className="text-sm font-medium">Start</span>
                </button>
              )}

              {isRunning && executionMode === 'auto' && (
                <button
                  onClick={() => setIsRunning(false)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  <Pause size={16} />
                  <span className="text-sm font-medium">Pause</span>
                </button>
              )}

              {!isRunning && executionMode === 'manual' && currentStep < steps.length && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <ChevronRight size={16} />
                  <span className="text-sm font-medium">Next Step</span>
                </button>
              )}

              <button
                onClick={handleReset}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition"
              >
                <RotateCcw size={16} />
                <span className="text-sm font-medium">Reset</span>
              </button>

              {/* View Toggle Buttons */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('flow')}
                  className={`px-3 py-1 text-sm font-medium rounded transition ${
                    activeView === 'flow'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🔄 Flow
                </button>
                <button
                  onClick={() => setActiveView('database')}
                  className={`px-3 py-1 text-sm font-medium rounded transition ${
                    activeView === 'database'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🗄️ Database
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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