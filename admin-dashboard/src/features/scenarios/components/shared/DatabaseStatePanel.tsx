import React, { useState, useEffect } from 'react';
import type {
  User,
  SaleListing,
  BuyListing,
  TradeOperation,
  Negotiation,
  InspectionRequest,
  TransportRequestListItem,
  TransportBidSummary,
} from '../../../../types';
import { simulationApi } from '../../../../services/simulationApi';

interface TransportJob {
  id: string;
  status: string;
  [key: string]: unknown;
}

type EntityType =
  | User
  | SaleListing
  | BuyListing
  | TradeOperation
  | Negotiation
  | InspectionRequest
  | TransportRequestListItem
  | TransportBidSummary
  | TransportJob;

interface DatabaseStatePanelProps {
  scenarioState: {
    createdUsers: {
      farmers: User[];
      buyers: User[];
      transporters: User[];
      inspector: User | null;
    };
    saleListings: SaleListing[];
    buyListings: BuyListing[];
    tradeOperations: TradeOperation[];
    negotiations: Negotiation[];
    inspections: InspectionRequest[];
    transportRequests: TransportRequestListItem[];
    transportBids: TransportBidSummary[];
    transportJobs: TransportJob[];
  };
  onRefresh: () => void;
}

export const DatabaseStatePanel: React.FC<DatabaseStatePanelProps> = ({
  scenarioState,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<string>('users');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);

  const tabs = [
    { id: 'users', label: 'Users', count: getTotalUsers() },
    { id: 'listings', label: 'Listings', count: scenarioState.saleListings.length + scenarioState.buyListings.length },
    { id: 'operations', label: 'Operations', count: scenarioState.tradeOperations.length },
    { id: 'negotiations', label: 'Negotiations', count: scenarioState.negotiations.length },
    { id: 'inspections', label: 'Inspections', count: scenarioState.inspections.length },
    { id: 'transport', label: 'Transport', count: scenarioState.transportJobs.length + scenarioState.transportRequests.length },
  ];

  function getTotalUsers() {
    return (
      scenarioState.createdUsers.farmers.length +
      scenarioState.createdUsers.buyers.length +
      scenarioState.createdUsers.transporters.length +
      (scenarioState.createdUsers.inspector ? 1 : 0)
    );
  }

  const handleCleanupAll = async () => {
    if (!window.confirm('⚠️ This will delete ALL test data (users starting with test-) and their related data. Are you sure?')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await simulationApi.admin.cleanupTestData();
      alert(`✅ ${result.message}\nDeleted ${result.deletedCount} users.`);
      onRefresh();
    } catch (error) {
      console.error('Cleanup failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const apiError = error as { response?: { data?: { message?: string } } };
      alert(`❌ Cleanup failed: ${apiError.response?.data?.message || errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserList = () => {
    const allUsers = [
      ...scenarioState.createdUsers.farmers.map(u => ({ ...u, role: 'FARMER' })),
      ...scenarioState.createdUsers.buyers.map(u => ({ ...u, role: 'BUYER' })),
      ...scenarioState.createdUsers.transporters.map(u => ({ ...u, role: 'TRANSPORTER' })),
      ...(scenarioState.createdUsers.inspector ? [{ ...scenarioState.createdUsers.inspector, role: 'INSPECTOR' }] : []),
    ];

    return (
      <div className="space-y-2">
        {allUsers.map((user, idx) => (
          <div
            key={idx}
            className="p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => setSelectedEntity(user)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{user.name || user.email}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  user.role === 'FARMER'
                    ? 'bg-green-100 text-green-700'
                    : user.role === 'BUYER'
                    ? 'bg-blue-100 text-blue-700'
                    : user.role === 'TRANSPORTER'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-pink-100 text-pink-700'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
        ))}
        {allUsers.length === 0 && (
          <div className="text-center text-gray-500 py-8">No users created yet</div>
        )}
      </div>
    );
  };

  const renderListings = () => {
    return (
      <div className="space-y-3">
        {scenarioState.saleListings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Sale Listings</h3>
            <div className="space-y-2">
              {scenarioState.saleListings.map((listing, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-green-50 rounded border border-green-200 hover:bg-green-100 cursor-pointer"
                  onClick={() => setSelectedEntity(listing)}
                >
                  <div className="text-sm font-medium">Sale Listing #{idx + 1}</div>
                  <div className="text-xs text-gray-500">Click to view details</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scenarioState.buyListings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Buy Listings</h3>
            <div className="space-y-2">
              {scenarioState.buyListings.map((listing, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 cursor-pointer"
                  onClick={() => setSelectedEntity(listing)}
                >
                  <div className="text-sm font-medium">Buy Listing #{idx + 1}</div>
                  <div className="text-xs text-gray-500">Click to view details</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scenarioState.saleListings.length === 0 && scenarioState.buyListings.length === 0 && (
          <div className="text-center text-gray-500 py-8">No listings created yet</div>
        )}
      </div>
    );
  };

  const renderOperations = () => {
    return (
      <div className="space-y-2">
        {scenarioState.tradeOperations.map((operation, idx) => (
          <div
            key={idx}
            className="p-3 bg-purple-50 rounded border border-purple-200 hover:bg-purple-100 cursor-pointer"
            onClick={() => setSelectedEntity(operation)}
          >
            <div className="font-medium text-sm">Trade Operation #{idx + 1}</div>
            <div className="text-xs text-gray-500">Phase: {operation.phase || 'Unknown'}</div>
          </div>
        ))}
        {scenarioState.tradeOperations.length === 0 && (
          <div className="text-center text-gray-500 py-8">No trade operations created yet</div>
        )}
      </div>
    );
  };

  const renderNegotiations = () => {
    return (
      <div className="space-y-2">
        {scenarioState.negotiations.map((negotiation, idx) => (
          <div
            key={idx}
            className="p-3 bg-yellow-50 rounded border border-yellow-200 hover:bg-yellow-100 cursor-pointer"
            onClick={() => setSelectedEntity(negotiation)}
          >
            <div className="font-medium text-sm">Negotiation #{idx + 1}</div>
            <div className="text-xs text-gray-500">Status: {negotiation.status || 'Unknown'}</div>
          </div>
        ))}
        {scenarioState.negotiations.length === 0 && (
          <div className="text-center text-gray-500 py-8">No negotiations yet</div>
        )}
      </div>
    );
  };

  const renderInspections = () => {
    return (
      <div className="space-y-2">
        {scenarioState.inspections.map((inspection, idx) => (
          <div
            key={idx}
            className="p-3 bg-pink-50 rounded border border-pink-200 hover:bg-pink-100 cursor-pointer"
            onClick={() => setSelectedEntity(inspection)}
          >
            <div className="font-medium text-sm">Inspection #{idx + 1}</div>
            <div className="text-xs text-gray-500">Status: {inspection.status || 'Unknown'}</div>
          </div>
        ))}
        {scenarioState.inspections.length === 0 && (
          <div className="text-center text-gray-500 py-8">No inspections yet</div>
        )}
      </div>
    );
  };

  const renderTransport = () => {
    return (
      <div className="space-y-3">
        {scenarioState.transportRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Transport Requests</h3>
            <div className="space-y-2">
              {scenarioState.transportRequests.map((request, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-orange-50 rounded border border-orange-200 hover:bg-orange-100 cursor-pointer"
                  onClick={() => setSelectedEntity(request)}
                >
                  <div className="text-sm font-medium">Request #{idx + 1}</div>
                  <div className="text-xs text-gray-500">Status: {request.status || 'Unknown'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scenarioState.transportBids.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Transport Bids</h3>
            <div className="space-y-2">
              {scenarioState.transportBids.map((bid, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-orange-50 rounded border border-orange-200 hover:bg-orange-100 cursor-pointer"
                  onClick={() => setSelectedEntity(bid)}
                >
                  <div className="text-sm font-medium">Bid #{idx + 1}</div>
                  <div className="text-xs text-gray-500">Amount: €{bid.bidAmount || 0}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scenarioState.transportJobs.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Transport Jobs</h3>
            <div className="space-y-2">
              {scenarioState.transportJobs.map((job, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-orange-50 rounded border border-orange-200 hover:bg-orange-100 cursor-pointer"
                  onClick={() => setSelectedEntity(job)}
                >
                  <div className="text-sm font-medium">Job #{idx + 1}</div>
                  <div className="text-xs text-gray-500">Status: {job.status || 'Unknown'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scenarioState.transportRequests.length === 0 &&
          scenarioState.transportBids.length === 0 &&
          scenarioState.transportJobs.length === 0 && (
            <div className="text-center text-gray-500 py-8">No transport activities yet</div>
          )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUserList();
      case 'listings':
        return renderListings();
      case 'operations':
        return renderOperations();
      case 'negotiations':
        return renderNegotiations();
      case 'inspections':
        return renderInspections();
      case 'transport':
        return renderTransport();
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Database State Viewer</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
          <button
            onClick={handleCleanupAll}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Cleaning...' : 'Cleanup All'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">{renderContent()}</div>

      {/* Entity Detail Modal */}
      {selectedEntity && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedEntity(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Entity Details</h3>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
              {JSON.stringify(selectedEntity, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
