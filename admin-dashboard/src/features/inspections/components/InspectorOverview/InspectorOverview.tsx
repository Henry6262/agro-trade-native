import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MapPin, RefreshCw } from 'lucide-react';
import type { InspectorAssignee, InspectionRequest } from '@/types';
import { inspectionService } from '@/services/api';
import { toast } from 'sonner';
import CompleteInspectionModal from '../CompleteInspectionModal';
import type { InspectionCompletionContext, InspectionCompletionMode } from '../../types';

const inspectorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const selectedInspectorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
});

const missionIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const statusBadgeClasses: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
  SCHEDULED: 'bg-blue-100 text-blue-800 border border-blue-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  FAILED: 'bg-rose-100 text-rose-800 border border-rose-200',
};

const priorityBadgeClasses: Record<string, string> = {
  URGENT: 'bg-rose-100 text-rose-800 border border-rose-200',
  HIGH: 'bg-orange-100 text-orange-800 border border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  LOW: 'bg-slate-100 text-slate-700 border border-slate-200',
};

export const InspectorOverview: React.FC = () => {
  const [inspectors, setInspectors] = useState<InspectorAssignee[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | null>(null);
  const [loadingInspectors, setLoadingInspectors] = useState(false);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [completionContext, setCompletionContext] = useState<InspectionCompletionContext | null>(
    null,
  );
  const [completionMode, setCompletionMode] = useState<InspectionCompletionMode>('PASS');
  const [completing, setCompleting] = useState(false);

  const fetchInspectors = useCallback(async () => {
    try {
      setLoadingInspectors(true);
      const data = await inspectionService.getInspectors();
      setInspectors(data);
      if (data.length > 0 && !selectedInspectorId) {
        setSelectedInspectorId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load inspectors:', error);
      setInspectors([]);
    } finally {
      setLoadingInspectors(false);
    }
  }, [selectedInspectorId]);

  const fetchInspections = useCallback(async () => {
    try {
      setLoadingInspections(true);
      const response = await inspectionService.list({ limit: 200 });
      const payload = Array.isArray(response) ? response : response?.data;
      setInspections(payload || []);
    } catch (error) {
      console.error('Failed to load inspections:', error);
      setInspections([]);
    } finally {
      setLoadingInspections(false);
    }
  }, []);

  useEffect(() => {
    fetchInspectors();
    fetchInspections();
  }, [fetchInspectors, fetchInspections]);

  const missionsByInspector = useMemo(() => {
    const map = new Map<string, InspectionRequest[]>();
    inspections.forEach((inspection) => {
      if (!inspection.inspector?.id) return;
      if (!map.has(inspection.inspector.id)) {
        map.set(inspection.inspector.id, []);
      }
      map.get(inspection.inspector.id)?.push(inspection);
    });
    return map;
  }, [inspections]);

  const selectedInspector = useMemo(
    () => inspectors.find((inspector) => inspector.id === selectedInspectorId) || null,
    [inspectors, selectedInspectorId],
  );

  const selectedMissions = useMemo(() => {
    if (!selectedInspectorId) return [];
    return missionsByInspector.get(selectedInspectorId) || [];
  }, [missionsByInspector, selectedInspectorId]);

  const nextMission = useMemo(() => {
    if (selectedMissions.length === 0) return null;
    return [...selectedMissions].sort((a, b) => {
      const aDate = a.requestedDate ? new Date(a.requestedDate).getTime() : 0;
      const bDate = b.requestedDate ? new Date(b.requestedDate).getTime() : 0;
      return aDate - bDate;
    })[0];
  }, [selectedMissions]);

  const handleRefresh = () => {
    fetchInspectors();
    fetchInspections();
  };

  const inspectorCounts = useMemo(() => {
    const scheduled = inspections.filter((i) => i.status === 'SCHEDULED').length;
    const inProgress = inspections.filter((i) => i.status === 'IN_PROGRESS').length;
    const pending = inspections.filter((i) => i.status === 'PENDING').length;
    return { scheduled, inProgress, pending };
  }, [inspections]);

  const openCompletionModal = useCallback(
    (inspection: InspectionRequest, mode: InspectionCompletionMode) => {
      setCompletionMode(mode);
      setCompletionContext({
        inspectionId: inspection.id,
        sellerName: inspection.saleListing?.seller?.name,
        productName: inspection.saleListing?.product?.name,
        address: inspection.address,
        quantity: inspection.saleListing?.quantity ?? undefined,
        unit: inspection.saleListing?.unit ?? undefined,
      });
    },
    [],
  );

  const handleCompletionSubmit = useCallback(
    async (values: {
      qualityScore: number;
      actualQuantity?: number;
      moistureContent?: number;
      notes: string;
      recommendVerification: boolean;
    }) => {
      if (!completionContext) {
        return;
      }
      try {
        setCompleting(true);
        await inspectionService.submitResult(completionContext.inspectionId, {
          qualityScore: values.qualityScore,
          verificationResult: {
            actualQuantity: values.actualQuantity,
            moistureContent: values.moistureContent,
            actualQuality:
              completionMode === 'PASS'
                ? 'Verified quality meets requirements'
                : 'Inspection failed - issues detected',
          },
          notes: values.notes,
          photos: [],
          recommendVerification: values.recommendVerification,
        });
        toast.success(
          completionMode === 'PASS'
            ? 'Inspection completed successfully'
            : 'Inspection marked as failed',
        );
        setCompletionContext(null);
        await fetchInspections();
        await fetchInspectors();
      } catch (error) {
        console.error('Failed to submit inspection:', error);
        toast.error('Unable to submit inspection results.');
      } finally {
        setCompleting(false);
      }
    },
    [completionContext, completionMode, fetchInspections, fetchInspectors],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Inspector operations</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Nationwide coverage map</h1>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loadingInspectors || loadingInspections}>
          {(loadingInspectors || loadingInspections) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Inspectors online</p>
          <p className="text-3xl font-semibold text-slate-900">
            {loadingInspectors ? '—' : inspectors.length}
          </p>
          <p className="text-xs text-slate-500 mt-2">Active accounts with tracker data</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Missions scheduled</p>
          <p className="text-3xl font-semibold text-blue-600">{inspectorCounts.scheduled}</p>
          <p className="text-xs text-slate-500 mt-2">Awaiting dispatch / scheduled</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Missions in progress</p>
          <p className="text-3xl font-semibold text-emerald-600">{inspectorCounts.inProgress}</p>
          <p className="text-xs text-slate-500 mt-2">Inspectors currently on-site</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <div className="bg-white border border-slate-200 rounded-xl h-[420px] overflow-hidden shadow-sm">
            <div className="h-full w-full">
              <MapContainer
                center={[42.6977, 25.4858]}
                zoom={7}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {inspectors
                  .filter((inspector) => inspector.latitude != null && inspector.longitude != null)
                  .map((inspector) => (
                    <Marker
                      key={inspector.id}
                      position={[inspector.latitude!, inspector.longitude!]}
                      icon={inspector.id === selectedInspectorId ? selectedInspectorIcon : inspectorIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{inspector.name || 'Inspector'}</p>
                          <p className="text-slate-500 text-xs">
                            {inspector.city || 'Unknown'}
                            {inspector.region ? `, ${inspector.region}` : ''}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {inspector.activeAssignments || 0} active assignments
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {selectedMissions
                  .filter((mission) => mission.latitude != null && mission.longitude != null)
                  .map((mission) => (
                    <Marker
                      key={mission.id}
                      position={[mission.latitude!, mission.longitude!]}
                      icon={missionIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">
                            {mission.saleListing?.seller?.name || 'Seller'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {mission.saleListing?.product?.name || 'Product'} ·{' '}
                            {mission.status.toLowerCase()}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            {selectedInspector ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-full">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Selected inspector</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedInspector.name || 'Inspector'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedInspector.city || 'Unknown location'}
                      {selectedInspector.region ? `, ${selectedInspector.region}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
                  <p className="text-slate-500">Active missions</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {selectedMissions.length}
                  </p>

                  {nextMission ? (
                    <div className="mt-3 rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Next stop</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {nextMission.saleListing?.seller?.name || 'Seller'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {nextMission.saleListing?.product?.name || 'Product'}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Badge className={priorityBadgeClasses[nextMission.priority] || 'bg-slate-100'}>
                          {nextMission.priority}
                        </Badge>
                        <Badge
                          className={statusBadgeClasses[nextMission.status] || 'bg-slate-100 text-slate-700'}
                        >
                          {nextMission.status}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      No missions assigned to this inspector yet.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500 text-center py-10">
                Select an inspector to view details.
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Inspector roster</p>
                <p className="text-xs text-slate-500">
                  {loadingInspectors ? 'Updating positions…' : 'Live positions and workloads'}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="h-64">
              <div className="p-2 space-y-2">
                {(loadingInspectors && inspectors.length === 0) ? (
                  <div className="text-center py-12 text-sm text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading inspector data…
                  </div>
                ) : inspectors.length === 0 ? (
                  <div className="text-center py-12 text-sm text-slate-500">
                    No inspectors found. Add inspector accounts to see them here.
                  </div>
                ) : (
                  inspectors.map((inspector) => {
                    const missions = missionsByInspector.get(inspector.id) || [];
                    return (
                      <button
                        key={inspector.id}
                        type="button"
                        onClick={() => setSelectedInspectorId(inspector.id)}
                        className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                          inspector.id === selectedInspectorId
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {inspector.name || 'Inspector'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {inspector.city || 'Unknown'}
                              {inspector.region ? `, ${inspector.region}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {missions.length}
                            </p>
                            <p className="text-xs text-slate-500">missions</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-900">Mission queue</p>
            <p className="text-xs text-slate-500">
              {inspections.length} inspections tracked across the network
            </p>
          </div>
        </div>
        <ScrollArea className="max-h-96">
          <div className="divide-y divide-slate-100">
            {(loadingInspections && inspections.length === 0) ? (
              <div className="text-center py-12 text-sm text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading inspections…
              </div>
            ) : inspections.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-500">
                No inspection missions at the moment.
              </div>
            ) : (
              inspections.map((inspection) => (
                <div key={inspection.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {inspection.saleListing?.seller?.name || 'Seller'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {inspection.saleListing?.product?.name || 'Product'} ·{' '}
                      {inspection.address || 'Unknown address'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityBadgeClasses[inspection.priority] || 'bg-slate-100'}>
                      {inspection.priority}
                    </Badge>
                    <Badge className={statusBadgeClasses[inspection.status] || 'bg-slate-100 text-slate-700'}>
                      {inspection.status}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {inspection.inspector?.name || 'Unassigned'}
                    </span>
                    {(inspection.status === 'SCHEDULED' || inspection.status === 'IN_PROGRESS') && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-700"
                          onClick={() => openCompletionModal(inspection, 'FAIL')}
                        >
                          Fail
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => openCompletionModal(inspection, 'PASS')}
                        >
                          Pass
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <CompleteInspectionModal
        open={Boolean(completionContext)}
        inspection={completionContext}
        mode={completionMode}
        loading={completing}
        onClose={() => setCompletionContext(null)}
        onSubmit={handleCompletionSubmit}
      />
    </div>
  );
};

export default InspectorOverview;
