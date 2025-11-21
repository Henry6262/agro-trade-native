import React from 'react';
import { render } from '@testing-library/react-native';
import { JobPriorityBadge } from '../../src/features/dashboard/screens/inspector/components/JobPriorityBadge';

describe('JobPriorityBadge', () => {
  it('should render HIGH priority with red background', () => {
    const { getByTestId, getByText } = render(<JobPriorityBadge priority="HIGH" />);

    const badge = getByTestId('priority-badge');
    expect(badge).toHaveStyle({ backgroundColor: '#ef4444' }); // red
    expect(getByText('HIGH')).toBeTruthy();
  });

  it('should render MEDIUM priority with yellow background', () => {
    const { getByTestId, getByText } = render(<JobPriorityBadge priority="MEDIUM" />);

    const badge = getByTestId('priority-badge');
    expect(badge).toHaveStyle({ backgroundColor: '#eab308' }); // yellow
    expect(getByText('MEDIUM')).toBeTruthy();
  });

  it('should render LOW priority with white background', () => {
    const { getByTestId, getByText } = render(<JobPriorityBadge priority="LOW" />);

    const badge = getByTestId('priority-badge');
    expect(badge).toHaveStyle({ backgroundColor: '#ffffff' }); // white
    expect(getByText('LOW')).toBeTruthy();
  });

  it('should apply custom size', () => {
    const { getByTestId } = render(<JobPriorityBadge priority="HIGH" size="large" />);

    const badge = getByTestId('priority-badge');
    expect(badge).toHaveStyle({
      paddingHorizontal: 16,
      paddingVertical: 8,
    });
  });

  it('should apply custom className', () => {
    const { getByTestId } = render(<JobPriorityBadge priority="MEDIUM" className="custom-class" />);

    const badge = getByTestId('priority-badge');
    expect(badge.props.className).toContain('custom-class');
  });

  it('should have proper text contrast for each priority', () => {
    const { getByText: getByTextHigh } = render(<JobPriorityBadge priority="HIGH" />);
    expect(getByTextHigh('HIGH')).toHaveStyle({ color: '#ffffff' }); // white text on red

    const { getByText: getByTextMedium } = render(<JobPriorityBadge priority="MEDIUM" />);
    expect(getByTextMedium('MEDIUM')).toHaveStyle({ color: '#000000' }); // black text on yellow

    const { getByText: getByTextLow } = render(<JobPriorityBadge priority="LOW" />);
    expect(getByTextLow('LOW')).toHaveStyle({ color: '#000000' }); // black text on white
  });

  it('should be accessible with proper labels', () => {
    const { getByTestId } = render(<JobPriorityBadge priority="HIGH" />);

    const badge = getByTestId('priority-badge');
    expect(badge.props.accessibilityLabel).toBe('High priority job');
    expect(badge.props.accessibilityRole).toBe('text');
  });
});
