import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TransportRequest } from '../../../../types/transport';

// Custom marker icons
const pickupIcon = (number: number) => new L.DivIcon({
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
    font-size: 16px;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  ">${number}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -48],
  shadowSize: [57, 57],
});

interface RouteMapModalProps {
  request: TransportRequest;
  onClose: () => void;
}

export const RouteMapModal: React.FC<RouteMapModalProps> = ({ request, onClose }) => {
  // Calculate center point for map
  const allPoints = [
    ...request.pickupPoints.map(p => [p.latitude, p.longitude] as [number, number]),
    [request.deliveryPoint.latitude, request.deliveryPoint.longitude] as [number, number],
  ];

  const centerLat = allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length;
  const centerLng = allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length;

  // Create polyline coordinates (pickup points -> delivery point)
  const routeCoordinates: [number, number][] = [
    ...request.pickupPoints.map(p => [p.latitude, p.longitude] as [number, number]),
    [request.deliveryPoint.latitude, request.deliveryPoint.longitude],
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Transport Route - Operation #{request.tradeOperation.operationNumber}
              </h2>
              <p className="text-blue-100">
                Total Distance: {request.totalDistance}km | Est. Cost: €{request.estimatedCost.toFixed(2)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={8}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Pickup Point Markers */}
            {request.pickupPoints.map((point, index) => (
              <Marker
                key={`pickup-${index}`}
                position={[point.latitude, point.longitude]}
                icon={pickupIcon(index + 1)}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-red-600">Pickup Point {index + 1}</h3>
                    <p className="text-sm">{point.address}</p>
                    <p className="text-sm font-semibold">Quantity: {point.quantity}{point.unit}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Delivery Point Marker */}
            <Marker
              position={[request.deliveryPoint.latitude, request.deliveryPoint.longitude]}
              icon={deliveryIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-green-600">Delivery Point</h3>
                  <p className="text-sm">{request.deliveryPoint.address}</p>
                  <p className="text-sm font-semibold">
                    Total: {request.tradeOperation.totalQuantity}t
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Route Lines */}
            <Polyline
              positions={routeCoordinates}
              color="#3b82f6"
              weight={3}
              opacity={0.7}
              dashArray="10, 10"
            />
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-[1000]">
            <h4 className="font-bold text-sm mb-3">Route Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center font-bold">
                  #
                </div>
                <span>Pickup Points</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                <span>Delivery Point</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-0.5 bg-blue-500 border-dashed"></div>
                <span>Route</span>
              </div>
            </div>
          </div>
        </div>

        {/* Route Details Panel */}
        <div className="bg-gray-50 p-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-3">Route Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickup Points List */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Pickup Points ({request.pickupPoints.length})
              </h4>
              <div className="space-y-2">
                {request.pickupPoints.map((point, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-gray-200">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{point.address}</p>
                        <p className="text-xs text-gray-600">
                          {point.quantity}{point.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Point */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Delivery Point</h4>
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{request.deliveryPoint.address}</p>
                    <p className="text-xs text-gray-600">
                      Total: {request.tradeOperation.totalQuantity}t
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Summary</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Distance:</span>
                    <span className="font-semibold">{request.totalDistance}km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Cost:</span>
                    <span className="font-semibold">€{request.estimatedCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trucks Needed:</span>
                    <span className="font-semibold">{request.trucksNeeded}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
