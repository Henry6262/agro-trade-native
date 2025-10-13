import React, { useState, useEffect } from 'react';
import { simulationApi } from '../services/simulationApi';
import type { ScenarioStep } from '../types/scenario';
import { TradeFlowDiagram } from './TradeFlowDiagram';
import {
  getHappyPathScenario,
  getInspectionFailureScenario,
  getMultiCounterScenario,
  getPartialRejectionScenario,
} from '../scenarios';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

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
  'happy-path': { name: 'Happy Path', steps: getHappyPathScenario() },
  'inspection-failure': { name: 'Inspection Failure', steps: getInspectionFailureScenario() },
  'multi-counter': { name: 'Multi Counter', steps: getMultiCounterScenario() },
  'partial-rejection': { name: 'Partial Rejection', steps: getPartialRejectionScenario() },
};

export const SimplifiedScenarioRunner: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('test-admin@agrotrade.com');
  const [loginPassword, setLoginPassword] = useState('admin123');

  const [selectedScenario, setSelectedScenario] = useState<keyof typeof scenarios>('happy-path');
  const [steps, setSteps] = useState<ScenarioStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoSpeed, setAutoSpeed] = useState(1500);

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

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await simulationApi.login(loginEmail, loginPassword);
      if (response.success) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Load scenario
  useEffect(() => {
    if (selectedScenario) {
      const scenario = scenarios[selectedScenario];
      setSteps(scenario.steps.map((s, i) => ({ ...s, step: i + 1, status: 'pending' })));
      setCurrentStep(0);
      setIsRunning(false);
    }
  }, [selectedScenario]);

  // Auto mode execution
  useEffect(() => {
    if (isAutoMode && isRunning && currentStep < steps.length) {
      const timer = setTimeout(() => {
        executeCurrentStep();
      }, autoSpeed);
      return () => clearTimeout(timer);
    } else if (currentStep >= steps.length) {
      setIsRunning(false);
      setIsAutoMode(false);
    }
  }, [isAutoMode, isRunning, currentStep, steps, autoSpeed]);

  // Execute step
  const executeCurrentStep = async () => {
    if (currentStep >= steps.length) return;

    const step = steps[currentStep];
    const updatedSteps = [...steps];
    updatedSteps[currentStep] = { ...step, status: 'in_progress' };
    setSteps(updatedSteps);

    try {
      const startTime = Date.now();
      let result;

      switch (step.action) {
        case 'createTestUser':
          result = await simulationApi.createTestUser(step.data);
          updateScenarioState(result, step);
          break;
        case 'createSaleListing':
        case 'createSellListing':
          result = await simulationApi.createSaleListing(step.data);
          setScenarioState((prev) => ({
            ...prev,
            saleListings: [...prev.saleListings, result],
          }));
          break;
        case 'createBuyListing':
          result = await simulationApi.createBuyListing(step.data);
          setScenarioState((prev) => ({
            ...prev,
            buyListings: [...prev.buyListings, result],
          }));
          break;
        case 'createTradeOperation':
          result = await simulationApi.createTradeOperation(step.data);
          setScenarioState((prev) => ({
            ...prev,
            tradeOperations: [...prev.tradeOperations, result],
          }));
          break;
        case 'sendNegotiation':
        case 'buyerInitiateNegotiation':
          result = await simulationApi.initiateNegotiation(step.data);
          setScenarioState((prev) => ({
            ...prev,
            negotiations: [...prev.negotiations, result],
          }));
          break;
        case 'sellerAcceptOffer':
        case 'acceptNegotiation':
          result = await simulationApi.respondToNegotiation(step.data);
          break;
        case 'requestInspection':
          result = await simulationApi.requestInspection(step.data);
          setScenarioState((prev) => ({
            ...prev,
            inspections: [...prev.inspections, result],
          }));
          break;
        case 'submitInspection':
          result = await simulationApi.submitInspection(step.data);
          break;
        case 'createTransportRequest':
          result = await simulationApi.createTransportRequest(step.data);
          setScenarioState((prev) => ({
            ...prev,
            transportRequests: [...prev.transportRequests, result],
          }));
          break;
        case 'transporterSubmitBid':
          result = await simulationApi.submitTransportBid(step.data);
          setScenarioState((prev) => ({
            ...prev,
            transportBids: [...prev.transportBids, result],
          }));
          break;
        case 'adminSelectBid':
          result = await simulationApi.acceptTransportBid(step.data);
          break;
        default:
          result = { message: `Action ${step.action} executed` };
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
        error: error.message || 'Unknown error',
      };
      setSteps(updatedSteps);
      setIsRunning(false);
      setIsAutoMode(false);
    }
  };

  const updateScenarioState = (result: any, step: ScenarioStep) => {
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
  };

  const handleStart = () => {
    setIsRunning(true);
    if (isAutoMode) {
      // Auto mode will trigger via useEffect
    } else {
      executeCurrentStep();
    }
  };

  const handleNext = () => {
    if (!isRunning && currentStep < steps.length) {
      setIsRunning(true);
      executeCurrentStep();
    }
  };

  const handleReset = async () => {
    try {
      await simulationApi.cleanupTestData();
      setCurrentStep(0);
      setIsRunning(false);
      setIsAutoMode(false);
      const scenario = scenarios[selectedScenario];
      setSteps(scenario.steps.map((s, i) => ({ ...s, step: i + 1, status: 'pending' })));
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

  // Render step details based on action type
  const renderStepDetails = (step: ScenarioStep) => {
    if (!step.data) return null;

    const getActorIcon = (actor: string) => {
      if (actor === 'farmer') return '👨‍🌾';
      if (actor === 'buyer') return '🏢';
      if (actor === 'transporter') return '🚚';
      if (actor === 'inspector') return '🔍';
      if (actor === 'admin') return '⚙️';
      return '👤';
    };

    const getActorName = (actor: string) => {
      if (actor === 'farmer') return 'Farmer';
      if (actor === 'buyer') return 'Buyer';
      if (actor === 'transporter') return 'Transporter';
      if (actor === 'inspector') return 'Inspector';
      if (actor === 'admin') return 'Admin';
      return actor;
    };

    return (
      <div className="space-y-4">
        {/* Actor Info */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">{getActorIcon(step.actor)}</span>
          <div>
            <div className="text-2xl font-bold text-gray-800">
              {step.data.companyName || step.data.name || getActorName(step.actor)}
            </div>
            <div className="text-sm text-gray-500 capitalize">{step.actor}</div>
          </div>
        </div>

        {/* Action */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-600 font-medium">Action</div>
          <div className="text-lg text-gray-800">
            {step.action.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        </div>

        {/* Product Info */}
        {step.data.productType && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm text-green-600 font-medium">📦 Product</div>
            <div className="text-lg text-gray-800">{step.data.productType}</div>
            {step.data.quantity && (
              <div className="text-sm text-gray-600 mt-1">
                {step.data.quantity} {step.data.unit || 'tons'}
              </div>
            )}
          </div>
        )}

        {/* Price Info */}
        {(step.data.pricePerTon || step.data.maxPricePerTon || step.data.offeredPrice) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-600 font-medium">💰 Price</div>
            <div className="text-lg text-gray-800">
              ${step.data.pricePerTon || step.data.maxPricePerTon || step.data.offeredPrice}/ton
            </div>
          </div>
        )}

        {/* Location Info */}
        {step.data.location?.address && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-sm text-purple-600 font-medium">📍 Location</div>
            <div className="text-lg text-gray-800">{step.data.location.address}</div>
          </div>
        )}

        {/* Quality Score */}
        {step.data.qualityScore && (
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
            <div className="text-sm text-pink-600 font-medium">⭐ Quality Score</div>
            <div className="text-lg text-gray-800">{step.data.qualityScore}/100</div>
            <div className="text-sm text-gray-600 mt-1">
              {step.data.passed ? '✅ Passed' : '❌ Failed'}
            </div>
          </div>
        )}

        {/* Transport Info */}
        {step.data.bidAmount && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-sm text-orange-600 font-medium">🚛 Transport Bid</div>
            <div className="text-lg text-gray-800">${step.data.bidAmount}</div>
            {step.data.estimatedHours && (
              <div className="text-sm text-gray-600 mt-1">
                ETA: {step.data.estimatedHours} hours
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {step.data.notes && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm text-gray-600 font-medium">📝 Notes</div>
            <div className="text-sm text-gray-700 mt-1">{step.data.notes}</div>
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 w-96">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = steps.length > 0 ? ((currentStep) / steps.length) * 100 : 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Agro-Trade Scenario Testing</h1>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as keyof typeof scenarios)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isRunning}
            >
              {Object.entries(scenarios).map(([key, { name }]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAutoMode}
                onChange={(e) => setIsAutoMode(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Auto Mode</span>
            </label>

            {isAutoMode && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Speed:</label>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="500"
                  value={autoSpeed}
                  onChange={(e) => setAutoSpeed(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-gray-600">{autoSpeed}ms</span>
              </div>
            )}

            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleStart}
                disabled={isRunning || currentStep >= steps.length}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                {isRunning ? 'Running...' : 'Start'}
              </button>

              {!isAutoMode && (
                <button
                  onClick={handleNext}
                  disabled={isRunning || currentStep >= steps.length}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  <SkipForward size={18} />
                  Next Step
                </button>
              )}

              <button
                onClick={handleReset}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Step {currentStep} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Trade Flow Diagram */}
        <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden">
          <TradeFlowDiagram scenarioState={scenarioState} currentPhase="" />
        </div>

        {/* Current Step Details */}
        <div className="w-96 bg-white rounded-lg shadow-md p-6 overflow-y-auto">
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Current Step</div>
            <div className="text-3xl font-bold text-gray-800">
              {currentStep + 1} / {steps.length}
            </div>
          </div>

          {currentStepData ? (
            <>
              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    currentStepData.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : currentStepData.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : currentStepData.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {currentStepData.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Step Details */}
              {renderStepDetails(currentStepData)}

              {/* Error Display */}
              {currentStepData.error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm text-red-600 font-medium">❌ Error</div>
                  <div className="text-sm text-red-800 mt-1">{currentStepData.error}</div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              {currentStep >= steps.length ? (
                <div>
                  <div className="text-4xl mb-2">✅</div>
                  <div className="font-medium">Scenario Complete!</div>
                </div>
              ) : (
                <div>Select a scenario and click Start</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
