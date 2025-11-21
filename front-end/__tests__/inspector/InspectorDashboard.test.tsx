import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { InspectorDashboard } from '../../src/features/dashboard/screens/inspector/InspectorDashboard';

jest.mock('expo-location');
jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: jest.fn(),
  Marker: jest.fn(),
  Polyline: jest.fn(),
  PROVIDER_GOOGLE: 'google',
}));

describe('InspectorDashboard', () => {
  it('should render dashboard with tabs', () => {
    const { getByText } = render(<InspectorDashboard />);

    expect(getByText('Active Job')).toBeTruthy();
    expect(getByText('Available Jobs')).toBeTruthy();
  });

  it('should switch between tabs', () => {
    const { getByText, getByTestId } = render(<InspectorDashboard />);

    const availableJobsTab = getByText('Available Jobs');
    fireEvent.press(availableJobsTab);

    expect(getByTestId('available-jobs-content')).toBeTruthy();
  });

  it('should show active job when present', () => {
    const { getByTestId } = render(<InspectorDashboard />);

    const activeJobTab = getByTestId('active-job-tab');
    fireEvent.press(activeJobTab);

    expect(getByTestId('active-job-content')).toBeTruthy();
  });

  it('should handle location permission request', async () => {
    const { getByTestId } = render(<InspectorDashboard />);

    await waitFor(() => {
      expect(getByTestId('location-permission-status')).toBeTruthy();
    });
  });
});
