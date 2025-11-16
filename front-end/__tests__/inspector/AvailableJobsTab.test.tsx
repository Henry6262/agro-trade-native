import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AvailableJobsTab } from '../../src/features/dashboard/screens/inspector/components/AvailableJobsTab';
import { mockVerificationJobs } from '../../src/features/dashboard/screens/inspector/__mocks__/mockData';

jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: jest.fn(),
  Marker: jest.fn(),
  Circle: jest.fn(),
  PROVIDER_GOOGLE: 'google',
}));

describe('AvailableJobsTab', () => {
  it('should render list view by default', () => {
    const { getByTestId } = render(<AvailableJobsTab jobs={mockVerificationJobs} />);

    expect(getByTestId('jobs-list-view')).toBeTruthy();
  });

  it('should toggle between list and map view', () => {
    const { getByTestId } = render(<AvailableJobsTab jobs={mockVerificationJobs} />);

    const mapToggle = getByTestId('map-toggle');
    fireEvent.press(mapToggle);

    expect(getByTestId('jobs-map-view')).toBeTruthy();
  });

  it('should display all available jobs', () => {
    const { getByText } = render(<AvailableJobsTab jobs={mockVerificationJobs} />);

    expect(getByText('Wheat Grade A')).toBeTruthy();
    expect(getByText('Corn Premium')).toBeTruthy();
    expect(getByText('Barley Standard')).toBeTruthy();
  });

  it('should filter jobs by priority', () => {
    const { getByTestId, queryByText } = render(<AvailableJobsTab jobs={mockVerificationJobs} />);

    const highPriorityFilter = getByTestId('filter-high');
    fireEvent.press(highPriorityFilter);

    expect(queryByText('Wheat Grade A')).toBeTruthy();
    expect(queryByText('Corn Premium')).toBeNull();
    expect(queryByText('Barley Standard')).toBeNull();
  });

  it('should sort jobs by distance', () => {
    const { getByTestId, getAllByTestId } = render(
      <AvailableJobsTab jobs={mockVerificationJobs} />
    );

    const distanceSort = getByTestId('sort-distance');
    fireEvent.press(distanceSort);

    const jobCards = getAllByTestId('job-card');
    expect(jobCards[0]).toHaveTextContent('25.5 km');
  });

  it('should handle job selection', () => {
    const onJobSelect = jest.fn();
    const { getAllByTestId } = render(
      <AvailableJobsTab jobs={mockVerificationJobs} onJobSelect={onJobSelect} />
    );

    const firstJob = getAllByTestId('job-card')[0];
    fireEvent.press(firstJob);

    expect(onJobSelect).toHaveBeenCalledWith(mockVerificationJobs[0]);
  });

  it('should show empty state when no jobs', () => {
    const { getByText } = render(<AvailableJobsTab jobs={[]} />);

    expect(getByText('No Available Jobs')).toBeTruthy();
    expect(getByText('Check back later for new verification assignments')).toBeTruthy();
  });
});
