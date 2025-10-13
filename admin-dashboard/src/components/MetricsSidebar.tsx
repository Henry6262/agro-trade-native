import React from 'react';
import type { ScenarioStep } from '../types/scenario';

interface MetricsSidebarProps {
  steps: ScenarioStep[];
  totalDuration: number;
}

export const MetricsSidebar: React.FC<MetricsSidebarProps> = ({ steps, totalDuration }) => {
  // Calculate action type metrics
  const actionMetrics = steps.reduce((acc, step) => {
    acc[step.action] = (acc[step.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate actor metrics
  const actorMetrics = steps.reduce((acc, step) => {
    if (!acc[step.actor]) {
      acc[step.actor] = {
        total: 0,
        completed: 0,
        failed: 0,
        avgDuration: 0,
      };
    }
    acc[step.actor].total += 1;
    if (step.status === 'completed') acc[step.actor].completed += 1;
    if (step.status === 'failed') acc[step.actor].failed += 1;
    return acc;
  }, {} as Record<string, { total: number; completed: number; failed: number; avgDuration: number }>);

  // Calculate average durations per actor
  Object.keys(actorMetrics).forEach((actor) => {
    const actorSteps = steps.filter((s) => s.actor === actor && s.duration);
    const totalDuration = actorSteps.reduce((sum, s) => sum + (s.duration || 0), 0);
    actorMetrics[actor].avgDuration = actorSteps.length > 0 ? totalDuration / actorSteps.length : 0;
  });

  // Slowest steps
  const slowestSteps = [...steps]
    .filter((s) => s.duration !== undefined)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .slice(0, 5);

  // Fastest steps
  const fastestSteps = [...steps]
    .filter((s) => s.duration !== undefined && s.duration > 0)
    .sort((a, b) => (a.duration || 0) - (b.duration || 0))
    .slice(0, 5);

  // Status distribution
  const statusMetrics = {
    pending: steps.filter((s) => s.status === 'pending').length,
    running: steps.filter((s) => s.status === 'in_progress').length,
    completed: steps.filter((s) => s.status === 'completed').length,
    failed: steps.filter((s) => s.status === 'failed').length,
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-xl font-semibold mb-4">Metrics & Insights</h2>

      {/* Status Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Distribution</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Completed</span>
            <span className="text-sm font-semibold text-green-600">{statusMetrics.completed}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Running</span>
            <span className="text-sm font-semibold text-blue-600">{statusMetrics.running}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Pending</span>
            <span className="text-sm font-semibold text-gray-600">{statusMetrics.pending}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Failed</span>
            <span className="text-sm font-semibold text-red-600">{statusMetrics.failed}</span>
          </div>
        </div>
      </div>

      {/* Actor Performance */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Actor Performance</h3>
        <div className="space-y-3">
          {Object.entries(actorMetrics).map(([actor, metrics]) => (
            <div key={actor} className="bg-gray-50 rounded p-3">
              <div className="font-medium text-sm text-gray-800 mb-2">{actor}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Total:</span>{' '}
                  <span className="font-semibold">{metrics.total}</span>
                </div>
                <div>
                  <span className="text-gray-500">Success:</span>{' '}
                  <span className="font-semibold text-green-600">{metrics.completed}</span>
                </div>
                <div>
                  <span className="text-gray-500">Failed:</span>{' '}
                  <span className="font-semibold text-red-600">{metrics.failed}</span>
                </div>
                <div>
                  <span className="text-gray-500">Avg Time:</span>{' '}
                  <span className="font-semibold">
                    {(metrics.avgDuration / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Types */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Action Types</h3>
        <div className="space-y-1">
          {Object.entries(actionMetrics)
            .sort(([, a], [, b]) => b - a)
            .map(([action, count]) => (
              <div key={action} className="flex justify-between items-center text-xs">
                <span className="text-gray-600">{action}</span>
                <span className="font-semibold text-gray-800">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Performance Insights */}
      {slowestSteps.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Slowest Steps</h3>
          <div className="space-y-2">
            {slowestSteps.map((step) => (
              <div key={step.step} className="text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 flex-1">
                    Step {step.step}: {step.action}
                  </span>
                  <span className="font-semibold text-orange-600 ml-2">
                    {((step.duration || 0) / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Metrics */}
      <div className="border-t pt-4 bg-gray-50 -m-6 mt-4 p-6 rounded-b-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 mb-1">Total Steps</div>
            <div className="text-2xl font-bold text-gray-800">{steps.length}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Total Time</div>
            <div className="text-2xl font-bold text-blue-600">
              {(totalDuration / 1000).toFixed(1)}s
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {steps.length > 0
                ? ((statusMetrics.completed / steps.length) * 100).toFixed(0)
                : 0}
              %
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Avg Duration</div>
            <div className="text-2xl font-bold text-purple-600">
              {statusMetrics.completed > 0
                ? (totalDuration / statusMetrics.completed / 1000).toFixed(2)
                : 0}
              s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
