import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TransportRequestListItem } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const statusColors: Record<string, string> = {
  OPEN: '#f97316',
  ASSIGNED: '#2563eb',
  IN_TRANSIT: '#0ea5e9',
  COMPLETED: '#16a34a',
};

const pickupIcon = (color: string) =>
  new L.DivIcon({
    className: 'transport-pickup-icon',
    html: `<div style="
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background:${color};
      border:2px solid white;
      box-shadow:0 0 6px rgba(0,0,0,0.3);
    "></div>`,
    iconAnchor: [9, 9],
  });

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface TransportOverviewMapProps {
  requests: TransportRequestListItem[];
}

export const TransportOverviewMap: React.FC<TransportOverviewMapProps> = ({ requests }) => {
  const markers = useMemo(() => {
    const pickupMarkers: Array<{
      lat: number;
      lng: number;
      label: string;
      request: TransportRequestListItem;
    }> = [];
    const deliveryMarkers: Array<{
      lat: number;
      lng: number;
      request: TransportRequestListItem;
    }> = [];

    requests.forEach((request) => {
      request.pickupPoints.forEach((point) => {
        if (point.lat && point.lng) {
          pickupMarkers.push({
            lat: point.lat,
            lng: point.lng,
            label: point.sellerName || 'Pickup',
            request,
          });
        }
      });

      if (request.deliveryPoint?.lat && request.deliveryPoint.lng) {
        deliveryMarkers.push({
          lat: request.deliveryPoint.lat,
          lng: request.deliveryPoint.lng,
          request,
        });
      }
    });

    return { pickupMarkers, deliveryMarkers };
  }, [requests]);

  const hasMarkers =
    markers.pickupMarkers.length > 0 || markers.deliveryMarkers.length > 0;

  const center = hasMarkers
    ? [
        markers.pickupMarkers[0]?.lat ||
          markers.deliveryMarkers[0]?.lat ||
          42.7,
        markers.pickupMarkers[0]?.lng ||
          markers.deliveryMarkers[0]?.lng ||
          25.5,
      ]
    : [42.7, 25.5];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transport map overview</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <MapContainer
          center={center as [number, number]}
          zoom={7}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {markers.pickupMarkers.map((marker, idx) => (
            <Marker
              key={`pickup-${idx}`}
              position={[marker.lat, marker.lng]}
              icon={pickupIcon(statusColors[marker.request.status] || '#6b7280')}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{marker.label}</p>
                  <p className="text-xs text-slate-500">
                    Request #{marker.request.requestNumber} · {marker.request.status}
                  </p>
                  <p className="text-xs text-slate-500">
                    {marker.request.deliveryPoint?.address || 'Delivery TBD'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {markers.deliveryMarkers.map((marker, idx) => (
            <Marker
              key={`delivery-${idx}`}
              position={[marker.lat, marker.lng]}
              icon={deliveryIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Delivery · Request #{marker.request.requestNumber}</p>
                  <p className="text-xs text-slate-500">
                    Buyer: {marker.request.deliveryPoint?.buyerName || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Status: {marker.request.status}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
};

export default TransportOverviewMap;
