import React from 'react';
import type { ScenarioStep } from '../../../../types/scenario';

interface ProgressDashboardProps {
  scenarioName: string;
  steps: ScenarioStep[];
  currentStepIndex: number;
  isRunning: boolean;
  totalDuration: number;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  scenarioName,
  steps,
  currentStepIndex,
  isRunning,
  totalDuration,
}) => {
  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const failedSteps = steps.filter((s) => s.status === 'failed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const totalSteps = steps.length;
  const avgTimePerStep = completedSteps > 0 ? totalDuration / completedSteps : 0;
  const estimatedTimeRemaining = avgTimePerStep * (totalSteps - completedSteps);

  // Count actors
  const actorCounts = steps.reduce((acc, step) => {
    acc[step.actor] = (acc[step.actor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate phase breakdown
  const phaseBreakdown = {
    userCreation: steps.filter((s) => s.action === 'createTestUser').length,
    listings: steps.filter(
      (s) => s.action === 'createFarmerSaleListing' || s.action === 'createBuyListing'
    ).length,
    negotiations: steps.filter(
      (s) =>
        s.action === 'sendOffers' ||
        s.action === 'acceptOffer' ||
        s.action === 'counterOffer' ||
        s.action === 'rejectOffer'
    ).length,
    inspection: steps.filter(
      (s) => s.action === 'assignInspector' || s.action === 'submitResults'
    ).length,
    transport: steps.filter(
      (s) =>
        s.action === 'createTransport' ||
        s.action === 'createTransportRequest' ||
        s.action === 'transporterSubmitBid' ||
        s.action === 'completeDelivery'
    ).length,
    completion: steps.filter((s) => s.action === 'completeTrade').length,
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Progress Dashboard</h2>
        {isRunning && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm text-gray-600">Running...</span>
          </div>
        )}
      </div>

      {/* Main Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{scenarioName}</span>
          <span className="text-sm text-gray-600">
            {completedSteps} / {totalSteps} steps
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {progressPercentage.toFixed(1)}% complete
          </span>
          {isRunning && estimatedTimeRemaining > 0 && (
            <span className="text-xs text-gray-500">
              ~{Math.ceil(estimatedTimeRemaining / 1000)}s remaining
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{completedSteps}</div>
          <div className="text-xs text-green-700">Completed</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {steps.filter((s) => s.status === 'in_progress').length}
          </div>
          <div className="text-xs text-blue-700">Running</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600">
            {steps.filter((s) => s.status === 'pending').length}
          </div>
          <div className="text-xs text-gray-700">Pending</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{failedSteps}</div>
          <div className="text-xs text-red-700">Failed</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="border-t pt-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">Total Duration</div>
            <div className="text-lg font-semibold text-gray-800">
              {(totalDuration / 1000).toFixed(1)}s
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Avg Time/Step</div>
            <div className="text-lg font-semibold text-gray-800">
              {(avgTimePerStep / 1000).toFixed(2)}s
            </div>
          </div>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Phase Breakdown</h3>
        <div className="space-y-2">
          {Object.entries(phaseBreakdown).map(([phase, count]) => {
            if (count === 0) return null;
            const phaseSteps = steps.filter((s) => {
              switch (phase) {
                case 'userCreation':
                  return s.action === 'createTestUser';
                case 'listings':
                  return s.action === 'createFarmerSaleListing' || s.action === 'createBuyListing';
                case 'negotiations':
                  return ['sendOffers', 'acceptOffer', 'counterOffer', 'rejectOffer'].includes(
                    s.action
                  );
                case 'inspection':
                  return s.action === 'assignInspector' || s.action === 'submitResults';
                case 'transport':
                  return [
                    'createTransport',
                    'createTransportRequest',
                    'transporterSubmitBid',
                    'completeDelivery',
                  ].includes(s.action);
                case 'completion':
                  return s.action === 'completeTrade';
                default:
                  return false;
              }
            });
            const phaseCompleted = phaseSteps.filter((s) => s.status === 'completed').length;
            const phasePercentage = (phaseCompleted / count) * 100;

            return (
              <div key={phase}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 capitalize">
                    {phase.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {phaseCompleted}/{count}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${phasePercentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actor Distribution */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Actor Distribution</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(actorCounts).map(([actor, count]) => (
            <div
              key={actor}
              className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
            >
              <span className="text-xs font-medium text-gray-700">{actor}</span>
              <span className="text-xs text-gray-500">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
