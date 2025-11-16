import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActiveJobTab } from '../../src/features/dashboard/screens/inspector/components/ActiveJobTab';
import { mockActiveJob } from '../../src/features/dashboard/screens/inspector/__mocks__/mockData';

jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: jest.fn(),
  Marker: jest.fn(),
  Polyline: jest.fn(),
  PROVIDER_GOOGLE: 'google',
}));

describe('ActiveJobTab', () => {
  it('should render active job details', () => {
    const { getByText, getByTestId } = render(<ActiveJobTab activeJob={mockActiveJob} />);

    expect(getByText('Sunflower Seeds')).toBeTruthy();
    expect(getByText('Test Field 99')).toBeTruthy();
    expect(getByTestId('job-status')).toBeTruthy();
  });

  it('should show empty state when no active job', () => {
    const { getByText } = render(<ActiveJobTab activeJob={null} />);

    expect(getByText('No Active Job')).toBeTruthy();
    expect(getByText('Accept a job from the Available Jobs tab')).toBeTruthy();
  });

  it('should display verification form when job is active', () => {
    const { getByTestId } = render(<ActiveJobTab activeJob={mockActiveJob} />);

    expect(getByTestId('verification-form')).toBeTruthy();
  });

  it('should show map with route to destination', () => {
    const { getByTestId } = render(<ActiveJobTab activeJob={mockActiveJob} />);

    expect(getByTestId('job-map')).toBeTruthy();
    expect(getByTestId('route-line')).toBeTruthy();
  });

  it('should display distance remaining', () => {
    const { getByText } = render(<ActiveJobTab activeJob={mockActiveJob} />);

    expect(getByText(/12.3 km/)).toBeTruthy();
  });

  it('should handle start verification button', () => {
    const onStartVerification = jest.fn();
    const { getByText } = render(
      <ActiveJobTab activeJob={mockActiveJob} onStartVerification={onStartVerification} />
    );

    const startButton = getByText('Start Verification');
    fireEvent.press(startButton);

    expect(onStartVerification).toHaveBeenCalled();
  });

  it('should show job specifications', () => {
    const { getByText } = render(<ActiveJobTab activeJob={mockActiveJob} />);

    expect(getByText('Moisture: 8%')).toBeTruthy();
    expect(getByText('Oil Content: 45%')).toBeTruthy();
    expect(getByText('Purity: 98%')).toBeTruthy();
  });
});
