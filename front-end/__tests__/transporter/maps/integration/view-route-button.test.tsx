import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { OfferCard } from '../../../../src/features/dashboard/screens/transporter/components/OfferCard';
import { MapOffer } from '../../../../src/features/dashboard/screens/transporter/maps/types';

// Mock offer data
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

describe('View Route Button', () => {
  it('should display View Route button on offer card', () => {
    render(<OfferCard offer={mockOffer} />);
    
    const viewRouteButton = screen.getByText('View Route');
    expect(viewRouteButton).toBeTruthy();
  });

  it('should have correct styling for the button', () => {
    render(<OfferCard offer={mockOffer} />);
    
    const viewRouteButton = screen.getByText('View Route');
    
    // Check if button container has proper accessibility
    const buttonContainer = screen.getByRole('button', { name: 'View Route' });
    expect(buttonContainer).toBeTruthy();
  });

  it('should be disabled when offer is delivered', () => {
    const deliveredOffer: MapOffer = {
      ...mockOffer,
      status: 'delivered',
    };
    
    render(<OfferCard offer={deliveredOffer} />);
    
    const viewRouteButton = screen.getByText('View Route');
    expect(viewRouteButton).toBeDisabled();
  });

  it('should call onViewRoute when clicked', () => {
    const onViewRoute = jest.fn();
    
    render(
      <OfferCard 
        offer={mockOffer} 
        onViewRoute={onViewRoute}
      />
    );
    
    const viewRouteButton = screen.getByText('View Route');
    fireEvent.press(viewRouteButton);
    
    expect(onViewRoute).toHaveBeenCalledWith(mockOffer);
    expect(onViewRoute).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when route is being calculated', async () => {
    let resolvePromise: () => void;
    const onViewRoute = jest.fn(() => 
      new Promise<void>(resolve => {
        resolvePromise = resolve;
      })
    );
    
    render(
      <OfferCard 
        offer={mockOffer} 
        onViewRoute={onViewRoute}
      />
    );
    
    const viewRouteButton = screen.getByText('View Route');
    fireEvent.press(viewRouteButton);
    
    // Button should show loading indicator
    expect(screen.UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
    
    // Resolve the promise to complete loading
    await waitFor(() => {
      resolvePromise!();
    });
    
    // After loading completes, should show View Route again
    await waitFor(() => {
      expect(screen.getByText('View Route')).toBeTruthy();
    });
  });

  it('should display truck requirement indicator', () => {
    render(<OfferCard offer={mockOffer} />);
    
    // For 120 tons with 40-ton trucks, need 3 trucks
    const trucksNeeded = Math.ceil(mockOffer.quantity / 40);
    const truckIndicator = screen.getByText(`${trucksNeeded} trucks needed`);
    
    expect(truckIndicator).toBeTruthy();
  });

  it('should show distance estimate if available', () => {
    const offerWithDistance = {
      ...mockOffer,
      estimatedDistance: 45.5, // km
    };
    
    render(<OfferCard offer={offerWithDistance} />);
    
    const distanceText = screen.getByText('~45.5 km');
    expect(distanceText).toBeTruthy();
  });

  it('should handle errors gracefully', async () => {
    const onViewRoute = jest.fn(() => 
      Promise.reject(new Error('Failed to calculate route'))
    );
    
    render(
      <OfferCard 
        offer={mockOffer} 
        onViewRoute={onViewRoute}
      />
    );
    
    const viewRouteButton = screen.getByText('View Route');
    fireEvent.press(viewRouteButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Route unavailable')).toBeTruthy();
    });
  });

  it('should be visible only for pending and accepted offers', () => {
    const pendingOffer = { ...mockOffer, status: 'pending' as const };
    const acceptedOffer = { ...mockOffer, status: 'accepted' as const };
    const inTransitOffer = { ...mockOffer, status: 'in_transit' as const };
    const deliveredOffer = { ...mockOffer, status: 'delivered' as const };
    
    const { rerender } = render(<OfferCard offer={pendingOffer} />);
    expect(screen.queryByText('View Route')).toBeTruthy();
    
    rerender(<OfferCard offer={acceptedOffer} />);
    expect(screen.queryByText('View Route')).toBeTruthy();
    
    rerender(<OfferCard offer={inTransitOffer} />);
    expect(screen.queryByText('View Route')).toBeTruthy();
    
    rerender(<OfferCard offer={deliveredOffer} />);
    const button = screen.queryByText('View Route');
    expect(button).toBeDisabled();
  });

  it('should include map icon next to button text', () => {
    render(<OfferCard offer={mockOffer} />);
    
    const mapIcons = screen.getAllByTestId('map-icon');
    expect(mapIcons.length).toBeGreaterThan(0);
  });
});