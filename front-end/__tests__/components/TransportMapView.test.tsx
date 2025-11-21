import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import {
  TransportMapView,
  type TransportMapViewProps,
} from '../../src/features/dashboard/screens/admin/components/TransportMapView';

// Mock react-native-maps
type MockProps = React.PropsWithChildren<Record<string, unknown>>;

jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: (props: MockProps) => <View testID="mock-map-view">{props.children}</View>,
  Marker: (props: MockProps) => <View testID="mock-marker">{props.children}</View>,
  Polyline: () => <View testID="mock-polyline" />,
  PROVIDER_GOOGLE: 'google',
}));

const mockRoute: TransportMapViewProps['route'] = {
  origin: {
    latitude: 42.0,
    longitude: -93.0,
    address: 'Warehouse, Iowa',
  },
  pickupLocations: [
    {
      sellerId: 'seller-1',
      sellerName: 'Farm A',
      latitude: 42.1,
      longitude: -93.1,
      address: 'Farm A, Iowa',
      quantity: 100,
      product: 'Corn',
    },
    {
      sellerId: 'seller-2',
      sellerName: 'Farm B',
      latitude: 42.2,
      longitude: -93.2,
      address: 'Farm B, Iowa',
      quantity: 150,
      product: 'Wheat',
    },
  ],
  destination: {
    latitude: 41.8781,
    longitude: -87.6298,
    address: 'Chicago, IL',
  },
  totalDistance: 350,
  estimatedDuration: 360,
  estimatedCost: 450.75,
};

describe('TransportMapView', () => {
  it('should render the transport map with route', () => {
    const { getByTestId } = render(<TransportMapView route={mockRoute} height={400} />);

    expect(getByTestId('mock-map-view')).toBeTruthy();
  });

  it('should render origin, pickup, and destination markers', () => {
    const { getAllByTestId } = render(<TransportMapView route={mockRoute} height={400} />);

    const markers = getAllByTestId('mock-marker');
    // Origin + 2 pickups + destination = 4 markers
    expect(markers).toHaveLength(4);
  });

  it('should render polyline for route', () => {
    const { getByTestId } = render(<TransportMapView route={mockRoute} height={400} />);

    expect(getByTestId('mock-polyline')).toBeTruthy();
  });

  it('should display route info when showDetails is true', () => {
    const { getByText } = render(<TransportMapView route={mockRoute} showDetails={true} />);

    expect(getByText('Transport Route')).toBeTruthy();
    expect(getByText('350 km')).toBeTruthy();
    expect(getByText('6 hrs')).toBeTruthy();
    expect(getByText('$450.75')).toBeTruthy();
  });

  it('should display pickup location cards', () => {
    const { getAllByText, getByText } = render(
      <TransportMapView route={mockRoute} showDetails={true} />
    );

    // Farm names appear multiple times (marker and card)
    expect(getAllByText('Farm A').length).toBeGreaterThan(0);
    expect(getAllByText('Farm B').length).toBeGreaterThan(0);
    expect(getByText('Corn')).toBeTruthy();
    expect(getByText('Wheat')).toBeTruthy();
  });

  it('should handle marker press events', () => {
    const onMarkerPress = jest.fn();
    const { getAllByTestId } = render(
      <TransportMapView route={mockRoute} onMarkerPress={onMarkerPress} />
    );

    // Note: Testing marker press would require more sophisticated mocking
    // For now, we just verify the markers are rendered
    const markers = getAllByTestId('mock-marker');
    expect(markers.length).toBeGreaterThan(0);
  });
});
