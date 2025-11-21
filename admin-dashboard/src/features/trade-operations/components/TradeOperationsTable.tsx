import React, { useState, useEffect } from 'react';
import * as Types from '../../../types';
import { tradeOperationService } from '../../../services/api';
import { format } from 'date-fns';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  RefreshCw, 
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle 
} from 'lucide-react';

interface Props {
  onSelectOperation: (operation: Types.TradeOperation) => void;
  onCreateNew: () => void;
}

export const TradeOperationsTable: React.FC<Props> = ({ onSelectOperation, onCreateNew }) => {
  const [operations, setOperations] = useState<Types.TradeOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const loadOperations = async () => {
    setLoading(true);
    try {
      const data = await tradeOperationService.getAll();
      setOperations(data);
    } catch (error) {
      console.error('Failed to load operations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperations();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadOperations, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredOperations = operations.filter(op => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
                         op.id?.toLowerCase().includes(searchLower) ||
                         op.buyListing?.product?.name?.toLowerCase().includes(searchLower) ||
                         op.buyListing?.buyer?.name?.toLowerCase().includes(searchLower);
    const matchesPhase = !filterPhase || op.phase === filterPhase;
    const matchesStatus = !filterStatus || op.status === filterStatus;
    return matchesSearch && matchesPhase && matchesStatus;
  });

  const getPhaseColor = (phase: Types.TradePhase) => {
    switch (phase) {
      case Types.TradePhase.INITIATION: return 'bg-gray-100 text-gray-800';
      case Types.TradePhase.SELLER_NEGOTIATION: return 'bg-blue-100 text-blue-800';
      case Types.TradePhase.TRANSPORT_MATCHING: return 'bg-orange-100 text-orange-800';
      case Types.TradePhase.IN_TRANSIT: return 'bg-purple-100 text-purple-800';
      case Types.TradePhase.DELIVERY: return 'bg-indigo-100 text-indigo-800';
      case Types.TradePhase.PAYMENT: return 'bg-yellow-100 text-yellow-800';
      case Types.TradePhase.COMPLETED: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Types.TradeStatus) => {
    switch (status) {
      case Types.TradeStatus.ACTIVE: return <CheckCircle className="w-4 h-4 text-green-600" />;
      case Types.TradeStatus.PAUSED: return <Clock className="w-4 h-4 text-yellow-600" />;
      case Types.TradeStatus.CANCELLED: return <XCircle className="w-4 h-4 text-red-600" />;
      case Types.TradeStatus.COMPLETED: return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this operation?')) {
      try {
        await tradeOperationService.delete(id);
        await loadOperations();
      } catch (error) {
        console.error('Failed to delete operation:', error);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trade Operations</h1>
          <p className="text-gray-600">Manage and monitor all trade operations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadOperations}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Operation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search by operation number or product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Phases</option>
          {Object.values(Types.TradePhase).map(phase => (
            <option key={phase} value={phase}>{phase.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {Object.values(Types.TradeStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading operations...</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sellers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOperations.map((operation) => (
                <tr 
                  key={operation.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectOperation(operation)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{operation.id.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {operation.buyListing?.buyer?.name || 'Unknown Buyer'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {operation.buyListing?.product?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {operation.buyListing?.quantity} {operation.buyListing?.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPhaseColor(operation.phase)}`}>
                      {operation.phase.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(operation.status)}
                      <span className="text-sm text-gray-900">{operation.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {operation.sellers?.length || 0}
                      </span>
                      {operation.sellers?.filter(s => s.isVerified).length > 0 && (
                        <span className="text-xs text-green-600 ml-1">
                          ({operation.sellers.filter(s => s.isVerified).length} verified)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {operation.estimatedProfit ? (
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`w-4 h-4 ${operation.estimatedProfit > 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-sm font-semibold ${operation.estimatedProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{operation.estimatedProfit.toFixed(0)}
                        </span>
                        {operation.profitMargin && (
                          <span className="text-xs text-gray-500">
                            ({operation.profitMargin.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(operation.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOperation(operation);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(operation.id, e)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filteredOperations.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500">No operations found</p>
          </div>
        )}
      </div>
    </div>
  );
};