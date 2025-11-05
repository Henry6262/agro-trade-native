import React, { useState, useCallback, useMemo } from 'react';
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
  Polyline,
  DirectionsService,
  DirectionsRenderer,
} from '@react-google-maps/api';
import { Truck, Package, MapPin, DollarSign, Clock, Star, Navigation, X } from 'lucide-react';

interface TransportBid {
  id: string;
  transportRequestId: string;
  transporterId: string;
  transporter?: {
    id: string;
    name: string;
    baseLocation?: string;
    coordinates?: { lat: number; lng: number };
    rating?: number;
    fleetSize?: number;
  };
  bidAmount: number;
  estimatedDuration: number;
  vehicleType: string;
  vehicleCapacity: number;
  status: string;
  submittedAt: string;
  distanceFromPickup?: number; // Calculate based on location
}

interface PickupPoint {
  id: string;
  sellerId: string;
  sellerName: string;
  location: string;
  coordinates: { lat: number; lng: number };
  quantity: number;
  unit: string;
}

interface DeliveryPoint {
  id: string;
  buyerId: string;
  buyerName: string;
  location: string;
  coordinates: { lat: number; lng: number };
}

interface TransportBidMapProps {
  bids: TransportBid[];
  pickupPoints: PickupPoint[];
  deliveryPoint: DeliveryPoint;
  selectedBidId?: string;
  onBidSelect: (bidId: string) => void;
  onClose: () => void;
  googleMapsApiKey: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

// Default center (will be adjusted based on markers)
const defaultCenter = {
  lat: 42.0,
  lng: 25.0, // Bulgaria center as default
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
};

export default function TransportBidMap({
  bids,
  pickupPoints,
  deliveryPoint,
  selectedBidId,
  onBidSelect,
  onClose,
  googleMapsApiKey,
}: TransportBidMapProps) {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  // Calculate map bounds to include all markers
  const bounds = useMemo(() => {
    const bounds = new window.google.maps.LatLngBounds();
    
    // Add bid locations
    bids.forEach(bid => {
      if (bid.transporter?.coordinates) {
        bounds.extend(bid.transporter.coordinates);
      }
    });
    
    // Add pickup points
    pickupPoints.forEach(point => {
      bounds.extend(point.coordinates);
    });
    
    // Add delivery point
    bounds.extend(deliveryPoint.coordinates);
    
    return bounds;
  }, [bids, pickupPoints, deliveryPoint]);

  // Fit map to bounds when loaded
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    map.fitBounds(bounds);
  }, [bounds]);

  // Calculate route for selected bid
  const calculateRoute = async (bidId: string) => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid?.transporter?.coordinates || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    // Create waypoints from pickup points
    const waypoints = pickupPoints.map(point => ({
      location: point.coordinates,
      stopover: true,
    }));

    try {
      const result = await directionsService.route({
        origin: bid.transporter.coordinates,
        destination: deliveryPoint.coordinates,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      
      setDirectionsResponse(result);
      setShowRoute(true);
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  // Get marker color based on bid amount (lower is better)
  const getBidMarkerColor = (bid: TransportBid): string => {
    const amounts = bids.map(b => b.bidAmount).sort((a, b) => a - b);
    const position = amounts.indexOf(bid.bidAmount);
    const percentage = position / amounts.length;
    
    if (percentage < 0.33) return '#10B981'; // Green - best price
    if (percentage < 0.66) return '#F59E0B'; // Yellow - medium price
    return '#EF4444'; // Red - high price
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[95%] h-[90%] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Transport Bid Map Overview</h2>
            <p className="text-sm text-gray-600 mt-1">
              {bids.length} bids • {pickupPoints.length} pickup points • 1 delivery point
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <LoadScript googleMapsApiKey={googleMapsApiKey}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={8}
              center={defaultCenter}
              options={mapOptions}
              onLoad={onLoad}
            >
              {/* Transporter/Bid Markers */}
              {bids.map((bid) => {
                if (!bid.transporter?.coordinates) return null;
                
                return (
                  <Marker
                    key={`bid-${bid.id}`}
                    position={bid.transporter.coordinates}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: getBidMarkerColor(bid),
                      fillOpacity: bid.id === selectedBidId ? 1 : 0.7,
                      strokeColor: '#FFFFFF',
                      strokeWeight: 2,
                    }}
                    onClick={() => {
                      setSelectedMarkerId(`bid-${bid.id}`);
                      onBidSelect(bid.id);
                    }}
                  />
                );
              })}

              {/* Pickup Point Markers */}
              {pickupPoints.map((point) => (
                <Marker
                  key={`pickup-${point.id}`}
                  position={point.coordinates}
                  icon={{
                    url: 'data:image/svg+xml;base64,' + btoa(`
                      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="2"/>
                        <text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold">P</text>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(40, 40),
                  }}
                  onClick={() => setSelectedMarkerId(`pickup-${point.id}`)}
                />
              ))}

              {/* Delivery Point Marker */}
              <Marker
                position={deliveryPoint.coordinates}
                icon={{
                  url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#10B981" stroke="white" stroke-width="2"/>
                      <text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold">D</text>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
                onClick={() => setSelectedMarkerId(`delivery`)}
              />

              {/* Info Windows */}
              {selectedMarkerId?.startsWith('bid-') && (
                <InfoWindow
                  position={bids.find(b => `bid-${b.id}` === selectedMarkerId)?.transporter?.coordinates}
                  onCloseClick={() => setSelectedMarkerId(null)}
                >
                  <div className="p-2" style={{ minWidth: '250px' }}>
                    {(() => {
                      const bid = bids.find(b => `bid-${b.id}` === selectedMarkerId);
                      if (!bid) return null;
                      
                      return (
                        <>
                          <h3 className="font-semibold text-lg mb-2">{bid.transporter?.name}</h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <span className="font-semibold">€{bid.bidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{bid.estimatedDuration} hours</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-gray-500" />
                              <span>{bid.vehicleType} ({bid.vehicleCapacity} tons)</span>
                            </div>
                            {bid.transporter?.rating && (
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span>{bid.transporter.rating} / 5.0</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => calculateRoute(bid.id)}
                            className="mt-3 w-full bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                          >
                            Show Route
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </InfoWindow>
              )}

              {selectedMarkerId?.startsWith('pickup-') && (
                <InfoWindow
                  position={pickupPoints.find(p => `pickup-${p.id}` === selectedMarkerId)?.coordinates}
                  onCloseClick={() => setSelectedMarkerId(null)}
                >
                  <div className="p-2">
                    {(() => {
                      const point = pickupPoints.find(p => `pickup-${p.id}` === selectedMarkerId);
                      if (!point) return null;
                      
                      return (
                        <>
                          <h3 className="font-semibold">Pickup Point</h3>
                          <p className="text-sm mt-1">{point.sellerName}</p>
                          <p className="text-sm">{point.location}</p>
                          <p className="text-sm font-semibold mt-2">
                            {point.quantity} {point.unit}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </InfoWindow>
              )}

              {selectedMarkerId === 'delivery' && (
                <InfoWindow
                  position={deliveryPoint.coordinates}
                  onCloseClick={() => setSelectedMarkerId(null)}
                >
                  <div className="p-2">
                    <h3 className="font-semibold">Delivery Point</h3>
                    <p className="text-sm mt-1">{deliveryPoint.buyerName}</p>
                    <p className="text-sm">{deliveryPoint.location}</p>
                  </div>
                </InfoWindow>
              )}

              {/* Show route if calculated */}
              {showRoute && directionsResponse && (
                <DirectionsRenderer
                  directions={directionsResponse}
                  options={{
                    polylineOptions: {
                      strokeColor: '#3B82F6',
                      strokeWeight: 4,
                      strokeOpacity: 0.7,
                    },
                  }}
                />
              )}
            </GoogleMap>
          </LoadScript>
        </div>

        {/* Legend */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-around text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Low Bid (Best)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>Medium Bid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>High Bid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center text-xs font-bold">P</div>
              <span>Pickup Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full text-white flex items-center justify-center text-xs font-bold">D</div>
              <span>Delivery Point</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}