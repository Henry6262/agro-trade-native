import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InspectorAssignee } from '@/types';
import { InspectionQueueItem } from './InspectionQueuePanel';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const sellerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
});

interface AssignInspectorModalProps {
  open: boolean;
  inspection: InspectionQueueItem | null;
  inspectors: InspectorAssignee[];
  onClose: () => void;
  onSubmit: (inspectorId: string) => Promise<void>;
}

const haversineKm = (
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null,
): number | null => {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null
  ) {
    return null;
  }
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const AssignInspectorModal: React.FC<AssignInspectorModalProps> = ({
  open,
  inspection,
  inspectors,
  onClose,
  onSubmit,
}) => {
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sortedInspectors = useMemo(() => {
    return inspectors
      .map((inspector) => {
        const distance = haversineKm(
          inspection?.latitude,
          inspection?.longitude,
          inspector.latitude,
          inspector.longitude,
        );
        return {
          ...inspector,
          distance,
        };
      })
      .sort((a, b) => {
        if (a.distance != null && b.distance != null) {
          return a.distance - b.distance;
        }
        if (a.distance != null) return -1;
        if (b.distance != null) return 1;
        return (a.activeAssignments ?? 0) - (b.activeAssignments ?? 0);
      });
  }, [inspectors, inspection]);

  const handleAssign = async () => {
    if (!selectedInspectorId) return;
    try {
      setSubmitting(true);
      await onSubmit(selectedInspectorId);
      setSelectedInspectorId(null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const sellerPosition: [number, number] | null =
    inspection?.latitude != null && inspection?.longitude != null
      ? [inspection.latitude, inspection.longitude]
      : null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Assign inspector</DialogTitle>
          <DialogDescription>
            {inspection
              ? `Verify ${inspection.sellerName}'s listing`
              : 'Select an inspection to assign'}
          </DialogDescription>
        </DialogHeader>

        {inspection ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">
                  {inspection.sellerName}
                </p>
                <p className="text-xs text-slate-500">
                  {inspection.productName || 'Unknown product'}
                </p>
                {inspection.city && (
                  <p className="text-xs text-slate-500">
                    {inspection.city}
                    {inspection.region ? `, ${inspection.region}` : ''}
                  </p>
                )}
              </div>

              <ScrollArea className="h-64 border border-slate-200 rounded-lg">
                <div className="p-2 space-y-2">
                  {sortedInspectors.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">
                      No active inspectors found. Add inspector accounts to proceed.
                    </p>
                  ) : (
                    sortedInspectors.map((inspector) => {
                      const isSelected = inspector.id === selectedInspectorId;
                      return (
                        <button
                          key={inspector.id}
                          type="button"
                          onClick={() => setSelectedInspectorId(inspector.id)}
                          className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {inspector.name || 'Unnamed Inspector'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {inspector.city || 'Unknown location'}
                                {inspector.distance != null
                                  ? ` · ${inspector.distance} km away`
                                  : ''}
                              </p>
                            </div>
                            <span className="text-xs text-slate-500">
                              {inspector.activeAssignments || 0} active
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedInspectorId || submitting}
                >
                  {submitting ? 'Assigning…' : 'Assign inspector'}
                </Button>
              </div>
            </div>

            <div className="h-80 border border-slate-200 rounded-lg overflow-hidden">
              {sellerPosition ? (
                <MapContainer
                  center={sellerPosition}
                  zoom={7}
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={sellerPosition} icon={sellerIcon}>
                    <Popup>
                      <strong>{inspection.sellerName}</strong>
                      <br />
                      {inspection.productName}
                    </Popup>
                  </Marker>
                  {sortedInspectors
                    .filter(
                      (inspector) =>
                        inspector.latitude != null && inspector.longitude != null,
                    )
                    .map((inspector) => (
                      <Marker
                        key={inspector.id}
                        position={[inspector.latitude!, inspector.longitude!]}
                        icon={defaultIcon}
                      >
                        <Popup>
                          <strong>{inspector.name || 'Inspector'}</strong>
                          <br />
                          {inspector.city || 'Unknown location'}
                          <br />
                          {inspector.distance != null
                            ? `${inspector.distance} km from seller`
                            : ''}
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  Seller location unavailable – cannot render map.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-slate-500">
            Select an inspection to assign an inspector.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignInspectorModal;
