import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState, SkeletonList, EnhancedTooltip } from '../../../../components/common';
import { InspectionPhotoGallery } from '../InspectionPhotoGallery';

interface InspectionResult {
  id: string;
  status: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  requestedDate: string;
  scheduledDate?: string | null;
  completedDate?: string | null;
  qualityScore?: number | null;
  verificationResult?: {
    actualQuantity?: number;
    actualQuality?: string;
    moistureContent?: number;
    foreignMatter?: number;
    brokenGrains?: number;
    discoloration?: boolean;
    pestDamage?: boolean;
    productSpecifications?: {
      variety?: string;
      grade?: string;
      origin?: string;
      harvestDate?: string;
    };
  } | null;
  notes?: string | null;
  photos?: string[] | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  saleListing?: {
    id: string;
    quantity?: number | null;
    unit?: string | null;
    askingPrice?: number | null;
    product?: {
      id: string;
      name: string;
      category?: string | null;
    } | null;
    seller?: {
      id: string;
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
  inspector?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface InspectionResultsPanelProps {
  tradeOperationId: string;
}

export const InspectionResultsPanel: React.FC<InspectionResultsPanelProps> = ({
  tradeOperationId,
}) => {
  const [inspections, setInspections] = useState<InspectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionResult | null>(null);

  useEffect(() => {
    fetchInspections();
  }, [tradeOperationId]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        API_ENDPOINTS.inspections.base + `/trade-operation/${tradeOperationId}`
      );
      setInspections(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching inspections:', err);
      setError('Failed to load inspection results');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      PENDING: { variant: 'outline', label: 'PENDING' },
      SCHEDULED: { variant: 'secondary', label: 'SCHEDULED' },
      IN_PROGRESS: { variant: 'default', label: 'IN PROGRESS' },
      COMPLETED: { variant: 'default', label: 'COMPLETED' },
      CANCELLED: { variant: 'destructive', label: 'CANCELLED' },
    };
    const config = variants[status] || variants.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-100 text-blue-800 border-blue-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      HIGH: 'bg-red-100 text-red-800 border-red-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[priority] || colors.MEDIUM}`}>
        {priority}
      </span>
    );
  };

  const getQualityScoreBadge = (score: number) => {
    let color = 'bg-gray-100 text-gray-800 border-gray-300';
    if (score >= 90) color = 'bg-green-100 text-green-800 border-green-300';
    else if (score >= 75) color = 'bg-blue-100 text-blue-800 border-blue-300';
    else if (score >= 60) color = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    else color = 'bg-red-100 text-red-800 border-red-300';

    return (
      <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${color}`}>
        {score}/100
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100 border-b-2 border-purple-300">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <div>
              <CardTitle>Inspection Results</CardTitle>
              <CardDescription>Quality verification results from inspectors</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <SkeletonList count={3} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100 border-b-2 border-purple-300">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <div>
              <CardTitle>Inspection Results</CardTitle>
              <CardDescription>Quality verification results from inspectors</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ErrorState error={error} onRetry={fetchInspections} />
        </CardContent>
      </Card>
    );
  }

  if (inspections.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100 border-b-2 border-purple-300">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <div>
              <CardTitle>Inspection Results</CardTitle>
              <CardDescription>Quality verification results from inspectors</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-text-secondary">
            <span className="text-6xl opacity-30 block mb-4 animate-pulse">🔍</span>
            <p className="font-semibold text-lg">No inspections requested yet</p>
            <p className="text-sm mt-2">Request inspections for accepted offers to verify product quality</p>
            <div className="mt-4 text-xs bg-purple-50 border border-purple-200 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-purple-800">
                💡 <span className="font-semibold">Tip:</span> Inspections are required before finalizing the trade operation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100 border-b-2 border-purple-300">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <div>
              <CardTitle>Inspection Results ({inspections.length})</CardTitle>
              <CardDescription>Quality verification results from inspectors</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {inspections.map((inspection) => (
            <div
              key={inspection.id}
              className="border border-gray-300 rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-white hover:border-purple-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-text-primary">
                      {inspection.saleListing?.seller?.name || 'Unknown Seller'}
                    </h4>
                    {getStatusBadge(inspection.status)}
                    {getPriorityBadge(inspection.priority)}
                  </div>
                  <p className="text-sm text-text-secondary">
                    {inspection.saleListing?.product?.name || 'Unknown Product'} •{' '}
                    {inspection.saleListing?.quantity}
                    {inspection.saleListing?.unit}
                  </p>
                </div>
                {inspection.qualityScore !== null && inspection.qualityScore !== undefined && (
                  <div>{getQualityScoreBadge(inspection.qualityScore)}</div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <p className="text-xs text-text-secondary">Requested</p>
                  <p className="font-semibold">
                    {new Date(inspection.requestedDate).toLocaleDateString()}
                  </p>
                </div>
                {inspection.scheduledDate && (
                  <div>
                    <p className="text-xs text-text-secondary">Scheduled</p>
                    <p className="font-semibold">
                      {new Date(inspection.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {inspection.completedDate && (
                  <div>
                    <p className="text-xs text-text-secondary">Completed</p>
                    <p className="font-semibold">
                      {new Date(inspection.completedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {inspection.inspector && (
                  <div>
                    <p className="text-xs text-text-secondary">Inspector</p>
                    <p className="font-semibold">{inspection.inspector.name}</p>
                  </div>
                )}
              </div>

              {inspection.status === 'COMPLETED' && inspection.verificationResult && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-bold text-text-secondary mb-2">VERIFICATION RESULTS</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {inspection.verificationResult.actualQuantity !== undefined && (
                      <div>
                        <p className="text-xs text-text-secondary">Actual Quantity</p>
                        <p className="font-semibold">
                          {inspection.verificationResult.actualQuantity}
                          {inspection.saleListing?.unit}
                        </p>
                      </div>
                    )}
                    {inspection.verificationResult.actualQuality && (
                      <div>
                        <p className="text-xs text-text-secondary">Quality Grade</p>
                        <p className="font-semibold">{inspection.verificationResult.actualQuality}</p>
                      </div>
                    )}
                    {inspection.verificationResult.moistureContent !== undefined && (
                      <div>
                        <p className="text-xs text-text-secondary">Moisture Content</p>
                        <p className="font-semibold">{inspection.verificationResult.moistureContent}%</p>
                      </div>
                    )}
                    {inspection.verificationResult.foreignMatter !== undefined && (
                      <div>
                        <p className="text-xs text-text-secondary">Foreign Matter</p>
                        <p className="font-semibold">{inspection.verificationResult.foreignMatter}%</p>
                      </div>
                    )}
                    {inspection.verificationResult.brokenGrains !== undefined && (
                      <div>
                        <p className="text-xs text-text-secondary">Broken Grains</p>
                        <p className="font-semibold">{inspection.verificationResult.brokenGrains}%</p>
                      </div>
                    )}
                    {inspection.verificationResult.discoloration !== undefined && (
                      <div>
                        <p className="text-xs text-text-secondary">Discoloration</p>
                        <p className="font-semibold">
                          {inspection.verificationResult.discoloration ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )}
                    {inspection.verificationResult.pestDamage !== undefined && (
                      <div>
                        <p className="text-xs text-text-secondary">Pest Damage</p>
                        <p className="font-semibold">
                          {inspection.verificationResult.pestDamage ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {inspection.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-bold text-blue-900 mb-1">INSPECTOR NOTES</p>
                  <p className="text-sm text-blue-800">{inspection.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {inspection.photos && inspection.photos.length > 0 && (
                  <EnhancedTooltip content="View inspection photos in gallery">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedInspection(inspection)}
                      className="hover:bg-purple-50 transition-colors"
                      aria-label={`View ${inspection.photos.length} inspection photos`}
                    >
                      📷 View Photos ({inspection.photos.length})
                    </Button>
                  </EnhancedTooltip>
                )}
                {inspection.address && (
                  <EnhancedTooltip content="Inspection location">
                    <Button size="sm" variant="outline" className="hover:bg-blue-50 transition-colors">
                      📍 {inspection.address}
                    </Button>
                  </EnhancedTooltip>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

      {/* Photo Gallery Modal */}
      {selectedInspection && selectedInspection.photos && selectedInspection.photos.length > 0 && (
        <InspectionPhotoGallery
          photos={selectedInspection.photos}
          isOpen={!!selectedInspection}
          onClose={() => setSelectedInspection(null)}
          sellerName={selectedInspection.saleListing?.seller?.name || 'Unknown Seller'}
          productName={selectedInspection.saleListing?.product?.name || 'Unknown Product'}
        />
      )}
    </>
  );
};

export default InspectionResultsPanel;
