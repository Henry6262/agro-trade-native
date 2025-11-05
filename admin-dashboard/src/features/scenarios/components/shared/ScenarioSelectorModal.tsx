import React from 'react';
import { X, ShoppingCart, AlertTriangle, Users, Timer, Package, TrendingUp, Truck, UserCheck } from 'lucide-react';

interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  steps: number;
  complexity: 'simple' | 'moderate' | 'complex';
  category: 'basic' | 'negotiation' | 'failure' | 'competition';
  color: string;
}

const scenarios: ScenarioInfo[] = [
  {
    id: 'happy-path',
    name: 'Happy Path',
    description: 'Complete successful trade flow with no issues. Tests user creation, listings, trade operation, negotiation, acceptance, inspection, transport, and delivery.',
    icon: <Package className="w-8 h-8" />,
    steps: 22,
    complexity: 'simple',
    category: 'basic',
    color: 'bg-green-500',
  },
  {
    id: 'inspection-failure',
    name: 'Inspection Failure',
    description: 'Inspector fails quality check, requiring re-negotiation or replacement seller. Tests failure handling and recovery workflows.',
    icon: <AlertTriangle className="w-8 h-8" />,
    steps: 24,
    complexity: 'moderate',
    category: 'failure',
    color: 'bg-red-500',
  },
  {
    id: 'multi-counter',
    name: 'Multi Counter',
    description: 'Multiple rounds of price negotiation with counter-offers between buyer and sellers. Tests complex negotiation flows.',
    icon: <TrendingUp className="w-8 h-8" />,
    steps: 18,
    complexity: 'moderate',
    category: 'negotiation',
    color: 'bg-orange-500',
  },
  {
    id: 'partial-rejection',
    name: 'Partial Rejection',
    description: 'Some sellers reject offers, requiring admin to find additional sellers to fulfill quantity. Tests adaptive sourcing.',
    icon: <UserCheck className="w-8 h-8" />,
    steps: 23,
    complexity: 'complex',
    category: 'failure',
    color: 'bg-yellow-500',
  },
  {
    id: 'quality-dispute',
    name: 'Quality Dispute',
    description: 'Disagreement over product quality requires resolution. Tests dispute management and resolution workflows.',
    icon: <AlertTriangle className="w-8 h-8" />,
    steps: 20,
    complexity: 'complex',
    category: 'failure',
    color: 'bg-purple-500',
  },
  {
    id: 'rush-order',
    name: 'Rush Order',
    description: 'Expedited order with tight deadlines testing time-sensitive workflows. Tests priority handling and fast execution.',
    icon: <Timer className="w-8 h-8" />,
    steps: 14,
    complexity: 'moderate',
    category: 'basic',
    color: 'bg-blue-500',
  },
  {
    id: 'transport-bidding',
    name: 'Transport Bidding',
    description: 'Multiple transporters bid on delivery job, testing selection process. Tests competitive bidding and selection.',
    icon: <Truck className="w-8 h-8" />,
    steps: 19,
    complexity: 'moderate',
    category: 'competition',
    color: 'bg-indigo-500',
  },
  {
    id: 'multi-buyer',
    name: 'Multi Buyer',
    description: 'Multiple buyers competing for same product listings. Tests market competition and priority allocation.',
    icon: <Users className="w-8 h-8" />,
    steps: 21,
    complexity: 'complex',
    category: 'competition',
    color: 'bg-pink-500',
  },
];

interface ScenarioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (scenarioId: string) => void;
  currentScenarioId?: string;
}

export const ScenarioSelectorModal: React.FC<ScenarioSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentScenarioId,
}) => {
  if (!isOpen) return null;

  const getComplexityBadge = (complexity: string) => {
    const colors = {
      simple: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      complex: 'bg-red-100 text-red-800',
    };
    return colors[complexity as keyof typeof colors] || colors.moderate;
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      basic: 'bg-blue-100 text-blue-800',
      negotiation: 'bg-orange-100 text-orange-800',
      failure: 'bg-red-100 text-red-800',
      competition: 'bg-purple-100 text-purple-800',
    };
    return colors[category as keyof typeof colors] || colors.basic;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] m-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Select Test Scenario</h2>
              <p className="text-blue-100 mt-1">Choose a scenario to test the Agro-Trade workflow</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`
                  relative bg-white border-2 rounded-xl p-6 cursor-pointer transition-all duration-200
                  hover:shadow-xl hover:scale-105 hover:border-blue-400
                  ${currentScenarioId === scenario.id ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-200'}
                `}
                onClick={() => {
                  onSelect(scenario.id);
                  onClose();
                }}
              >
                {/* Current indicator */}
                {currentScenarioId === scenario.id && (
                  <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    CURRENT
                  </div>
                )}

                {/* Icon with colored background */}
                <div className={`${scenario.color} text-white w-16 h-16 rounded-xl flex items-center justify-center mb-4`}>
                  {scenario.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{scenario.name}</h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {scenario.description}
                </p>

                {/* Metadata */}
                <div className="space-y-2">
                  {/* Steps count */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Steps:</span>
                    <span className="font-semibold text-gray-700">{scenario.steps}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getComplexityBadge(scenario.complexity)}`}>
                      {scenario.complexity}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryBadge(scenario.category)}`}>
                      {scenario.category}
                    </span>
                  </div>
                </div>

                {/* Select button */}
                <button
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(scenario.id);
                    onClose();
                  }}
                >
                  {currentScenarioId === scenario.id ? 'Currently Selected' : 'Select Scenario'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};