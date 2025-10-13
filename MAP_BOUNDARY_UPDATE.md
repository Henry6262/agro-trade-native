# Bulgarian NUTS-2 Map Boundary Update

## Problem Solved
Replaced simple rectangular boundaries with **accurate official Bulgarian NUTS-2 regional boundaries** from Eurostat.

## What Changed

### Before
- 6 rectangular polygons drawn with 4 corner coordinates each
- Inaccurate representation of Bulgarian regions
- Not suitable for production or geographic analysis

### After
- ✅ Official Eurostat NUTS-2 boundaries (2024 edition)
- ✅ Detailed polygon coordinates (hundreds of points per region)
- ✅ Accurate geographic representation
- ✅ Proper EPSG:4326 (WGS84) projection for web maps

## Files Modified

### 1. `/admin-dashboard/extract-bulgaria-nuts2.py`
**New Python script** to extract and convert Bulgarian NUTS-2 data:
- Filters Bulgaria (CNTR_CODE='BG') and NUTS level 2
- Converts from EPSG:3035 (European LAEA) to EPSG:4326 (WGS84)
- Adds English names and color coding
- Output: 137.2 KB GeoJSON file

### 2. `/admin-dashboard/src/data/bulgaria-nuts2.geojson`
**New GeoJSON file** with accurate boundaries:
- 6 Bulgarian NUTS-2 regions with real polygon coordinates
- Each region has hundreds of coordinate points
- Properties include: NUTS_ID, NAME_EN, NUTS_NAME, color

### 3. `/admin-dashboard/public/data/bulgaria-nuts2.geojson`
Copy in public folder for runtime fetching

### 4. `/admin-dashboard/src/components/MatchingDashboard/BulgariaMap.tsx`
**Updated React component:**
- Removed hardcoded rectangular coordinates (lines 20-149)
- Added dynamic GeoJSON loading via fetch
- Updated property access to use NUTS_ID instead of id
- Enhanced tooltips to show English names
- Conditional rendering while GeoJSON loads

### 5. `/admin-dashboard/vite.config.ts`
Added `assetsInclude: ['**/*.geojson']` to allow GeoJSON imports

## Regional Mapping

| NUTS ID | English Name | Bulgarian Name | Color |
|---------|-------------|----------------|-------|
| BG31 | North-Western | Северозападен | #4CAF50 (Green) |
| BG32 | North-Central | Северен централен | #2196F3 (Blue) |
| BG33 | North-Eastern | Североизточен | #FF9800 (Orange) |
| BG34 | South-Eastern | Югоизточен | #9C27B0 (Purple) |
| BG41 | South-Western | Югозападен | #F44336 (Red) |
| BG42 | South-Central | Южен централен | #00BCD4 (Cyan) |

## Technical Details

### Projection Conversion
- **Source**: EPSG:3035 (ETRS89-extended / LAEA Europe)
- **Target**: EPSG:4326 (WGS 84 / Geographic lat-lon)
- **Tool**: pyproj Python library
- **Transformation**: X,Y LAEA → Longitude, Latitude

### Data Source
- **Provider**: Eurostat GISCO (Official EU Statistical Office)
- **Dataset**: NUTS_RG_03M_2024_3035.geojson
- **Resolution**: 1:3 million (3M) - good balance of detail and file size
- **Year**: 2024 edition
- **Original file size**: 13MB (all European NUTS regions)
- **Extracted file size**: 137.2 KB (Bulgaria NUTS-2 only)

### Leaflet Integration
```typescript
// Dynamic loading
const loadBulgariaGeoJSON = async () => {
  const response = await fetch('/data/bulgaria-nuts2.geojson');
  return await response.json();
};

// Usage in component
const [geoJSONData, setGeoJSONData] = useState<any>(null);
useEffect(() => {
  loadBulgariaGeoJSON().then(setGeoJSONData);
}, []);

// Render
{geoJSONData && (
  <GeoJSON
    data={geoJSONData}
    style={regionStyle}
    onEachFeature={onEachRegion}
  />
)}
```

## Features Preserved

✅ Color-coded regions (same colors as before)
✅ Hover effects and tooltips
✅ Region highlighting
✅ Buyer and seller markers
✅ Interactive map controls
✅ Legend display

## Testing

1. **Build Status**: ✅ Successful
   ```
   npm run build
   ✓ 2272 modules transformed
   ✓ built in 4.65s
   ```

2. **File Size**: 137.2 KB (acceptable for web)

3. **Visual Check**: Open http://localhost:4173 and navigate to Matching Dashboard
   - Should see detailed regional boundaries
   - No more rectangular shapes
   - Accurate Bulgarian geography

## Benefits

1. **Accuracy**: Real administrative boundaries matching official government divisions
2. **Professional**: Production-ready map visualization
3. **Data Quality**: Eurostat official data (trusted source)
4. **Performance**: Only 137KB vs. 13MB original
5. **Maintainable**: Easy to update with newer Eurostat releases
6. **Compliant**: Uses official EU NUTS classification

## Future Improvements

- Add simplification for even smaller file size (if needed)
- Cache GeoJSON data in localStorage
- Add region statistics overlays
- Enable clickable regions for filtering
- Add multiple resolution levels for zoom

---

## Quick Start

To see the new boundaries:

1. **Open dashboard**: http://localhost:4173
2. **Navigate to**: Matching Dashboard
3. **View map**: See accurate Bulgarian NUTS-2 boundaries
4. **Hover over regions**: See English names in tooltips
5. **Check markers**: Buyer/seller markers placed on actual regions

The map now displays Bulgaria's 6 NUTS-2 regions with accurate geographic boundaries instead of simple rectangles!
