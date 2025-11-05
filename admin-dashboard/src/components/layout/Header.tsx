import { Package, FlaskConical, Map, ClipboardCheck, Truck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveRoute = () => {
    if (location.pathname === '/matching') return 'matching';
    if (location.pathname === '/scenarios') return 'scenarios';
    if (location.pathname === '/inspections') return 'inspections';
    if (location.pathname === '/transport') return 'transport';
    return 'operations';
  };

  const currentView = getActiveRoute();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-xl font-bold text-gray-900">
              Agro-Trade Admin
            </h1>
            <div className="ml-4 flex gap-2">
              <button
                onClick={() => navigate('/matching')}
                className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                  currentView === 'matching'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Map className="w-3 h-3" />
                Map Matching
              </button>
              <button
                onClick={() => navigate('/operations')}
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  currentView === 'operations'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Trade Operations
              </button>
              <button
                onClick={() => navigate('/inspections')}
                className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                  currentView === 'inspections'
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ClipboardCheck className="w-3 h-3" />
                Inspections
              </button>
              <button
                onClick={() => navigate('/transport')}
                className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                  currentView === 'transport'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Truck className="w-3 h-3" />
                Transport
              </button>
              <button
                onClick={() => navigate('/scenarios')}
                className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                  currentView === 'scenarios'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FlaskConical className="w-3 h-3" />
                Scenarios
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Admin Dashboard v1.0
          </div>
        </div>
      </div>
    </header>
  );
}
