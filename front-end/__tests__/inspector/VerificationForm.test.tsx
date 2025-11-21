import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VerificationForm } from '../../src/features/dashboard/screens/inspector/components/VerificationForm';
import { mockActiveJob } from '../../src/features/dashboard/screens/inspector/__mocks__/mockData';

describe('VerificationForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields for each specification', () => {
    const { getByTestId } = render(
      <VerificationForm job={mockActiveJob} onSubmit={mockOnSubmit} />
    );

    expect(getByTestId('field-moisture')).toBeTruthy();
    expect(getByTestId('field-oilContent')).toBeTruthy();
    expect(getByTestId('field-purity')).toBeTruthy();
  });

  it('should display original claimed values', () => {
    const { getByText } = render(<VerificationForm job={mockActiveJob} onSubmit={mockOnSubmit} />);

    expect(getByText('Claimed: 8%')).toBeTruthy();
    expect(getByText('Claimed: 45%')).toBeTruthy();
    expect(getByText('Claimed: 98%')).toBeTruthy();
  });

  it('should allow entering verified values', () => {
    const { getByTestId } = render(
      <VerificationForm job={mockActiveJob} onSubmit={mockOnSubmit} />
    );

    const moistureInput = getByTestId('input-moisture');
    fireEvent.changeText(moistureInput, '9');

    expect(moistureInput.props.value).toBe('9');
  });

  it('should require test method for each parameter', () => {
    const { getByTestId } = render(
      <VerificationForm job={mockActiveJob} onSubmit={mockOnSubmit} />
    );

    expect(getByTestId('method-moisture')).toBeTruthy();
    expect(getByTestId('method-oilContent')).toBeTruthy();
    expect(getByTestId('method-purity')).toBeTruthy();
  });

  it('should allow adding photo evidence', async () => {
    const { getByText, getByTestId } = render(
      <VerificationForm job={mockActiveJob} onSubmit={mockOnSubmit} />
    );

    const addPhotoButton = getByText('Add Photo Evidence');
    fireEvent.press(addPhotoButton);

    await waitFor(() => {
      expect(getByTestId('photo-picker')).toBeTruthy();
    });
  });

  it('should require notes field', () => {
    const { getByTestId } = render(
      <VerificationForm job={mockActiveJob} onSubmit={mockOnSubmit} />
    );

    const notesField = getByTestId('verification-notes');
    expect(notesField).toBeTruthy();

    fireEvent.changeText(notesField, 'Sample tested according to standards');
    expect(notesField.props.value).toBe('Sample tested according to standards');
  });

  it('should validate form before submission', async () => {
    const { getByText } = render(<VerificationForm job={mockActiveJob} onSubmit={mockOnSubmit} />);

    const submitButton = getByText('Submit Verification');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Please fill all required fields')).toBeTruthy();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with all data', async () => {
    const { getByTestId, getByText } = render(
      <VerificationForm job={mockActiveJob} onSubmit={mockOnSubmit} />
    );

    // Fill form
    fireEvent.changeText(getByTestId('input-moisture'), '9');
    fireEvent.changeText(getByTestId('input-oilContent'), '44');
    fireEvent.changeText(getByTestId('input-purity'), '97');
    fireEvent.changeText(getByTestId('method-moisture'), 'Lab Analysis');
    fireEvent.changeText(getByTestId('method-oilContent'), 'Chemical Test');
    fireEvent.changeText(getByTestId('method-purity'), 'Visual Inspection');
    fireEvent.changeText(getByTestId('verification-notes'), 'All tests completed');

    const submitButton = getByText('Submit Verification');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        verifiedSpecs: {
          moisture: '9%',
          oilContent: '44%',
          purity: '97%',
        },
        testMethods: expect.any(Array),
        notes: 'All tests completed',
        evidence: expect.any(Array),
      });
    });
  });

  it('should show verification status options', () => {
    const { getByTestId } = render(
      <VerificationForm job={mockActiveJob} onSubmit={mockOnSubmit} />
    );

    expect(getByTestId('status-verified')).toBeTruthy();
    expect(getByTestId('status-partially-verified')).toBeTruthy();
    expect(getByTestId('status-failed')).toBeTruthy();
  });
});
