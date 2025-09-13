# LocationMapPicker Component

A comprehensive Google Maps component for the agro-trade application that allows users to select locations by tapping on the map, with automatic address resolution and user location support.

## Features

- **Google Maps Integration**: Uses react-native-maps with Google Maps provider
- **Location Selection**: Tap anywhere on the map to place a pin and select a location
- **Address Resolution**: Automatic reverse geocoding to get readable addresses
- **User Location**: Detects and centers on user's current location
- **Permission Handling**: Handles location permissions gracefully
- **Search Bar UI**: Ready-to-implement search interface
- **Confirmation Flow**: Built-in confirmation UI for selected locations
- **Error Handling**: Comprehensive error handling and loading states
- **Platform Optimized**: Works on both iOS and Android

## Installation

The component uses dependencies that are already installed in the project:
- `react-native-maps` (v1.20.1)
- `expo-location` (v18.1.6)
- `lucide-react-native` (for icons)

## Basic Usage

```tsx
import { LocationMapPicker, SelectedLocation } from '@shared/components';

const MyScreen = () => {
  const handleLocationSelect = (location: SelectedLocation) => {
    console.log('Selected:', location);
  };

  const handleLocationConfirm = (location: SelectedLocation) => {
    console.log('Confirmed:', location);
    // Save location to your state/backend
  };

  return (
    <LocationMapPicker
      title="Select Delivery Location"
      onLocationSelect={handleLocationSelect}
      onLocationConfirm={handleLocationConfirm}
      height={400}
    />
  );
};
```

## Props

### LocationMapPickerProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onLocationSelect` | `(location: SelectedLocation) => void` | - | Called when user taps on map to select location |
| `onLocationConfirm` | `(location: SelectedLocation) => void` | - | Called when user confirms the selected location |
| `initialLocation` | `LatLng` | - | Initial location to center the map on |
| `showUserLocation` | `boolean` | `true` | Whether to show user's current location |
| `showSearchBar` | `boolean` | `true` | Whether to show the search bar UI |
| `height` | `number` | `400` | Height of the map component in pixels |
| `title` | `string` | `"Select Location"` | Title shown in the header |
| `confirmButtonText` | `string` | `"Confirm Location"` | Text for the confirmation button |
| `style` | `any` | - | Additional styles for the container |

### SelectedLocation Type

```tsx
interface SelectedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  formattedAddress?: string;
}
```

## Advanced Usage

### With Initial Location

```tsx
<LocationMapPicker
  initialLocation={{
    latitude: 42.6977,
    longitude: 23.3219
  }}
  onLocationConfirm={handleConfirm}
/>
```

### Without User Location

```tsx
<LocationMapPicker
  showUserLocation={false}
  showSearchBar={false}
  title="Select Store Location"
  onLocationSelect={handleSelect}
/>
```

### Custom Styling

```tsx
<LocationMapPicker
  style={{ borderRadius: 12, margin: 16 }}
  height={300}
  onLocationConfirm={handleConfirm}
/>
```

## Integration Examples

### Order Creation Flow

```tsx
const OrderLocationStep = () => {
  const [deliveryLocation, setDeliveryLocation] = useState<SelectedLocation | null>(null);

  const handleLocationConfirm = (location: SelectedLocation) => {
    setDeliveryLocation(location);
    // Navigate to next step or save to order
  };

  return (
    <View>
      <LocationMapPicker
        title="Select Delivery Address"
        confirmButtonText="Set Delivery Location"
        onLocationConfirm={handleLocationConfirm}
        height={400}
      />
      
      {deliveryLocation && (
        <View className="mt-4 p-4 bg-green-50 rounded-lg">
          <Text>Delivery to: {deliveryLocation.formattedAddress}</Text>
        </View>
      )}
    </View>
  );
};
```

### Profile Location Update

```tsx
const ProfileLocationUpdate = () => {
  const updateUserLocation = async (location: SelectedLocation) => {
    try {
      await locationService.updateUserLocation(
        location.latitude,
        location.longitude,
        'manual'
      );
      Alert.alert('Success', 'Location updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update location');
    }
  };

  return (
    <LocationMapPicker
      title="Update Your Location"
      confirmButtonText="Save Location"
      onLocationConfirm={updateUserLocation}
      showUserLocation={true}
    />
  );
};
```

## Implementation Details

### Location Permissions

The component automatically handles location permissions:
1. Checks for existing permissions
2. Requests permissions if needed
3. Gracefully handles permission denial
4. Provides fallback to manual location selection

### Reverse Geocoding

The component uses a two-tier approach for address resolution:
1. **Primary**: Uses the app's `locationService` for consistent API integration
2. **Fallback**: Uses expo-location's reverse geocoding for offline capability

### Error Handling

The component handles various error scenarios:
- Location permission denied
- GPS/location services disabled
- Network errors during geocoding
- Invalid coordinates
- Service timeouts

### Performance Optimizations

- Map renders only when ready
- Efficient marker updates
- Minimal re-renders
- Proper cleanup of location watchers

## Search Functionality

The search bar UI is implemented but not functional. To implement search:

1. Connect to your location search API:
```tsx
const handleSearch = async (query: string) => {
  const results = await locationService.searchLocations(query);
  setSearchResults(results);
};
```

2. Add search results dropdown
3. Handle search result selection

## Styling

The component uses NativeWind classes for styling. Key customization points:

- Header background: `bg-gray-700`
- Map container: `bg-gray-800 rounded-xl`
- Info panels: `bg-white rounded-lg shadow-lg`
- Buttons: Uses the app's Button component

## Platform Differences

### iOS
- Native location permission dialog
- Smooth map animations
- System location button styling

### Android
- Custom location permission handling
- Material Design components
- Platform-specific map styling

## Troubleshooting

### Common Issues

1. **Map not showing**: Check Google Maps API key configuration
2. **Location not detected**: Verify location permissions in device settings
3. **Geocoding fails**: Check network connection and API endpoints
4. **Performance issues**: Ensure proper component cleanup

### Debug Mode

Enable debugging by adding console logs:
```tsx
const handleLocationSelect = (location: SelectedLocation) => {
  console.log('Location selected:', location);
  // Your handler code
};
```

## Dependencies

Ensure these are properly configured:

```json
{
  "react-native-maps": "1.20.1",
  "expo-location": "^18.1.6",
  "lucide-react-native": "^0.541.0"
}
```

## Environment Setup

Required environment variables:
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Related Components

- `PermissionGuard`: For location permission handling
- `SimplifiedLocationStep`: For onboarding location selection
- `locationService`: For API integration
- `Button`: For UI actions
- `Input`: For search interface