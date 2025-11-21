import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TransportRequestSummary } from '../../../../types';

const pickupIcon = (index: number) =>
  new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: #ef4444;
      color: white;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${index}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [32, 52],
  iconAnchor: [16, 52],
  popupAnchor: [1, -34],
  shadowSize: [52, 52],
});

interface RouteMapModalProps {
  request: TransportRequestSummary;
  onClose: () => void;
}

export const RouteMapModal: React.FC<RouteMapModalProps> = ({ request, onClose }) => {
  const pickupPoints = request.pickupPoints.filter((p) => p.lat && p.lng);
  const deliveryPoint = request.deliveryPoint;

  const mapCenter = useMemo(() => {
    const points: Array<[number, number]> = [];
    pickupPoints.forEach((point) => {
      if (point.lat && point.lng) {
        points.push([point.lat, point.lng]);
      }
    });
    if (deliveryPoint?.lat && deliveryPoint?.lng) {
      points.push([deliveryPoint.lat, deliveryPoint.lng]);
    }

    if (points.length === 0) {
      return [42.7, 25.5] as [number, number];
    }

    const avgLat = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const avgLng = points.reduce((sum, p) => sum + p[1], 0) / points.length;
    return [avgLat, avgLng] as [number, number];
  }, [pickupPoints, deliveryPoint]);

  const routeCoordinates: [number, number][] = [
    ...pickupPoints.map((p) => [p.lat!, p.lng!]),
    ...(deliveryPoint?.lat && deliveryPoint?.lng ? [[deliveryPoint.lat, deliveryPoint.lng] as [number, number]] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Route overview · Request #{request.requestNumber}</h2>
            <p className="text-sm text-blue-100">
              {pickupPoints.length} pickup point{pickupPoints.length === 1 ? '' : 's'}
              {deliveryPoint?.address ? ` → ${deliveryPoint.address}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none font-bold">
            ×
          </button>
        </div>

        <div className="flex-1">
          <MapContainer center={mapCenter} zoom={7} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {pickupPoints.map((point, index) => (
              <Marker
                key={`pickup-${point.sellerId || index}`}
                position={[point.lat!, point.lng!]}
                icon={pickupIcon(index + 1)}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{point.sellerName || 'Pickup point'} </p>
                    <p>{point.address}</p>
                    <p className="text-xs text-slate-500">
                      {point.quantity || 0} {point.unit || 't'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {deliveryPoint?.lat && deliveryPoint.lng && (
              <Marker position={[deliveryPoint.lat, deliveryPoint.lng]} icon={deliveryIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">Delivery point</p>
                    <p>{deliveryPoint.address}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {routeCoordinates.length > 1 && (
              <Polyline positions={routeCoordinates} color="#2563eb" weight={3} opacity={0.7} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
