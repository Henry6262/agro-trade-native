import React from 'react';
import * as Types from '../../../../../types';
import { Shield } from 'lucide-react';

interface InspectionsTabProps {
  inspections: Types.InspectionRequest[];
  loading: boolean;
  onRequestInspections: () => void;
}

export const InspectionsTab: React.FC<InspectionsTabProps> = ({
  inspections,
  loading,
  onRequestInspections,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Inspections ({inspections.length})</h3>
        <button
          onClick={onRequestInspections}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Request Inspections
        </button>
      </div>

      {inspections.map((inspection) => (
        <div key={inspection.id} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{inspection.saleListing?.seller?.name}</h4>
              <p className="text-sm text-gray-600">
                Priority: {inspection.priority} • Status: {inspection.status}
              </p>
              {inspection.qualityScore !== undefined && (
                <p className="text-sm font-semibold text-green-600 mt-1">
                  Quality Score: {inspection.qualityScore}%
                </p>
              )}
            </div>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                inspection.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : inspection.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-800'
                  : inspection.status === 'SCHEDULED'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {inspection.status}
            </span>
          </div>
        </div>
      ))}

      {inspections.length === 0 && (
        <div className="text-center py-8 text-gray-500">No inspections requested yet</div>
      )}
    </div>
  );
};
