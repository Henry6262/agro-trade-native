import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { JobListView } from '../../src/features/dashboard/screens/inspector/components/JobListView';
import { mockVerificationJobs } from '../../src/features/dashboard/screens/inspector/__mocks__/mockData';

describe('JobListView', () => {
  it('should render all jobs in a list', () => {
    const { getByText } = render(<JobListView jobs={mockVerificationJobs} />);

    expect(getByText('Wheat Grade A')).toBeTruthy();
    expect(getByText('Corn Premium')).toBeTruthy();
    expect(getByText('Barley Standard')).toBeTruthy();
  });

  it('should display job priority badges', () => {
    const { getAllByTestId } = render(<JobListView jobs={mockVerificationJobs} />);

    const priorityBadges = getAllByTestId('priority-badge');
    expect(priorityBadges[0]).toHaveTextContent('HIGH');
    expect(priorityBadges[1]).toHaveTextContent('MEDIUM');
    expect(priorityBadges[2]).toHaveTextContent('LOW');
  });

  it('should show distance for each job', () => {
    const { getByText } = render(<JobListView jobs={mockVerificationJobs} />);

    expect(getByText('25.5 km')).toBeTruthy();
    expect(getByText('45.2 km')).toBeTruthy();
    expect(getByText('120.8 km')).toBeTruthy();
  });

  it('should display product details', () => {
    const { getByText } = render(<JobListView jobs={mockVerificationJobs} />);

    expect(getByText('Grain • 1000 kg')).toBeTruthy();
    expect(getByText('Grain • 2000 kg')).toBeTruthy();
    expect(getByText('Grain • 500 kg')).toBeTruthy();
  });

  it('should show location information', () => {
    const { getByText } = render(<JobListView jobs={mockVerificationJobs} />);

    expect(getByText('Plovdiv, Plovdiv Province')).toBeTruthy();
    expect(getByText('Sofia, Sofia Province')).toBeTruthy();
    expect(getByText('Varna, Varna Province')).toBeTruthy();
  });

  it('should handle job selection', () => {
    const onJobSelect = jest.fn();
    const { getAllByTestId } = render(
      <JobListView jobs={mockVerificationJobs} onJobSelect={onJobSelect} />
    );

    const jobCards = getAllByTestId('job-list-item');
    fireEvent.press(jobCards[0]);

    expect(onJobSelect).toHaveBeenCalledWith(mockVerificationJobs[0]);
  });

  it('should support pull to refresh', () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <JobListView jobs={mockVerificationJobs} onRefresh={onRefresh} />
    );

    const list = getByTestId('jobs-flat-list');
    fireEvent(list, 'onRefresh');

    expect(onRefresh).toHaveBeenCalled();
  });

  it('should optimize rendering with FlatList', () => {
    const { getByTestId } = render(<JobListView jobs={mockVerificationJobs} />);

    const flatList = getByTestId('jobs-flat-list');
    expect(flatList.props.data).toEqual(mockVerificationJobs);
    expect(flatList.props.keyExtractor).toBeDefined();
  });
});
