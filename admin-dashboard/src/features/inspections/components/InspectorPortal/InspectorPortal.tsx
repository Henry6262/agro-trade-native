import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Filter, Search, AlertCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import type { InspectionRequest } from '../../../../types';
import { InspectionForm } from './InspectionForm';
import axios from 'axios';

const API_BASE = 'http://localhost:4000';

interface InspectorPortalProps {
  className?: string;
}

const getAuthToken = () => localStorage.getItem('adminToken');

export const InspectorPortal: React.FC<InspectorPortalProps> = ({ className = '' }) => {
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionRequest | null>(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch inspections
  const fetchInspections = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/inspections`, {
        params: { status: 'PENDING' },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setInspections(response.data);
    } catch (err: any) {
      console.error('Error fetching inspections:', err);
      setError(err.response?.data?.message || 'Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchInspections, 60000);
    return () => clearInterval(interval);
  }, []);

  // Extract unique products and regions for filters
  const products = Array.from(new Set(
    inspections
      .map(i => i.saleListing?.product?.name)
      .filter(Boolean) as string[]
  ));

  const regions = Array.from(new Set(
    inspections
      .map(i => i.address?.split(',').pop()?.trim())
      .filter(Boolean) as string[]
  ));

  // Apply filters
  const filteredInspections = inspections.filter(inspection => {
    // Priority filter
    if (priorityFilter !== 'ALL' && inspection.priority !== priorityFilter) {
      return false;
    }

    // Product filter
    if (productFilter !== 'ALL' && inspection.saleListing?.product?.name !== productFilter) {
      return false;
    }

    // Region filter
    if (regionFilter !== 'ALL') {
      const inspectionRegion = inspection.address?.split(',').pop()?.trim();
      if (inspectionRegion !== regionFilter) {
        return false;
      }
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSeller = inspection.saleListing?.seller?.name?.toLowerCase().includes(searchLower);
      const matchesProduct = inspection.saleListing?.product?.name?.toLowerCase().includes(searchLower);
      const matchesLocation = inspection.address?.toLowerCase().includes(searchLower);

      if (!matchesSeller && !matchesProduct && !matchesLocation) {
        return false;
      }
    }

    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartInspection = (inspection: InspectionRequest) => {
    setSelectedInspection(inspection);
  };

  const handleInspectionComplete = () => {
    setSelectedInspection(null);
    fetchInspections(); // Refresh the list
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pending Inspections</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredInspections.length} inspection{filteredInspections.length !== 1 ? 's' : ''} pending
                </p>
              </div>
            </div>

            <button
              onClick={fetchInspections}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search seller, product, location..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Product Filter */}
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Products</option>
              {products.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>

            {/* Region Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && inspections.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading inspections...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-red-900 font-semibold">Error Loading Inspections</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Inspections</h3>
            <p className="text-gray-500">
              {inspections.length === 0
                ? 'There are no inspection requests at the moment.'
                : 'No inspections match your current filters.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {inspection.saleListing?.seller?.name || 'Unknown Seller'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inspection.saleListing?.seller?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {inspection.saleListing?.product?.name || 'Unknown Product'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {inspection.saleListing?.quantity} {inspection.saleListing?.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {inspection.address || `${inspection.latitude.toFixed(4)}, ${inspection.longitude.toFixed(4)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(inspection.priority)}`}>
                        {inspection.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(inspection.requestedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(inspection.status)}`}>
                        {getStatusIcon(inspection.status)}
                        {inspection.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleStartInspection(inspection)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        Start Inspection
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Form Modal */}
      {selectedInspection && (
        <InspectionForm
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
          onComplete={handleInspectionComplete}
        />
      )}
    </div>
  );
};
