/**
 * Modal & AcceptOfferModal — Accessibility Regression Tests
 * Covers: dialog role, focus trap, header role, button labels,
 * alert roles, live region, disabled state, close hints
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Modal } from '../../src/shared/components/Modal';
import { AcceptOfferModal } from '../../src/shared/components/AcceptOfferModal';

// ============================================================
// Mock setup
// ============================================================
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (name: string) => (props: any) => <View testID={`icon-${name}`} {...props} />;
  return {
    X: icon('X'),
    Check: icon('Check'),
    AlertTriangle: icon('AlertTriangle'),
    DollarSign: icon('DollarSign'),
    Package: icon('Package'),
    Truck: icon('Truck'),
    MapPin: icon('MapPin'),
    Star: icon('Star'),
    Shield: icon('Shield'),
    Info: icon('Info'),
  };
});

const mockOffer = {
  id: 'offer-1',
  pricePerUnit: 2.5,
  quantity: 100,
  unit: 'kg',
  seller: {
    name: 'Test Farm',
    businessName: 'Test Farm Ltd',
    verified: true,
    location: { city: 'Sofia', country: 'BG' },
    rating: 4.5,
    reviewCount: 12,
  },
  deliveryTerms: { deliveryTime: 7 },
};

const mockBuyerRequest = {
  maxPricePerUnit: 3.0,
  quantity: 100,
};

// ============================================================
// 1. Modal (shared) — a11y regression
// ============================================================
describe('Modal a11y', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    title: 'Test Dialog',
    children: <></>,
  };

  // 1a. accessibilityViewIsModal traps focus
  it('renders with accessibilityViewIsModal=true', () => {
    const { UNSAFE_root } = render(<Modal {...defaultProps} />);
    const modal = UNSAFE_root.findByType(require('react-native').Modal);
    expect(modal.props.accessibilityViewIsModal).toBe(true);
  });

  // 1b. content container has dialog-like role and label
  it('content container has accessibilityRole and label derived from title', () => {
    const { getByLabelText } = render(<Modal {...defaultProps} />);
    const dialog = getByLabelText('Test Dialog dialog');
    expect(dialog.props.accessibilityRole).toBe('summary');
    expect(dialog.props.accessible).toBe(true);
  });

  // 1c. falls back to "Dialog" when no title
  it('uses fallback label when no title provided', () => {
    const { getByLabelText } = render(
      <Modal visible={true} onClose={jest.fn()}><></></Modal>
    );
    expect(getByLabelText('Dialog')).toBeTruthy();
  });

  // 1d. explicit accessibilityLabel overrides derived label
  it('respects explicit accessibilityLabel prop', () => {
    const { getByLabelText } = render(
      <Modal {...defaultProps} accessibilityLabel="Custom label" />
    );
    expect(getByLabelText('Custom label')).toBeTruthy();
  });

  // 1e. title has header role
  it('title text has accessibilityRole=header', () => {
    const { getByText } = render(<Modal {...defaultProps} />);
    expect(getByText('Test Dialog').props.accessibilityRole).toBe('header');
  });

  // 1f. close button has role + label
  it('close button has accessibilityRole=button and label', () => {
    const { getByLabelText } = render(<Modal {...defaultProps} />);
    const closeBtn = getByLabelText('Close dialog');
    expect(closeBtn.props.accessibilityRole).toBe('button');
    expect(closeBtn.props.accessibilityHint).toBe('Closes this dialog');
  });

  // 1g. close button fires onClose
  it('close button calls onClose', () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.press(getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // 1h. onRequestClose wired (Android back button)
  it('onRequestClose calls onClose', () => {
    const onClose = jest.fn();
    const { UNSAFE_root } = render(<Modal {...defaultProps} onClose={onClose} />);
    const modal = UNSAFE_root.findByType(require('react-native').Modal);
    expect(modal.props.onRequestClose).toBe(onClose);
  });

  // 1i. close button hidden when closable=false
  it('hides close button when closable=false', () => {
    const { queryByLabelText } = render(
      <Modal {...defaultProps} closable={false} />
    );
    expect(queryByLabelText('Close dialog')).toBeNull();
  });
});

// ============================================================
// 2. AcceptOfferModal — a11y regression
// ============================================================
describe('AcceptOfferModal a11y', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    offer: mockOffer as any,
    buyerRequest: mockBuyerRequest,
    onConfirm: jest.fn(),
    isLoading: false,
  };

  // 2a. focus trap
  it('renders with accessibilityViewIsModal=true', () => {
    const { UNSAFE_root } = render(<AcceptOfferModal {...defaultProps} />);
    const modal = UNSAFE_root.findByType(require('react-native').Modal);
    expect(modal.props.accessibilityViewIsModal).toBe(true);
  });

  // 2b. dialog container role and label for review step
  it('dialog container has role and review label', () => {
    const { getByLabelText } = render(<AcceptOfferModal {...defaultProps} />);
    const dialog = getByLabelText('Accept Offer - Review details');
    expect(dialog.props.accessibilityRole).toBe('summary');
  });

  // 2c. title has header role
  it('review title has accessibilityRole=header', () => {
    const { getByText } = render(<AcceptOfferModal {...defaultProps} />);
    expect(getByText('Accept Offer').props.accessibilityRole).toBe('header');
  });

  // 2d. close button a11y
  it('close button has role and label', () => {
    const { getByLabelText } = render(<AcceptOfferModal {...defaultProps} />);
    const closeBtn = getByLabelText('Close accept offer dialog');
    expect(closeBtn.props.accessibilityRole).toBe('button');
  });

  // 2e. verified seller badge a11y
  it('verified badge has accessibilityLabel', () => {
    const { getByLabelText } = render(<AcceptOfferModal {...defaultProps} />);
    expect(getByLabelText('Verified seller')).toBeTruthy();
  });

  // 2f. action buttons have labels
  it('Cancel and Continue buttons have a11y labels', () => {
    const { getByLabelText } = render(<AcceptOfferModal {...defaultProps} />);
    expect(getByLabelText('Cancel').props.accessibilityRole).toBe('button');
    expect(getByLabelText('Continue to confirmation').props.accessibilityRole).toBe('button');
  });

  // 2g. step transition updates dialog label
  it('dialog label changes on confirm step', () => {
    const { getByLabelText } = render(<AcceptOfferModal {...defaultProps} />);
    fireEvent.press(getByLabelText('Continue to confirmation'));
    expect(getByLabelText('Accept Offer - Confirm acceptance')).toBeTruthy();
  });

  // 2h. confirm step — header role
  it('confirm step title has header role', () => {
    const { getByText, getByLabelText } = render(<AcceptOfferModal {...defaultProps} />);
    fireEvent.press(getByLabelText('Continue to confirmation'));
    expect(getByText('Confirm Acceptance').props.accessibilityRole).toBe('header');
  });

  // 2i. confirm step — back button a11y
  it('back button has a11y label', () => {
    const { getByLabelText } = render(<AcceptOfferModal {...defaultProps} />);
    fireEvent.press(getByLabelText('Continue to confirmation'));
    expect(getByLabelText('Go back to review').props.accessibilityRole).toBe('button');
  });

  // 2j. confirm button — disabled state conveyed
  it('confirm button conveys disabled/busy state when loading', () => {
    const { getByLabelText, rerender } = render(<AcceptOfferModal {...defaultProps} />);
    fireEvent.press(getByLabelText('Continue to confirmation'));
    rerender(<AcceptOfferModal {...defaultProps} isLoading={true} />);
    const btn = getByLabelText('Confirming offer');
    expect(btn.props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  // 2k. important notice has alert role
  it('important notice on confirm step has alert role', () => {
    const { getByLabelText, UNSAFE_root } = render(<AcceptOfferModal {...defaultProps} />);
    fireEvent.press(getByLabelText('Continue to confirmation'));
    const alerts = UNSAFE_root.findAll(
      (node) => node.props.accessibilityRole === 'alert'
    );
    expect(alerts.length).toBeGreaterThan(0);
  });

  // 2l. risk warnings get alert role
  it('risk items have accessibilityRole=alert', () => {
    const riskyOffer = {
      ...mockOffer,
      pricePerUnit: 5.0, // exceeds max
      seller: { ...mockOffer.seller, verified: false },
    };
    const { UNSAFE_root } = render(
      <AcceptOfferModal {...defaultProps} offer={riskyOffer as any} />
    );
    const alerts = UNSAFE_root.findAll(
      (node) => node.props.accessibilityRole === 'alert'
    );
    expect(alerts.length).toBeGreaterThanOrEqual(2);
  });

  // 2m. success step has live region
  it('success step has accessibilityLiveRegion and alert role', () => {
    const onConfirm = jest.fn();
    const { getByLabelText, getByText } = render(
      <AcceptOfferModal {...defaultProps} onConfirm={onConfirm} />
    );
    // navigate to confirm step
    fireEvent.press(getByLabelText('Continue to confirmation'));
    // confirm
    fireEvent.press(getByLabelText('Confirm and accept offer'));
    // success should show
    const successView = getByText('Offer Accepted!').parent;
    // The parent View should have liveRegion
    expect(successView?.props.accessibilityLiveRegion).toBe('polite');
    expect(successView?.props.accessibilityRole).toBe('alert');
  });

  // 2n. returns null when not visible
  it('returns null when visible=false', () => {
    const { toJSON } = render(
      <AcceptOfferModal {...defaultProps} visible={false} />
    );
    expect(toJSON()).toBeNull();
  });

  // 2o. returns null when offer is null
  it('returns null when offer is null', () => {
    const { toJSON } = render(
      <AcceptOfferModal {...defaultProps} offer={null} />
    );
    expect(toJSON()).toBeNull();
  });
});
