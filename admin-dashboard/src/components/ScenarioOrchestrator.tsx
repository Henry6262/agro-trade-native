import React, { useState, useEffect } from 'react';
import { simulationApi, scenarioContext } from '../services/simulationApi';
import type { UserRole, SimulationUser } from '../services/simulationApi';
import type { ScenarioStep } from '../types/scenario';
import {
  getHappyPathScenario,
  getInspectionFailureScenario,
  getMultiCounterScenario,
  getPartialRejectionScenario,
  getTransportBiddingScenario,
  getRushOrderScenario,
  getQualityDisputeScenario,
  getMultiBuyerScenario,
} from '../scenarios';
import { ProgressDashboard } from './ProgressDashboard';
import { EnhancedStepCard } from './EnhancedStepCard';
import { MetricsSidebar } from './MetricsSidebar';
import { TradeFlowDiagram } from './TradeFlowDiagram';
import { DatabaseStatePanel } from './DatabaseStatePanel';
import { ScenarioBuilder } from './ScenarioBuilder';

// Tracked entity state
interface ScenarioState {
  createdUsers: {
    farmers: SimulationUser[];
    buyers: SimulationUser[];
    transporters: SimulationUser[];
    inspector: SimulationUser | null;
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

export const ScenarioOrchestrator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('test-admin@agrotrade.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [executionMode, setExecutionMode] = useState<'auto' | 'step'>('step');
  const [currentStep, setCurrentStep] = useState(0);
  const [scenarioSteps, setScenarioSteps] = useState<ScenarioStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [autoRunSpeed, setAutoRunSpeed] = useState(1000); // milliseconds between steps
  const [activeView, setActiveView] = useState<'execution' | 'flow' | 'database' | 'builder'>('execution');

  // Scenario state tracking
  const [scenarioState, setScenarioState] = useState<ScenarioState>({
    createdUsers: {
      farmers: [],
      buyers: [],
      transporters: [],
      inspector: null,
    },
    saleListings: [],
    buyListings: [],
    tradeOperations: [],
    negotiations: [],
    inspections: [],
    transportRequests: [],
    transportBids: [],
    transportJobs: [],
  });

  const [users, setUsers] = useState<{
    buyers: SimulationUser[];
    farmers: SimulationUser[];
    transporters: SimulationUser[];
    inspectors: SimulationUser[];
  }>({
    buyers: [],
    farmers: [],
    transporters: [],
    inspectors: [],
  });

  // Login handler
  const handleLogin = async () => {
    try {
      setLoginError('');
      await simulationApi.auth.login(loginEmail, loginPassword);
      setIsAuthenticated(true);
      loadUsers();
    } catch (error: any) {
      setLoginError(error.response?.data?.message || 'Login failed');
    }
  };

  // Load all users by role
  const loadUsers = async () => {
    try {
      const [buyers, farmers, transporters, inspectors] = await Promise.all([
        simulationApi.getUsersByRole('BUYER'),
        simulationApi.getUsersByRole('FARMER'),
        simulationApi.getUsersByRole('TRANSPORTER'),
        simulationApi.getUsersByRole('INSPECTOR'),
      ]);

      setUsers({ buyers, farmers, transporters, inspectors });

      // Sync with scenarioContext
      scenarioContext.setUsers({ buyers, farmers, transporters, inspectors });
      console.log('[ScenarioOrchestrator] Synced users with context:', scenarioContext.getStats());
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  // Reset scenario state
  const resetScenarioState = () => {
    setScenarioState({
      createdUsers: {
        farmers: [],
        buyers: [],
        transporters: [],
        inspector: null,
      },
      saleListings: [],
      buyListings: [],
      tradeOperations: [],
      negotiations: [],
      inspections: [],
      transportRequests: [],
      transportBids: [],
      transportJobs: [],
    });
    setCurrentStep(0);
  };

  // Scenario loaders
  const loadHappyPathScenario = () => {
    resetScenarioState();
    setScenarioSteps(getHappyPathScenario());
    setSelectedScenario('happy-path');
  };

  const loadInspectionFailureScenario = () => {
    resetScenarioState();
    setScenarioSteps(getInspectionFailureScenario());
    setSelectedScenario('inspection-failure');
  };

  const loadMultiCounterScenario = () => {
    resetScenarioState();
    setScenarioSteps(getMultiCounterScenario());
    setSelectedScenario('multi-counter');
  };

  const loadPartialRejectionScenario = () => {
    resetScenarioState();
    setScenarioSteps([...getPartialRejectionScenario()]);
    setSelectedScenario('partial-rejection');
  };

  const loadTransportBiddingScenario = () => {
    resetScenarioState();
    setScenarioSteps([...getTransportBiddingScenario()]);
    setSelectedScenario('transport-bidding');
  };

  const loadRushOrderScenario = () => {
    resetScenarioState();
    setScenarioSteps([...getRushOrderScenario()]);
    setSelectedScenario('rush-order');
  };

  const loadQualityDisputeScenario = () => {
    resetScenarioState();
    setScenarioSteps([...getQualityDisputeScenario()]);
    setSelectedScenario('quality-dispute');
  };

  const loadMultiBuyerScenario = () => {
    resetScenarioState();
    setScenarioSteps([...getMultiBuyerScenario()]);
    setSelectedScenario('multi-buyer');
  };

  // Execute single step
  const executeStep = async (stepIndex: number) => {
    const step = scenarioSteps[stepIndex];
    if (!step) return;

    setCurrentStep(stepIndex);
    const updatedSteps = [...scenarioSteps];
    updatedSteps[stepIndex].status = 'in_progress';
    setScenarioSteps(updatedSteps);

    const startTime = Date.now();

    try {
      let result;

      switch (step.action) {
        case 'createTestUser':
          result = await handleCreateTestUser(step.payload);
          break;

        case 'createFarmerSaleListing':
          result = await handleCreateFarmerSaleListing(step.payload);
          break;

        case 'createBuyListing':
          result = await handleCreateBuyListing(step.payload);
          break;

        case 'createTradeOperation':
          result = await handleCreateTradeOperation(step.payload);
          break;

        case 'sendOffers':
          result = await handleSendOffers(step.payload);
          break;

        case 'acceptOffer':
          result = await handleAcceptOffer(step.payload);
          break;

        case 'counterOffer':
          result = await handleCounterOffer(step.payload);
          break;

        case 'acceptCounterOffer':
          result = await handleAcceptCounterOffer(step.payload);
          break;

        case 'assignInspector':
          result = await handleAssignInspector(step.payload);
          break;

        case 'submitResults':
          result = await handleSubmitResults(step.payload);
          break;

        case 'createTransport':
          result = await handleCreateTransport(step.payload);
          break;

        case 'completeDelivery':
          result = await handleCompleteDelivery(step.payload);
          break;

        case 'completeTrade':
          result = await handleCompleteTrade(step.payload);
          break;

        case 'rejectOffer':
          result = await handleRejectOffer(step.payload);
          break;

        case 'createTransportRequest':
          result = await handleCreateTransportRequest(step.payload);
          break;

        case 'transporterSubmitBid':
          result = await handleTransporterSubmitBid(step.payload);
          break;

        case 'adminSelectBid':
          result = await handleAdminSelectBid(step.payload);
          break;

        case 'updatePricing':
          result = await handleUpdatePricing(step.payload);
          break;

        default:
          throw new Error(`Unknown action: ${step.action}`);
      }

      const duration = Date.now() - startTime;
      updatedSteps[stepIndex].status = 'completed';
      updatedSteps[stepIndex].result = result;
      updatedSteps[stepIndex].duration = duration;
      setScenarioSteps(updatedSteps);
      setTotalDuration((prev) => prev + duration);

      // Reload users after creating new ones
      if (step.action === 'createTestUser') {
        await loadUsers();
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`Step ${stepIndex} failed:`, error);
      updatedSteps[stepIndex].status = 'failed';
      updatedSteps[stepIndex].result = { error: error.message };
      updatedSteps[stepIndex].error = error.message;
      updatedSteps[stepIndex].duration = duration;
      setScenarioSteps(updatedSteps);
      setTotalDuration((prev) => prev + duration);
    }
  };

  // Action handlers with dynamic payload resolution
  const handleCreateTestUser = async (payload: any) => {
    const user = await simulationApi.createTestUser(
      payload.role,
      payload.name,
      payload.data
    );

    // Track created user
    setScenarioState((prev) => {
      const newState = { ...prev };
      if (payload.role === 'FARMER') {
        newState.createdUsers.farmers.push(user);
      } else if (payload.role === 'BUYER') {
        newState.createdUsers.buyers.push(user);
      } else if (payload.role === 'TRANSPORTER') {
        newState.createdUsers.transporters.push(user);
      } else if (payload.role === 'INSPECTOR') {
        newState.createdUsers.inspector = user;
      }
      return newState;
    });

    return { user, message: `Created ${payload.role}: ${user.name || user.email}` };
  };

  const handleCreateFarmerSaleListing = async (payload: any) => {
    const farmer = scenarioState.createdUsers.farmers[payload.farmerIndex];
    if (!farmer) {
      throw new Error(`Farmer at index ${payload.farmerIndex} not found`);
    }

    const listing = await simulationApi.admin.createFarmerSaleListing(farmer.id, {
      productCategory: payload.productCategory,
      quantity: payload.quantity,
      pricePerUnit: payload.pricePerUnit,
      latitude: payload.latitude,
      longitude: payload.longitude,
    });

    // Track sale listing
    setScenarioState((prev) => ({
      ...prev,
      saleListings: [...prev.saleListings, listing],
    }));

    return {
      listing,
      message: `Created sale listing for ${farmer.name}: ${payload.quantity} tons @ €${payload.pricePerUnit}/ton`,
    };
  };

  const handleCreateBuyListing = async (payload: any) => {
    const buyerIndex = payload.buyerIndex !== undefined ? payload.buyerIndex : 0;
    const buyer = scenarioState.createdUsers.buyers[buyerIndex];
    if (!buyer) {
      throw new Error(`Buyer at index ${buyerIndex} not created yet`);
    }

    const listing = await simulationApi.buyer.createListing(buyer.id, {
      productId: payload.productCategory,
      quantity: payload.quantity,
      unit: payload.unit,
      maxPricePerUnit: payload.maxPricePerUnit,
    });

    // Track buy listing
    setScenarioState((prev) => ({
      ...prev,
      buyListings: [...prev.buyListings, listing],
    }));

    return {
      listing,
      message: `Created buy listing: ${payload.quantity} tons, max €${payload.maxPricePerUnit}/ton`,
    };
  };

  const handleCreateTradeOperation = async (payload: any) => {
    const buyListingIndex = payload.buyListingIndex !== undefined ? payload.buyListingIndex : 0;
    const buyListing = scenarioState.buyListings[buyListingIndex];
    if (!buyListing) {
      throw new Error(`Buy listing at index ${buyListingIndex} not created yet`);
    }

    const operation = await simulationApi.admin.createTradeOperation({
      buyListingId: buyListing.id,
      adminMargin: payload.adminMargin,
      buyerCommission: payload.buyerCommission,
      sellerCommission: payload.sellerCommission,
    });

    // Track trade operation
    setScenarioState((prev) => ({
      ...prev,
      tradeOperations: [...prev.tradeOperations, operation],
    }));

    return {
      operation,
      message: `Created trade operation with ${payload.adminMargin}% margin`,
    };
  };

  const handleSendOffers = async (payload: any) => {
    const tradeOpIndex = payload.tradeOpIndex !== undefined ? payload.tradeOpIndex : 0;
    const tradeOperation = scenarioState.tradeOperations[tradeOpIndex];
    if (!tradeOperation) {
      throw new Error(`Trade operation at index ${tradeOpIndex} not created yet`);
    }

    const offers = payload.offers.map((offer: any) => {
      const farmer = scenarioState.createdUsers.farmers[offer.farmerIndex];
      const saleListing = scenarioState.saleListings[offer.farmerIndex];

      if (!farmer || !saleListing) {
        throw new Error(`Farmer or sale listing at index ${offer.farmerIndex} not found`);
      }

      return {
        farmerId: farmer.id,
        saleListingId: saleListing.id,
        requestedQuantity: offer.requestedQuantity,
        offeredPrice: offer.offeredPrice,
      };
    });

    const result = await simulationApi.admin.sendOffers({
      tradeOperationId: tradeOperation.id,
      offers,
    });

    // Track negotiations
    setScenarioState((prev) => ({
      ...prev,
      negotiations: [...prev.negotiations, ...result.negotiations],
    }));

    return {
      result,
      message: `Sent ${offers.length} offers to farmers`,
    };
  };

  const handleAcceptOffer = async (payload: any) => {
    const farmer = scenarioState.createdUsers.farmers[payload.farmerIndex];
    const negotiation = scenarioState.negotiations[payload.negotiationIndex];

    if (!farmer) {
      throw new Error(`Farmer at index ${payload.farmerIndex} not found`);
    }

    if (!negotiation) {
      throw new Error(`Negotiation at index ${payload.negotiationIndex} not found`);
    }

    const result = await simulationApi.seller.acceptOffer(farmer.id, negotiation.id);

    return {
      result,
      message: `${farmer.name} accepted offer`,
    };
  };

  const handleCounterOffer = async (payload: any) => {
    const farmer = scenarioState.createdUsers.farmers[payload.farmerIndex];
    const negotiation = scenarioState.negotiations[payload.negotiationIndex];

    if (!farmer || !negotiation) {
      throw new Error('Farmer or negotiation not found');
    }

    const result = await simulationApi.seller.counterOffer(
      farmer.id,
      negotiation.id,
      payload.counterPrice,
      payload.counterQuantity
    );

    return {
      result,
      message: `${farmer.name} countered: €${payload.counterPrice}/ton`,
    };
  };

  const handleAcceptCounterOffer = async (payload: any) => {
    const negotiation = scenarioState.negotiations[payload.negotiationIndex];

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    const result = await simulationApi.admin.acceptCounterOffer(negotiation.id);

    return {
      result,
      message: 'Admin accepted counter-offer',
    };
  };

  const handleRejectOffer = async (payload: any) => {
    const farmer = scenarioState.createdUsers.farmers[payload.farmerIndex];
    const negotiation = scenarioState.negotiations[payload.negotiationIndex];
    if (!farmer || !negotiation) {
      throw new Error('Farmer or negotiation not found');
    }

    const result = await simulationApi.seller.rejectOffer(farmer.id, negotiation.id, payload.reason);
    return { result, message: `Farmer ${farmer.name} rejected offer` };
  };

  const handleCreateTransportRequest = async (payload: any) => {
    const tradeOpIndex = payload.tradeOpIndex !== undefined ? payload.tradeOpIndex : 0;
    const tradeOperation = scenarioState.tradeOperations[tradeOpIndex];
    if (!tradeOperation) {
      throw new Error('Trade operation not found');
    }

    const result = await simulationApi.admin.createTransportRequest({
      tradeOperationId: tradeOperation.id,
      pickupLat: payload.pickupLat,
      pickupLng: payload.pickupLng,
      deliveryLat: payload.deliveryLat,
      deliveryLng: payload.deliveryLng,
      distanceKm: payload.distanceKm,
    });

    setScenarioState((prev) => ({
      ...prev,
      transportRequests: [...prev.transportRequests, result.transportRequest],
    }));

    return { result, message: `Created transport request (${result.distanceKm.toFixed(1)}km)` };
  };

  const handleTransporterSubmitBid = async (payload: any) => {
    const transporter = scenarioState.createdUsers.transporters[payload.transporterIndex];
    const transportRequest = scenarioState.transportRequests[payload.requestIndex !== undefined ? payload.requestIndex : 0];
    const tradeOperation = scenarioState.tradeOperations[payload.tradeOpIndex !== undefined ? payload.tradeOpIndex : 0];

    if (!transporter || !transportRequest || !tradeOperation) {
      throw new Error('Transporter, transport request, or trade operation not found');
    }

    const result = await simulationApi.transporter.submitBid(transporter.id, {
      transportRequestId: transportRequest.id,
      bidAmount: payload.bidAmount,
      estimatedDuration: payload.estimatedDuration,
      vehicleType: payload.vehicleType,
    });

    setScenarioState((prev) => ({
      ...prev,
      transportBids: [...prev.transportBids, result.transportBid],
    }));

    return { result, message: `Transporter bid: €${payload.bidAmount} (${payload.estimatedDuration}h)` };
  };

  const handleAdminSelectBid = async (payload: any) => {
    const transportRequest = scenarioState.transportRequests[payload.requestIndex !== undefined ? payload.requestIndex : 0];
    const bid = scenarioState.transportBids[payload.bidIndex];

    if (!transportRequest || !bid) {
      throw new Error('Transport request or bid not found');
    }

    const result = await simulationApi.admin.selectTransportBid({
      transportRequestId: transportRequest.id,
      bidId: bid.id,
    });

    setScenarioState((prev) => ({
      ...prev,
      transportJobs: [...prev.transportJobs, result.transportJob],
    }));

    return { result, message: `Selected bid: €${result.winningBid.bidAmount}` };
  };

  const handleUpdatePricing = async (payload: any) => {
    const negotiation = scenarioState.negotiations[payload.negotiationIndex];
    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    const result = await simulationApi.admin.updatePricing({
      negotiationId: negotiation.id,
      newPrice: payload.newPrice,
      reason: payload.reason,
    });

    return { result, message: `Price updated to €${payload.newPrice}` };
  };

  const handleAssignInspector = async (payload: any) => {
    const tradeOpIndex = payload.tradeOpIndex !== undefined ? payload.tradeOpIndex : 0;
    const tradeOperation = scenarioState.tradeOperations[tradeOpIndex];
    if (!tradeOperation) {
      throw new Error('Trade operation not created yet');
    }

    const inspector = scenarioState.createdUsers.inspector;
    if (!inspector) {
      throw new Error('Inspector not created yet');
    }

    const result = await simulationApi.admin.assignInspector(
      tradeOperation.id,
      inspector.id
    );

    // Track inspections
    setScenarioState((prev) => ({
      ...prev,
      inspections: result.inspections || [],
    }));

    return {
      result,
      message: `Assigned ${inspector.name} to ${result.inspections?.length || 0} inspections`,
    };
  };

  const handleSubmitResults = async (payload: any) => {
    const inspector = scenarioState.createdUsers.inspector;
    const inspection = scenarioState.inspections[payload.inspectionIndex];

    if (!inspector) {
      throw new Error('Inspector not created yet');
    }

    if (!inspection) {
      throw new Error(`Inspection at index ${payload.inspectionIndex} not found`);
    }

    const result = await simulationApi.inspector.submitResults(inspector.id, {
      inspectionId: inspection.id,
      qualityScore: payload.qualityScore,
      result: payload.result,
      notes: payload.notes,
    });

    return {
      result,
      message: `Inspection ${payload.result}: quality ${payload.qualityScore}`,
    };
  };

  const handleCreateTransport = async (payload: any) => {
    const tradeOpIndex = payload.tradeOpIndex !== undefined ? payload.tradeOpIndex : 0;
    const tradeOperation = scenarioState.tradeOperations[tradeOpIndex];
    if (!tradeOperation) {
      throw new Error('Trade operation not created yet');
    }

    const transporterIndex = payload.transporterIndex !== undefined ? payload.transporterIndex : 0;
    const transporter = scenarioState.createdUsers.transporters[transporterIndex];
    if (!transporter) {
      throw new Error('Transporter not created yet');
    }

    const result = await simulationApi.admin.createTransport({
      tradeOperationId: tradeOperation.id,
      transporterId: transporter.id,
      pickupLat: payload.pickupLat,
      pickupLng: payload.pickupLng,
      deliveryLat: payload.deliveryLat,
      deliveryLng: payload.deliveryLng,
      bidAmount: payload.bidAmount,
      estimatedDuration: payload.estimatedDuration,
    });

    // Track transport job
    setScenarioState((prev) => ({
      ...prev,
      transportJobs: [...prev.transportJobs, result.job],
    }));

    return {
      result,
      message: `Created transport job: €${payload.bidAmount}, ${payload.distanceKm}km`,
    };
  };

  const handleCompleteDelivery = async (payload: any) => {
    const transporterIndex = payload.transporterIndex !== undefined ? payload.transporterIndex : 0;
    const transporter = scenarioState.createdUsers.transporters[transporterIndex];
    const jobIndex = payload.jobIndex !== undefined ? payload.jobIndex : 0;
    const job = scenarioState.transportJobs[jobIndex];

    if (!transporter) {
      throw new Error('Transporter not created yet');
    }

    if (!job) {
      throw new Error('Transport job not created yet');
    }

    const result = await simulationApi.transporter.completeDelivery(
      transporter.id,
      job.id,
      'Delivery completed successfully'
    );

    return {
      result,
      message: 'Delivery completed',
    };
  };

  const handleCompleteTrade = async (payload: any) => {
    const tradeOpIndex = payload.tradeOpIndex !== undefined ? payload.tradeOpIndex : 0;
    const tradeOperation = scenarioState.tradeOperations[tradeOpIndex];
    if (!tradeOperation) {
      throw new Error('Trade operation not created yet');
    }

    const result = await simulationApi.admin.completeTrade(tradeOperation.id);

    return {
      result,
      message: 'Trade operation completed',
    };
  };

  // Execute next step
  const executeNextStep = () => {
    if (currentStep < scenarioSteps.length) {
      executeStep(currentStep);
    }
  };

  // Auto-run all steps with breakpoint support
  const autoRunScenario = async () => {
    setIsRunning(true);
    for (let i = currentStep; i < scenarioSteps.length; i++) {
      // Check if breakpoint is set at this step
      if (breakpoints.has(i) && i > currentStep) {
        alert(`⏸️ Breakpoint hit at step ${i + 1}`);
        setIsRunning(false);
        setCurrentStep(i);
        return;
      }

      await executeStep(i);
      await new Promise((resolve) => setTimeout(resolve, autoRunSpeed));
    }
    setIsRunning(false);
  };

  // Toggle breakpoint
  const toggleBreakpoint = (stepIndex: number) => {
    const newBreakpoints = new Set(breakpoints);
    if (newBreakpoints.has(stepIndex)) {
      newBreakpoints.delete(stepIndex);
    } else {
      newBreakpoints.add(stepIndex);
    }
    setBreakpoints(newBreakpoints);
  };

  // Jump to specific step
  const jumpToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < scenarioSteps.length) {
      setCurrentStep(stepIndex);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {loginError}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main orchestrator interface
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Scenario Orchestrator</h1>

        {/* Scenario Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Scenario</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={loadHappyPathScenario}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
                selectedScenario === 'happy-path' ? 'bg-green-700' : 'bg-green-600'
              }`}
            >
              Happy Path (22 steps)
            </button>
            <button
              onClick={loadInspectionFailureScenario}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
                selectedScenario === 'inspection-failure' ? 'bg-orange-700' : 'bg-orange-600'
              }`}
            >
              Inspection Failure (27 steps)
            </button>
            <button
              onClick={loadMultiCounterScenario}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
                selectedScenario === 'multi-counter' ? 'bg-purple-700' : 'bg-purple-600'
              }`}
            >
              Multi Counter-Offer (21 steps)
            </button>
            <button
              onClick={loadPartialRejectionScenario}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
                selectedScenario === 'partial-rejection' ? 'bg-red-700' : 'bg-red-600'
              }`}
            >
              Partial Rejection (26 steps)
            </button>
            <button
              onClick={loadTransportBiddingScenario}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
                selectedScenario === 'transport-bidding' ? 'bg-blue-700' : 'bg-blue-600'
              }`}
            >
              Transport Bidding (26 steps)
            </button>
            <button
              onClick={loadRushOrderScenario}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
                selectedScenario === 'rush-order' ? 'bg-yellow-700' : 'bg-yellow-600'
              }`}
            >
              Rush Order (19 steps)
            </button>
            <button
              onClick={loadQualityDisputeScenario}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
                selectedScenario === 'quality-dispute' ? 'bg-pink-700' : 'bg-pink-600'
              }`}
            >
              Quality Dispute (28 steps)
            </button>
            <button
              onClick={loadMultiBuyerScenario}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
                selectedScenario === 'multi-buyer' ? 'bg-indigo-700' : 'bg-indigo-600'
              }`}
            >
              Multi-Buyer (32 steps)
            </button>
          </div>

          {selectedScenario && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Execution Mode
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setExecutionMode('step')}
                    className={`px-4 py-2 rounded-md ${
                      executionMode === 'step'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    Step-by-Step
                  </button>
                  <button
                    onClick={() => setExecutionMode('auto')}
                    className={`px-4 py-2 rounded-md ${
                      executionMode === 'auto'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    Auto-Run
                  </button>
                </div>
              </div>

              {/* Debug Controls */}
              {executionMode === 'auto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Run Speed
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="200"
                      max="5000"
                      step="200"
                      value={autoRunSpeed}
                      onChange={(e) => setAutoRunSpeed(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600">{(autoRunSpeed / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              )}

              {/* Advanced Controls */}
              <div className="flex gap-3 items-center flex-wrap">
                <button
                  onClick={() => {
                    const json = JSON.stringify({ scenarioName: selectedScenario, steps: scenarioSteps, totalDuration }, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedScenario}-${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  disabled={scenarioSteps.length === 0}
                  className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => {
                    const completedSteps = scenarioSteps.filter(s => s.status === 'completed');
                    const csv = [
                      'Step,Actor,Action,Duration (ms),Status',
                      ...completedSteps.map(s => `${s.step},"${s.actor}","${s.action}",${s.duration || 0},"${s.status}"`)
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedScenario}-metrics-${Date.now()}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  disabled={scenarioSteps.filter(s => s.status === 'completed').length === 0}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    setCurrentStep(0);
                    setTotalDuration(0);
                    const resetSteps = scenarioSteps.map(s => ({ ...s, status: 'pending' as const, result: undefined, error: undefined, duration: undefined }));
                    setScenarioSteps(resetSteps);
                  }}
                  disabled={scenarioSteps.filter(s => s.status !== 'pending').length === 0}
                  className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  Reset Scenario
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Tabs */}
        {scenarioSteps.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveView('execution')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeView === 'execution'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Execution
              </button>
              <button
                onClick={() => setActiveView('flow')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeView === 'flow'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                🔄 Flow Diagram
              </button>
              <button
                onClick={() => setActiveView('database')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeView === 'database'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                🗄️ Database
              </button>
              <button
                onClick={() => setActiveView('builder')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeView === 'builder'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                🛠️ Builder
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {scenarioSteps.length > 0 && activeView === 'execution' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Steps */}
            <div className="col-span-2 space-y-6">
              {/* Progress Dashboard */}
              <ProgressDashboard
                scenarioName={selectedScenario.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                steps={scenarioSteps}
                currentStepIndex={currentStep}
                isRunning={isRunning}
                totalDuration={totalDuration}
              />

              {/* Scenario Steps */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Scenario Steps ({currentStep}/{scenarioSteps.length})
                  </h2>
                  <div className="flex gap-2">
                    {executionMode === 'step' ? (
                      <button
                        onClick={executeNextStep}
                        disabled={currentStep >= scenarioSteps.length || isRunning}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        Execute Next Step
                      </button>
                    ) : (
                      <button
                        onClick={autoRunScenario}
                        disabled={isRunning}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {isRunning ? 'Running...' : 'Auto-Run All Steps'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scenarioSteps.map((step, index) => (
                    <div key={index} className="relative">
                      {/* Breakpoint indicator */}
                      <button
                        onClick={() => toggleBreakpoint(index)}
                        className={`absolute -left-6 top-3 w-4 h-4 rounded-full border-2 ${
                          breakpoints.has(index)
                            ? 'bg-red-500 border-red-600'
                            : 'bg-white border-gray-300 hover:border-red-400'
                        }`}
                        title={breakpoints.has(index) ? 'Remove breakpoint' : 'Add breakpoint'}
                      />
                      <EnhancedStepCard step={step} index={index} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Metrics Sidebar */}
            <div className="col-span-1">
              <MetricsSidebar steps={scenarioSteps} totalDuration={totalDuration} />
            </div>
          </div>
        )}

        {/* Flow Diagram View */}
        {scenarioSteps.length > 0 && activeView === 'flow' && (
          <TradeFlowDiagram scenarioState={scenarioState} currentPhase="" />
        )}

        {/* Database State View */}
        {scenarioSteps.length > 0 && activeView === 'database' && (
          <DatabaseStatePanel scenarioState={scenarioState} onRefresh={loadUsers} />
        )}

        {/* Scenario Builder View */}
        {activeView === 'builder' && (
          <ScenarioBuilder
            onSaveScenario={(name, steps) => {
              console.log('Saved scenario:', name, steps);
              // TODO: Implement scenario persistence
            }}
          />
        )}

        {/* Users Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2">Buyers ({users.buyers.length})</h3>
            <div className="space-y-1 text-sm">
              {users.buyers.map((user) => (
                <div key={user.id} className="text-gray-700">
                  {user.name || user.email}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2">Farmers ({users.farmers.length})</h3>
            <div className="space-y-1 text-sm">
              {users.farmers.map((user) => (
                <div key={user.id} className="text-gray-700">
                  {user.name || user.email}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2">
              Transporters ({users.transporters.length})
            </h3>
            <div className="space-y-1 text-sm">
              {users.transporters.map((user) => (
                <div key={user.id} className="text-gray-700">
                  {user.name || user.email}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2">
              Inspectors ({users.inspectors.length})
            </h3>
            <div className="space-y-1 text-sm">
              {users.inspectors.map((user) => (
                <div key={user.id} className="text-gray-700">
                  {user.name || user.email}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
