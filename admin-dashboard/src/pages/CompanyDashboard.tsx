import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Truck, 
  DollarSign, 
  Activity, 
  FileText,
  Plus,
  Edit,
  Eye,
  Shield,
  Clock
} from 'lucide-react';

const getAccessToken = (): string | null => {
  const direct = localStorage.getItem('token');
  if (direct) return direct;

  const persisted = localStorage.getItem('auth-storage');
  if (persisted) {
    try {
      const parsed = JSON.parse(persisted);
      return parsed?.state?.token ?? null;
    } catch (error) {
      console.warn('Failed to parse persisted auth storage', error);
    }
  }

  return null;
};

interface CompanyStats {
  transporters: number;
  activeBids: number;
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
  fleetSize: number;
}

interface Transporter {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_JOB';
  completedJobs: number;
  rating: number;
  joinedAt: string;
}

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [companyData, setCompanyData] = useState<any>(null);
  const [stats, setStats] = useState<CompanyStats>({
    transporters: 0,
    activeBids: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalRevenue: 0,
    fleetSize: 0
  });
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyData();
    fetchStats();
    fetchTransporters();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch('/api/transport-company/my-company', {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCompanyData(data.data);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch stats from API
      setStats({
        transporters: 12,
        activeBids: 5,
        activeJobs: 3,
        completedJobs: 148,
        totalRevenue: 285000,
        fleetSize: 15
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTransporters = async () => {
    try {
      // Mock data for now
      setTransporters([
        {
          id: '1',
          name: 'John Driver',
          email: 'john@example.com',
          phoneNumber: '+359888123456',
          status: 'ACTIVE',
          completedJobs: 45,
          rating: 4.8,
          joinedAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'Peter Transport',
          email: 'peter@example.com',
          phoneNumber: '+359888654321',
          status: 'ON_JOB',
          completedJobs: 67,
          rating: 4.9,
          joinedAt: '2024-02-20'
        },
        {
          id: '3',
          name: 'Maria Logistics',
          email: 'maria@example.com',
          phoneNumber: '+359888789456',
          status: 'INACTIVE',
          completedJobs: 23,
          rating: 4.5,
          joinedAt: '2024-03-10'
        }
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transporters:', error);
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Transporters</p>
              <p className="text-2xl font-bold text-gray-900">{stats.transporters}</p>
            </div>
            <Users className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
            </div>
            <Activity className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Fleet Size</p>
              <p className="text-2xl font-bold text-gray-900">{stats.fleetSize}</p>
            </div>
            <Truck className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Bids</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeBids}</p>
            </div>
            <FileText className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedJobs}</p>
            </div>
            <Shield className="h-10 w-10 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium">New bid submitted</p>
                <p className="text-sm text-gray-500">Transport request #TR-2024-089 - €4,500</p>
              </div>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium">Job completed</p>
                <p className="text-sm text-gray-500">John Driver completed delivery to Sofia</p>
              </div>
              <span className="text-sm text-gray-400">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium">Bid accepted</p>
                <p className="text-sm text-gray-500">Won transport contract #TR-2024-087</p>
              </div>
              <span className="text-sm text-gray-400">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransporters = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Manage Transporters</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Transporter
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jobs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transporters.map((transporter) => (
              <tr key={transporter.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{transporter.name}</div>
                    <div className="text-sm text-gray-500">Since {transporter.joinedAt}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">{transporter.email}</div>
                    <div className="text-sm text-gray-500">{transporter.phoneNumber}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transporter.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    transporter.status === 'ON_JOB' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {transporter.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transporter.completedJobs}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{transporter.rating}</span>
                    <span className="text-yellow-400 ml-1">★</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    <Edit className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFleet = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Fleet Management</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Vehicle Cards */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <Truck className="h-8 w-8 text-gray-600" />
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Available
              </span>
            </div>
            <h4 className="font-semibold text-gray-900">BG 1234 AB</h4>
            <p className="text-sm text-gray-500">Flatbed • 20 tons</p>
            <p className="text-sm text-gray-500 mt-2">Driver: John Driver</p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-400">143 deliveries</span>
              <button className="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <Truck className="h-8 w-8 text-gray-600" />
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                On Route
              </span>
            </div>
            <h4 className="font-semibold text-gray-900">BG 5678 CD</h4>
            <p className="text-sm text-gray-500">Refrigerated • 15 tons</p>
            <p className="text-sm text-gray-500 mt-2">Driver: Peter Transport</p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-400">89 deliveries</span>
              <button className="text-blue-600 hover:text-blue-800 text-sm">Track</button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <Truck className="h-8 w-8 text-gray-600" />
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                Maintenance
              </span>
            </div>
            <h4 className="font-semibold text-gray-900">BG 9012 EF</h4>
            <p className="text-sm text-gray-500">Container • 25 tons</p>
            <p className="text-sm text-gray-500 mt-2">Driver: Not Assigned</p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-400">201 deliveries</span>
              <button className="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {companyData?.companyName || 'Transport Company'} Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your transporters, fleet, and operations
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {['overview', 'transporters', 'fleet', 'bids', 'jobs', 'documents'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'transporters' && renderTransporters()}
        {activeTab === 'fleet' && renderFleet()}
        {activeTab === 'bids' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Bids</h3>
            <p className="text-gray-500">Manage your transport bids here...</p>
          </div>
        )}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Jobs</h3>
            <p className="text-gray-500">Track ongoing transport jobs...</p>
          </div>
        )}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Documents</h3>
            <p className="text-gray-500">Upload and manage company documents...</p>
          </div>
        )}
      </div>
    </div>
  );
}
