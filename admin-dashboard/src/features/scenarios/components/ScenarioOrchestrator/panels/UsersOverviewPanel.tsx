import React from 'react';
import type { SimulationUser } from '../../../../../services/simulationApi';

interface UsersOverviewPanelProps {
  users: {
    buyers: SimulationUser[];
    farmers: SimulationUser[];
    transporters: SimulationUser[];
    inspectors: SimulationUser[];
  };
}

export const UsersOverviewPanel: React.FC<UsersOverviewPanelProps> = ({ users }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-2">Buyers ({users.buyers.length})</h3>
        <div className="space-y-1 text-sm">
          {users.buyers.map((user) => (
            <div key={user.id} className="text-gray-700">
              {user.name || user.email}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-2">Farmers ({users.farmers.length})</h3>
        <div className="space-y-1 text-sm">
          {users.farmers.map((user) => (
            <div key={user.id} className="text-gray-700">
              {user.name || user.email}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-2">
          Transporters ({users.transporters.length})
        </h3>
        <div className="space-y-1 text-sm">
          {users.transporters.map((user) => (
            <div key={user.id} className="text-gray-700">
              {user.name || user.email}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-2">
          Inspectors ({users.inspectors.length})
        </h3>
        <div className="space-y-1 text-sm">
          {users.inspectors.map((user) => (
            <div key={user.id} className="text-gray-700">
              {user.name || user.email}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
