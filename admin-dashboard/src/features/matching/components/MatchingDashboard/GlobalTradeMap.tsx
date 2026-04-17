import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Globe, Navigation } from 'lucide-react';

// Fix default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const loadBulgariaGeoJSON = async () => {
  try {
    const response = await fetch('/data/bulgaria-nuts2.geojson');
    const bgData = await response.json();
    return bgData;
  } catch (error) {
    console.error('❌ Failed to load Bulgaria GeoJSON:', error);
    return null;
  }
};

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const buyerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const sellerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedSellerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [1, -38],
  shadowSize: [46, 46],
});

interface BuyerMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  product?: string;
  quantity?: number;
}

interface SellerMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  product?: string;
  quantity?: number;
  verified?: boolean;
}

interface GlobalTradeMapProps {
  buyers?: BuyerMarker[];
  sellers?: SellerMarker[];
  selectedBuyerId?: string;
  selectedSellerId?: string;
  selectedSellerIds?: string[];
  onBuyerClick?: (buyerId: string) => void;
  onSellerClick?: (sellerId: string) => void;
  highlightRegion?: string;
}

const FitBounds: React.FC<{ view: 'europe' | 'africa' | 'global' }> = ({ view }) => {
  const map = useMap();

  useEffect(() => {
    if (view === 'europe') {
      map.flyTo([42.7, 25.5], 7);
    } else if (view === 'africa') {
      map.flyTo([-1.29, 36.82], 6);
    } else {
      map.flyTo([20, 30], 3);
    }
  }, [map, view]);

  return null;
};

export const GlobalTradeMap: React.FC<GlobalTradeMapProps> = ({
  buyers = [],
  sellers = [],
  selectedSellerIds = [],
  onBuyerClick,
  onSellerClick,
  highlightRegion,
}) => {
  const [view, setView] = useState<'europe' | 'africa' | 'global'>('europe');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [geoJSONData, setGeoJSONData] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    loadBulgariaGeoJSON().then(setGeoJSONData);
  }, []);

  const regionStyle = (feature: GeoJSON.Feature) => {
    const nutsProps = feature.properties;
    const isHighlighted = nutsProps.NUTS_ID === highlightRegion;
    const isHovered = nutsProps.NUTS_ID === hoveredRegion;

    return {
      fillColor: nutsProps.color || '#666666',
      fillOpacity: isHighlighted ? 0.7 : isHovered ? 0.6 : 0.5,
      color: isHighlighted ? '#000' : '#fff',
      weight: isHighlighted ? 3 : 2,
    };
  };

  const onEachRegion = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const nutsProps = feature.properties;
    layer.on({
      mouseover: () => setHoveredRegion(nutsProps.NUTS_ID),
      mouseout: () => setHoveredRegion(null),
    });
  };

  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden">
      <MapContainer
        center={[42.7, 25.5]}
        zoom={7}
        style={{ width: '100%', height: '100%', background: '#0f172a' }}
        scrollWheelZoom={true}
      >
        <FitBounds view={view} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {geoJSONData && (
          <GeoJSON
            data={geoJSONData}
            style={regionStyle}
            onEachFeature={onEachRegion}
          />
        )}

        {buyers.map((buyer) => (
          <Marker
            key={buyer.id}
            position={[buyer.lat, buyer.lng]}
            icon={buyerIcon}
            eventHandlers={{ click: () => onBuyerClick?.(buyer.id) }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-blue-400">{buyer.name}</h3>
                <p className="text-sm">Buyer Node</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {sellers.map((seller) => {
          const isSelected = selectedSellerIds.includes(seller.id);
          return (
            <Marker
              key={seller.id}
              position={[seller.lat, seller.lng]}
              icon={isSelected ? selectedSellerIcon : sellerIcon}
              eventHandlers={{ click: () => onSellerClick?.(seller.id) }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className={`font-bold ${isSelected ? 'text-yellow-500' : 'text-green-500'}`}>
                    {seller.name}
                  </h3>
                  <p className="text-sm">Producer</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* View Switcher for Pitching */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <button 
          onClick={() => setView('europe')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${view === 'europe' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
        >
          <Navigation size={14} /> Europe
        </button>
        <button 
          onClick={() => setView('africa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${view === 'africa' ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
        >
          <Globe size={14} /> Africa
        </button>
        <button 
          onClick={() => setView('global')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${view === 'global' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
        >
          <Globe size={14} /> Global
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 pointer-events-none">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live Trade Network</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Buyers: {buyers.length}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="w-2 h-2 rounded-full bg-green-500" /> Sellers: {sellers.length}
            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalTradeMap;
