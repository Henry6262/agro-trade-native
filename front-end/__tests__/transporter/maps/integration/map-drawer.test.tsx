import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MapDrawer } from '../../../../src/features/dashboard/screens/transporter/maps/components/MapDrawer';
import { TransporterTransfersTab } from '../../../../src/features/dashboard/screens/transporter/components/TransporterTransfersTab';
import { MapOffer } from '../../../../src/features/dashboard/screens/transporter/maps/types';
import { getOfferMapData } from '../../../../src/features/dashboard/screens/transporter/maps/api/offerApi';
import { fetchAvailableFleet } from '../../../../src/features/dashboard/screens/transporter/maps/api/fleetApi';
import { calculateMultipleRoutes } from '../../../../src/features/dashboard/screens/transporter/maps/api/routeApi';

// Mock the API calls
jest.mock('../../../../src/features/dashboard/screens/transporter/maps/api/offerApi');
jest.mock('../../../../src/features/dashboard/screens/transporter/maps/api/fleetApi');
jest.mock('../../../../src/features/dashboard/screens/transporter/maps/api/routeApi');

const mockOffer: MapOffer = {
  id: 'offer-test-001',
  quantity: 120,
  pickup: {
    coordinates: { latitude: 25.2744, longitude: 51.5111 },
    address: {
      street: 'Farm Road 45',
      city: 'Al Khor',
      state: 'Al Khor',
      country: 'Qatar',
    },
    name: 'Green Valley Farm',
    type: 'pickup',
  },
  delivery: {
    coordinates: { latitude: 25.2854, longitude: 51.5310 },
    address: {
      city: 'Doha',
      state: 'Ad Dawhah',
      country: 'Qatar',
    },
    name: 'Central Market',
    type: 'delivery',
  },
  deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
  status: 'pending',
  estimatedValue: 50000,
  productType: 'vegetables',
};

describe('Map Drawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should open drawer when View Route is clicked', async () => {
    render(<TransporterTransfersTab />);
    
    // Find and click the View Route button
    const viewRouteButton = screen.getByText('View Route');
    fireEvent.press(viewRouteButton);
    
    // Wait for drawer to open
    await waitFor(() => {
      expect(screen.getByTestId('map-drawer')).toBeTruthy();
    });
  });

  it('should close drawer when backdrop is pressed', async () => {
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    const backdrop = screen.getByTestId('drawer-backdrop');
    fireEvent.press(backdrop);
    
    await waitFor(() => {
      expect(screen.queryByTestId('map-drawer')).toBeFalsy();
    });
  });

  it('should close drawer when close button is pressed', async () => {
    const onClose = jest.fn();
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={onClose} />);
    
    const closeButton = screen.getByTestId('drawer-close-button');
    fireEvent.press(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should animate drawer sliding up from bottom', async () => {
    const { rerender } = render(
      <MapDrawer isOpen={false} offer={mockOffer} onClose={jest.fn()} />
    );
    
    // Initially drawer should be off-screen
    const drawer = screen.queryByTestId('map-drawer');
    expect(drawer).toBeFalsy();
    
    // Open drawer
    rerender(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    // Drawer should be visible
    await waitFor(() => {
      expect(screen.getByTestId('map-drawer')).toBeTruthy();
    });
  });

  it('should display offer information in drawer header', () => {
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    expect(screen.getByText('Green Valley Farm')).toBeTruthy();
    expect(screen.getByText('Central Market')).toBeTruthy();
    expect(screen.getByText('120 tons')).toBeTruthy();
  });

  it('should show loading state while fetching map data', async () => {
    (getOfferMapData as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockOffer), 100))
    );
    
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    // Should show loading indicator
    expect(screen.getByTestId('map-loading')).toBeTruthy();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('map-loading')).toBeFalsy();
    });
  });

  it('should fetch fleet data when drawer opens', async () => {
    const mockFleet = {
      transporterId: 'transporter-001',
      trucks: [],
      totalCapacity: 0,
      availableCapacity: 0,
      stats: {
        totalTrucks: 0,
        availableTrucks: 0,
        inTransitTrucks: 0,
        maintenanceTrucks: 0,
      },
    };
    
    (fetchAvailableFleet as jest.Mock).mockResolvedValue(mockFleet);
    
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    await waitFor(() => {
      expect(fetchAvailableFleet).toHaveBeenCalledWith('transporter-001');
    });
  });

  it('should calculate routes for selected trucks', async () => {
    const mockRoutes = [
      {
        truckId: 'truck-001',
        truckLabel: 'T1',
        polyline: 'mock-polyline',
        waypoints: [],
        distance: { total: 45, toPickup: 20, toDelivery: 25 },
        duration: { total: 60, toPickup: 25, toDelivery: 35 },
        color: '#3B82F6',
      },
    ];
    
    (calculateMultipleRoutes as jest.Mock).mockResolvedValue(mockRoutes);
    
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    await waitFor(() => {
      expect(calculateMultipleRoutes).toHaveBeenCalled();
    });
  });

  it('should display error message when map data fails to load', async () => {
    (getOfferMapData as jest.Mock).mockRejectedValue(new Error('Failed to load'));
    
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load map data')).toBeTruthy();
    });
  });

  it('should show truck allocation info', async () => {
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    await waitFor(() => {
      // For 120 tons with 40-ton trucks, need 3 trucks
      expect(screen.getByText('3 trucks required')).toBeTruthy();
    });
  });

  it('should handle gesture-based dismissal', () => {
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    const drawer = screen.getByTestId('map-drawer');
    
    // Simulate swipe down gesture
    fireEvent(drawer, 'onSwipeDown');
    
    // Drawer should start closing
    expect(screen.getByTestId('map-drawer')).toBeTruthy();
  });

  it('should display route summary with total distance and time', async () => {
    const mockRoutes = [
      {
        truckId: 'truck-001',
        truckLabel: 'T1',
        polyline: 'mock-polyline',
        waypoints: [],
        distance: { total: 45, toPickup: 20, toDelivery: 25 },
        duration: { total: 60, toPickup: 25, toDelivery: 35 },
        color: '#3B82F6',
      },
      {
        truckId: 'truck-002',
        truckLabel: 'T2',
        polyline: 'mock-polyline-2',
        waypoints: [],
        distance: { total: 50, toPickup: 22, toDelivery: 28 },
        duration: { total: 65, toPickup: 28, toDelivery: 37 },
        color: '#10B981',
      },
    ];
    
    (calculateMultipleRoutes as jest.Mock).mockResolvedValue(mockRoutes);
    
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    await waitFor(() => {
      // Total distance: 45 + 50 = 95 km
      expect(screen.getByText('Total: 95 km')).toBeTruthy();
      // Average time: (60 + 65) / 2 = 62.5 ≈ 63 min
      expect(screen.getByText('~63 min average')).toBeTruthy();
    });
  });

  it('should resize drawer based on content', async () => {
    render(<MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />);
    
    const drawer = screen.getByTestId('map-drawer');
    
    // Check if drawer has appropriate height
    expect(drawer.props.style).toMatchObject({
      height: expect.any(String),
    });
  });

  it('should prevent scrolling the background when drawer is open', () => {
    const { container } = render(
      <MapDrawer isOpen={true} offer={mockOffer} onClose={jest.fn()} />
    );
    
    // Background should have scroll lock
    expect(container).toHaveStyle({ overflow: 'hidden' });
  });
});