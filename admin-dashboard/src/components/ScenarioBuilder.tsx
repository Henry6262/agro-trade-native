import React, { useState } from 'react';
import type { ScenarioStep } from '../types/scenario';

interface ScenarioBuilderProps {
  onSaveScenario: (name: string, steps: ScenarioStep[]) => void;
}

export const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ onSaveScenario }) => {
  const [scenarioName, setScenarioName] = useState('');
  const [steps, setSteps] = useState<ScenarioStep[]>([]);
  const [currentStep, setCurrentStep] = useState<Partial<ScenarioStep>>({
    actor: 'ADMIN',
    action: 'createTestUser',
  });

  const actorOptions = ['ADMIN', 'FARMER', 'BUYER', 'TRANSPORTER', 'INSPECTOR'];

  const actionOptions = {
    ADMIN: [
      'createTestUser',
      'createFarmerSaleListing',
      'createTradeOperation',
      'sendOffers',
      'acceptCounterOffer',
      'assignInspector',
      'createTransport',
      'createTransportRequest',
      'adminSelectBid',
      'updatePricing',
      'completeTrade',
    ],
    FARMER: ['acceptOffer', 'counterOffer', 'rejectOffer'],
    BUYER: ['createBuyListing'],
    TRANSPORTER: ['transporterSubmitBid', 'completeDelivery'],
    INSPECTOR: ['submitResults'],
  };

  const addStep = () => {
    if (!currentStep.description || !currentStep.action) {
      alert('Please fill in description and action');
      return;
    }

    const newStep: ScenarioStep = {
      step: steps.length + 1,
      description: currentStep.description || '',
      actor: currentStep.actor || 'ADMIN',
      action: currentStep.action || 'createTestUser',
      payload: currentStep.payload || {},
    };

    setSteps([...steps, newStep]);
    setCurrentStep({
      actor: 'ADMIN',
      action: 'createTestUser',
      description: '',
      payload: {},
    });
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    const renumbered = newSteps.map((step, i) => ({ ...step, step: i + 1 }));
    setSteps(renumbered);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];

    // Renumber steps
    const renumbered = newSteps.map((step, i) => ({ ...step, step: i + 1 }));
    setSteps(renumbered);
  };

  const handleSave = () => {
    if (!scenarioName) {
      alert('Please enter a scenario name');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    onSaveScenario(scenarioName, steps);
    alert(`Scenario "${scenarioName}" saved! (Note: This is for demo - implement persistence as needed)`);

    // Reset
    setScenarioName('');
    setSteps([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Scenario Builder</h2>

      {/* Scenario Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scenario Name
        </label>
        <input
          type="text"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          placeholder="e.g., Custom Happy Path"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Step Builder */}
      <div className="border border-gray-300 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">Add New Step</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Actor</label>
            <select
              value={currentStep.actor}
              onChange={(e) => setCurrentStep({ ...currentStep, actor: e.target.value, action: '' })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              {actorOptions.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
            <select
              value={currentStep.action}
              onChange={(e) => setCurrentStep({ ...currentStep, action: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Select action...</option>
              {actionOptions[currentStep.actor as keyof typeof actionOptions]?.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={currentStep.description || ''}
            onChange={(e) => setCurrentStep({ ...currentStep, description: e.target.value })}
            placeholder="e.g., Create farmer for testing"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Payload (JSON)
          </label>
          <textarea
            value={JSON.stringify(currentStep.payload || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setCurrentStep({ ...currentStep, payload: parsed });
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
            rows={4}
            className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-md"
          />
        </div>

        <button
          onClick={addStep}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Add Step
        </button>
      </div>

      {/* Steps List */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-3">Scenario Steps ({steps.length})</h3>

        {steps.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            No steps added yet. Add your first step above.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-600">#{step.step}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {step.actor}
                    </span>
                    <span className="text-xs text-gray-500">{step.action}</span>
                  </div>
                  <div className="text-sm text-gray-800">{step.description}</div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === steps.length - 1}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeStep(index)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!scenarioName || steps.length === 0}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          Save Scenario
        </button>
        <button
          onClick={() => {
            if (window.confirm('Clear all steps?')) {
              setSteps([]);
              setScenarioName('');
            }
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Clear
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
        <strong>Note:</strong> This is a simplified scenario builder. Saved scenarios are not persisted.
        For production, implement scenario storage (localStorage, database, or file export).
      </div>
    </div>
  );
};
