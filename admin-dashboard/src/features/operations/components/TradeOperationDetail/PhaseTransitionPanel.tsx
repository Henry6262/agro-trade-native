import React, { useState } from 'react';
import { toast } from 'sonner';
import { tradeOperationService } from '../../../../services/api';

// Phase transition map from SYSTEM_ANALYSIS.md
const VALID_TRANSITIONS: Record<string, string[]> = {
  INITIATION: ['SELLER_MATCHING', 'CANCELLED'],
  SELLER_MATCHING: ['SELLER_NEGOTIATION', 'CANCELLED'],
  SELLER_NEGOTIATION: ['INSPECTION_PENDING', 'TRANSPORT_MATCHING', 'CANCELLED'],
  INSPECTION_PENDING: ['TRANSPORT_MATCHING', 'CANCELLED'],
  TRANSPORT_MATCHING: ['TRANSPORT_BIDDING', 'IN_TRANSIT', 'CANCELLED'],
  TRANSPORT_BIDDING: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

interface PhaseTransitionPanelProps {
  operationId: string;
  currentPhase: string;
  onPhaseChanged: () => Promise<void>;
}

export const PhaseTransitionPanel: React.FC<PhaseTransitionPanelProps> = ({
  operationId,
  currentPhase,
  onPhaseChanged,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmPhase, setConfirmPhase] = useState<string | null>(null);

  const validNextPhases = VALID_TRANSITIONS[currentPhase] || [];

  if (validNextPhases.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Phase Transition</h3>
        <p className="text-sm text-gray-500">Trade is in final state: {currentPhase}</p>
      </div>
    );
  }

  const handleTransition = async (targetPhase: string) => {
    try {
      setLoading(true);
      await tradeOperationService.updatePhase(operationId, targetPhase);
      toast.success(`Phase advanced to ${targetPhase}`);
      setConfirmPhase(null);
      await onPhaseChanged();
    } catch (err: any) {
      console.error('Phase transition failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to advance phase');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    if (phase === 'CANCELLED') return 'bg-red-600 hover:bg-red-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Phase Transition</h3>
      <p className="text-xs text-gray-500 mb-3">Current: <span className="font-semibold">{currentPhase}</span></p>
      <div className="flex flex-wrap gap-2">
        {validNextPhases.map((phase) => (
          <div key={phase}>
            {confirmPhase === phase ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Confirm {phase}?</span>
                <button
                  onClick={() => handleTransition(phase)}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? '...' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmPhase(null)}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmPhase(phase)}
                className={`px-3 py-1.5 text-xs text-white rounded-lg transition-colors ${getPhaseColor(phase)}`}
              >
                {phase.replace(/_/g, ' ')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
