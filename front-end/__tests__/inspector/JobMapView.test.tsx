import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { JobMapView } from '../../src/features/dashboard/screens/inspector/components/JobMapView';
import { mockVerificationJobs } from '../../src/features/dashboard/screens/inspector/__mocks__/mockData';

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const MockMapView = (props: any) => {
    return <View testID="map-view" {...props} />;
  };
  
  MockMapView.Marker = (props: any) => <View testID="map-marker" {...props} />;
  MockMapView.Polyline = (props: any) => <View testID="map-polyline" {...props} />;
  MockMapView.Circle = (props: any) => <View testID="map-circle" {...props} />;
  
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMapView.Marker,
    Polyline: MockMapView.Polyline,
    Circle: MockMapView.Circle,
    PROVIDER_GOOGLE: 'google',
  };
});

describe('JobMapView', () => {
  it('should render map with job markers', () => {
    const { getAllByTestId } = render(
      <JobMapView jobs={mockVerificationJobs} />
    );
    
    const markers = getAllByTestId('map-marker');
    expect(markers).toHaveLength(mockVerificationJobs.length);
  });

  it('should display priority colors on markers', () => {
    const { getAllByTestId } = render(
      <JobMapView jobs={mockVerificationJobs} />
    );
    
    const markers = getAllByTestId('job-priority-marker');
    expect(markers[0]).toHaveStyle({ backgroundColor: '#ef4444' }); // HIGH - red
    expect(markers[1]).toHaveStyle({ backgroundColor: '#eab308' }); // MEDIUM - yellow
    expect(markers[2]).toHaveStyle({ backgroundColor: '#ffffff' }); // LOW - white
  });

  it('should show job details on marker press', () => {
    const { getAllByTestId, getByTestId } = render(
      <JobMapView jobs={mockVerificationJobs} />
    );
    
    const firstMarker = getAllByTestId('map-marker')[0];
    fireEvent.press(firstMarker);
    
    expect(getByTestId('job-callout')).toBeTruthy();
    expect(getByTestId('job-callout')).toHaveTextContent('Wheat Grade A');
  });

  it('should display distance from current location', () => {
    const { getAllByTestId } = render(
      <JobMapView 
        jobs={mockVerificationJobs}
        currentLocation={{ latitude: 42.6977, longitude: 23.3219 }}
      />
    );
    
    const distanceLabels = getAllByTestId('distance-label');
    expect(distanceLabels[0]).toHaveTextContent('25.5 km');
  });

  it('should show inspector current location', () => {
    const currentLocation = { latitude: 42.6977, longitude: 23.3219 };
    const { getByTestId } = render(
      <JobMapView 
        jobs={mockVerificationJobs}
        currentLocation={currentLocation}
      />
    );
    
    expect(getByTestId('current-location-marker')).toBeTruthy();
  });

  it('should handle map region change', () => {
    const onRegionChange = jest.fn();
    const { getByTestId } = render(
      <JobMapView 
        jobs={mockVerificationJobs}
        onRegionChange={onRegionChange}
      />
    );
    
    const map = getByTestId('map-view');
    fireEvent(map, 'onRegionChangeComplete', {
      latitude: 42.6977,
      longitude: 23.3219,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
    
    expect(onRegionChange).toHaveBeenCalled();
  });

  it('should cluster markers when zoomed out', () => {
    const manyJobs = Array(50).fill(null).map((_, i) => ({
      ...mockVerificationJobs[0],
      id: `job-${i}`,
      location: {
        ...mockVerificationJobs[0].location,
        latitude: mockVerificationJobs[0].location.latitude + (i * 0.001),
      },
    }));
    
    const { getAllByTestId } = render(
      <JobMapView jobs={manyJobs} />
    );
    
    const clusters = getAllByTestId('marker-cluster');
    expect(clusters.length).toBeLessThan(manyJobs.length);
  });
});