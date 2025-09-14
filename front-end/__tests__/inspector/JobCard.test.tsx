import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { JobCard } from '../../src/features/dashboard/screens/inspector/components/JobCard';
import { mockVerificationJobs } from '../../src/features/dashboard/screens/inspector/__mocks__/mockData';

describe('JobCard', () => {
  const mockJob = mockVerificationJobs[0];
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render job details', () => {
    const { getByText } = render(
      <JobCard job={mockJob} onPress={mockOnPress} />
    );
    
    expect(getByText('Wheat Grade A')).toBeTruthy();
    expect(getByText('Grain • 1000 kg')).toBeTruthy();
    expect(getByText('Field Road 123')).toBeTruthy();
  });

  it('should display priority badge with correct color', () => {
    const { getByTestId } = render(
      <JobCard job={mockJob} onPress={mockOnPress} />
    );
    
    const priorityBadge = getByTestId('priority-badge');
    expect(priorityBadge).toHaveTextContent('HIGH');
    expect(priorityBadge).toHaveStyle({ backgroundColor: '#ef4444' }); // red
  });

  it('should show distance', () => {
    const { getByText } = render(
      <JobCard job={mockJob} onPress={mockOnPress} />
    );
    
    expect(getByText('25.5 km')).toBeTruthy();
  });

  it('should display estimated duration', () => {
    const { getByText } = render(
      <JobCard job={mockJob} onPress={mockOnPress} />
    );
    
    expect(getByText('Est. 120 min')).toBeTruthy();
  });

  it('should handle press event', () => {
    const { getByTestId } = render(
      <JobCard job={mockJob} onPress={mockOnPress} />
    );
    
    const card = getByTestId('job-card');
    fireEvent.press(card);
    
    expect(mockOnPress).toHaveBeenCalledWith(mockJob);
  });

  it('should show location city and region', () => {
    const { getByText } = render(
      <JobCard job={mockJob} onPress={mockOnPress} />
    );
    
    expect(getByText('Plovdiv, Plovdiv Province')).toBeTruthy();
  });

  it('should display key specifications', () => {
    const { getByText } = render(
      <JobCard job={mockJob} onPress={mockOnPress} />
    );
    
    expect(getByText(/Moisture: 12%/)).toBeTruthy();
    expect(getByText(/Protein: 14%/)).toBeTruthy();
  });

  it('should show accept button when not assigned', () => {
    const { getByText } = render(
      <JobCard job={mockJob} onPress={mockOnPress} showAcceptButton />
    );
    
    expect(getByText('Accept Job')).toBeTruthy();
  });

  it('should handle accept button press', () => {
    const mockOnAccept = jest.fn();
    const { getByText } = render(
      <JobCard 
        job={mockJob} 
        onPress={mockOnPress}
        onAccept={mockOnAccept}
        showAcceptButton
      />
    );
    
    const acceptButton = getByText('Accept Job');
    fireEvent.press(acceptButton);
    
    expect(mockOnAccept).toHaveBeenCalledWith(mockJob.id);
  });
});