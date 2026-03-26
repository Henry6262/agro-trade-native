import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Load Bulgarian NUTS-2 boundaries from local file
// Data extracted from Eurostat GISCO API and stored locally (137KB)
// Contains 6 Bulgarian NUTS-2 regions with accurate polygon boundaries
const loadBulgariaGeoJSON = async () => {
  try {
    const response = await fetch('/data/bulgaria-nuts2.geojson');
    const bgData = await response.json();

    console.log('✅ Loaded Bulgaria NUTS-2 regions from local file:', bgData.features.length);
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

// Custom marker icons for buyers and sellers
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

interface BulgariaMapProps {
  buyers?: BuyerMarker[];
  sellers?: SellerMarker[];
  selectedBuyerId?: string;
  selectedSellerId?: string;
  selectedSellerIds?: string[];
  onBuyerClick?: (buyerId: string) => void;
  onSellerClick?: (sellerId: string) => void;
  highlightRegion?: string;
}

// Component to fit map to Bulgaria bounds on mount
const FitBounds: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    // Bulgaria's approximate bounds
    const bulgariaBounds: L.LatLngBoundsLiteral = [
      [41.2, 22.3], // Southwest
      [44.2, 28.6], // Northeast
    ];
    map.fitBounds(bulgariaBounds);
  }, [map]);

  return null;
};

export const BulgariaMap: React.FC<BulgariaMapProps> = ({
  buyers = [],
  sellers = [],
  selectedSellerIds = [],
  onBuyerClick,
  onSellerClick,
  highlightRegion,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [geoJSONData, setGeoJSONData] = useState<GeoJSON.FeatureCollection | null>(null);

  // Load GeoJSON data on mount
  useEffect(() => {
    loadBulgariaGeoJSON().then(setGeoJSONData);
  }, []);

  // Style for GeoJSON regions - Enhanced for Bulgaria-only view
  const regionStyle = (feature: GeoJSON.Feature) => {
    const nutsProps = feature.properties;
    const isHighlighted = nutsProps.NUTS_ID === highlightRegion;
    const isHovered = nutsProps.NUTS_ID === hoveredRegion;

    return {
      fillColor: nutsProps.color || '#666666',
      fillOpacity: isHighlighted ? 0.7 : isHovered ? 0.6 : 0.5, // Increased opacity for visibility
      color: isHighlighted ? '#000' : '#fff', // White borders between regions
      weight: isHighlighted ? 3 : 2, // Thicker borders
    };
  };

  // Handle region interactions with enhanced tooltips
  const onEachRegion = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const nutsProps = feature.properties;

    layer.on({
      mouseover: () => {
        setHoveredRegion(nutsProps.NUTS_ID);
        layer.setStyle({
          fillOpacity: 0.8,
          weight: 3,
        });
      },
      mouseout: () => {
        setHoveredRegion(null);
        layer.setStyle({
          fillOpacity: 0.5,
          weight: 2,
        });
      },
    });

    // Enhanced tooltip with statistics
    const tooltipText = `
      <div style="font-family: system-ui; padding: 4px;">
        <strong style="font-size: 14px;">${nutsProps.NAME_EN}</strong>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">
          ${nutsProps.NUTS_ID}
        </div>
      </div>
    `;

    layer.bindTooltip(tooltipText, {
      permanent: false,
      direction: 'center',
      className: 'region-tooltip-enhanced',
      opacity: 0.95,
    });
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-100 to-slate-200">
      <MapContainer
        center={[42.7, 25.5]} // Center of Bulgaria
        zoom={7}
        style={{ width: '100%', height: '100%', background: '#f1f5f9' }}
        scrollWheelZoom={true}
        zoomControl={true}
        minZoom={6}
        maxZoom={10}
        maxBounds={[
          [38.0, 18.0], // Southwest - Expanded for better panning at low zoom
          [47.0, 32.0], // Northeast - Expanded for better panning at low zoom
        ]}
        maxBoundsViscosity={0.7} // Makes bounds feel natural but still restrictive
      >
        <FitBounds />

        {/* Minimal Base Layer - Muted for Bulgaria focus */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.3}
        />

        {/* Bulgaria NUTS-2 Regions - Real boundaries from Eurostat */}
        {geoJSONData && (
          <GeoJSON
            data={geoJSONData}
            style={regionStyle}
            onEachFeature={onEachRegion}
          />
        )}

        {/* Buyer Markers */}
        {buyers.map((buyer) => (
          <Marker
            key={buyer.id}
            position={[buyer.lat, buyer.lng]}
            icon={buyerIcon}
            eventHandlers={{
              click: () => onBuyerClick?.(buyer.id),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-blue-600">{buyer.name}</h3>
                {buyer.product && <p className="text-sm">Product: {buyer.product}</p>}
                {buyer.quantity && <p className="text-sm">Quantity: {buyer.quantity}t</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Seller Markers (conditional on order selection) */}
        {sellers.map((seller) => {
          const isSelected = selectedSellerIds.includes(seller.id);
          return (
            <Marker
              key={seller.id}
              position={[seller.lat, seller.lng]}
              icon={isSelected ? selectedSellerIcon : sellerIcon}
              eventHandlers={{
                click: () => onSellerClick?.(seller.id),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className={`font-bold ${isSelected ? 'text-yellow-600' : 'text-green-600'}`}>
                    {seller.name}
                    {isSelected && <span className="ml-2 text-xs">SELECTED</span>}
                  </h3>
                  {seller.product && <p className="text-sm">Product: {seller.product}</p>}
                  {seller.quantity && <p className="text-sm">Quantity: {seller.quantity}t</p>}
                  {seller.verified && (
                    <p className="text-xs text-green-600 font-semibold">✓ Verified</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Enhanced Legend with Region Colors - Hidden by default, shown on hover */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl z-[1000] border border-slate-200 opacity-0 hover:opacity-100 transition-opacity duration-300 group">
        <h4 className="font-bold text-sm mb-3 text-slate-800">Map Legend</h4>

        {/* Markers */}
        <div className="mb-3 pb-3 border-b border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-2">Markers</p>
          <div className="flex items-center gap-2 text-xs mb-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow"></div>
            <span className="text-slate-700">Buyers ({buyers.length})</span>
          </div>
          <div className="flex items-center gap-2 text-xs mb-1.5">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow"></div>
            <span className="text-slate-700">Sellers ({sellers.length})</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow"></div>
            <span className="text-slate-700">Selected</span>
          </div>
        </div>

        {/* Regions */}
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">Regions (NUTS-2)</p>
          <div className="space-y-1">
            {geoJSONData?.features.map((feature: GeoJSON.Feature) => (
              <div key={feature.properties.NUTS_ID} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded shadow-sm border border-white"
                  style={{ backgroundColor: feature.properties.color }}
                ></div>
                <span className="text-slate-700 text-[11px]">
                  {feature.properties.NAME_EN}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hover hint */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-[10px] text-slate-500 italic">
            Hover to keep legend visible
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulgariaMap;
