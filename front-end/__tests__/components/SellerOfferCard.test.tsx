import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SellerOfferCard } from '../../../src/pages/Dashboard/sections/Seller/features/Offers/components/SellerOfferCard';
import type { SellerOffer } from '../../../src/services/sellerOfferService';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../../src/design-system', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    COLORS: {
      accentGold: '#fbbf24',
      accentGreen: '#4ade80',
      danger: '#f87171',
      textPrimary: '#fff',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
    },
    GlassCard: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <View testID="glass-card" {...props}>{children}</View>
    ),
    GlassBadge: ({ label, ...props }: { label: string } & Record<string, unknown>) => (
      <Text testID="glass-badge" {...props}>{label}</Text>
    ),
    GlassButton: ({ label, onPress, ...props }: { label: string; onPress: () => void } & Record<string, unknown>) => (
      <TouchableOpacity testID="glass-button" onPress={onPress} {...props}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('lucide-react-native', () => ({
  Weight: () => null,
  DollarSign: () => null,
  MapPin: () => null,
  Calendar: () => null,
  Clock: () => null,
  AlertTriangle: () => null,
}));

// ─── Factory ──────────────────────────────────────────────────────────────────

const noop = jest.fn();

const makeOffer = (overrides: Partial<SellerOffer> = {}): SellerOffer => ({
  id: 'offer-1',
  product: 'Sunflower Seeds',
  quantity: 200,
  offeredPricePerTon: 350,
  totalValue: 70000,
  buyer: 'TradeMax Ltd',
  buyerLocation: 'Plovdiv',
  buyerFlag: '\ud83c\udde7\ud83c\uddec',
  adminNote: 'Verified buyer, fast payments.',
  deadline: '2026-04-20',
  responseTime: '24h',
  estimatedProfit: 15000,
  qualityRequirements: ['Grade A', 'Non-GMO'],
  status: 'pending',
  negotiationId: 'neg-1',
  tradeOperationId: 'trade-1',
  isExpiringSoon: false,
  hoursUntilExpiry: 72,
  createdAt: '2026-03-25T10:00:00Z',
  updatedAt: '2026-03-25T10:00:00Z',
  ...overrides,
});

const defaultProps = () => ({
  offer: makeOffer(),
  onAccept: noop,
  onReject: noop,
  onCounter: noop,
  isProcessing: false,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SellerOfferCard', () => {

  beforeEach(() => jest.clearAllMocks());

  // 1. Happy path — basic rendering
  describe('happy path', () => {
    it('renders product name', () => {
      const { getByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getByText('Sunflower Seeds')).toBeTruthy();
    });

    it('renders quantity', () => {
      const { getByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getByText('200 tons')).toBeTruthy();
    });

    it('renders price per ton', () => {
      const { getByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getByText('$350/ton')).toBeTruthy();
    });

    it('renders total value', () => {
      const { getAllByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getAllByText(/70/).length).toBeGreaterThan(0);
    });

    it('renders estimated profit', () => {
      const { getAllByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getAllByText(/15/).length).toBeGreaterThan(0);
    });

    it('renders deadline', () => {
      const { getByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getByText('Deadline 2026-04-20')).toBeTruthy();
    });

    it('renders response time', () => {
      const { getByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getByText('24h')).toBeTruthy();
    });
  });

  // 2. adminNote conditional guard
  describe('adminNote', () => {
    it('renders Buyer Notes section when adminNote is truthy', () => {
      const { getByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getByText('Buyer Notes')).toBeTruthy();
      expect(getByText('Verified buyer, fast payments.')).toBeTruthy();
    });

    it('does NOT render Buyer Notes section when adminNote is empty', () => {
      const props = { ...defaultProps(), offer: makeOffer({ adminNote: '' }) };
      const { queryByText } = render(<SellerOfferCard {...props} />);
      expect(queryByText('Buyer Notes')).toBeNull();
    });
  });

  // 3. buyerFlag conditional guard
  describe('buyerFlag', () => {
    it('renders buyerFlag with location when provided', () => {
      const { getByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getByText(/\ud83c\udde7\ud83c\uddec.*Plovdiv/)).toBeTruthy();
    });

    it('renders location without leading space when buyerFlag is empty', () => {
      const props = { ...defaultProps(), offer: makeOffer({ buyerFlag: '' }) };
      const { getByText } = render(<SellerOfferCard {...props} />);
      const loc = getByText(/Plovdiv/);
      expect(loc.props.children).not.toMatch(/^\s/);
    });
  });

  // 4. qualityRequirements conditional guard
  describe('qualityRequirements', () => {
    it('renders quality badges when requirements exist', () => {
      const { getByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getByText('Quality Requirements')).toBeTruthy();
      expect(getByText('Grade A')).toBeTruthy();
      expect(getByText('Non-GMO')).toBeTruthy();
    });

    it('does NOT render quality section when requirements are empty', () => {
      const props = { ...defaultProps(), offer: makeOffer({ qualityRequirements: [] }) };
      const { queryByText } = render(<SellerOfferCard {...props} />);
      expect(queryByText('Quality Requirements')).toBeNull();
    });
  });

  // 5. Expiry indicators
  describe('expiry indicators', () => {
    it('shows hoursUntilExpiry when isExpiringSoon is true and status is pending', () => {
      const props = {
        ...defaultProps(),
        offer: makeOffer({ isExpiringSoon: true, hoursUntilExpiry: 6, status: 'pending' }),
      };
      const { getByText } = render(<SellerOfferCard {...props} />);
      expect(getByText('6h left')).toBeTruthy();
    });

    it('does NOT show expiring chip when isExpiringSoon is false', () => {
      const { queryByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(queryByText(/left/)).toBeNull();
    });

    it('does NOT show expiring chip when status is expired even if isExpiringSoon', () => {
      const props = {
        ...defaultProps(),
        offer: makeOffer({ isExpiringSoon: true, hoursUntilExpiry: 0, status: 'expired' }),
      };
      const { queryByText } = render(<SellerOfferCard {...props} />);
      expect(queryByText(/left/)).toBeNull();
    });

    it('shows Offer Expired badge when status is expired', () => {
      const props = {
        ...defaultProps(),
        offer: makeOffer({ status: 'expired' }),
      };
      const { getByText } = render(<SellerOfferCard {...props} />);
      expect(getByText('Offer Expired')).toBeTruthy();
    });
  });

  // 6. Status branches
  describe('status branches', () => {
    it('renders action buttons when status is pending', () => {
      const { getByText } = render(<SellerOfferCard {...defaultProps()} />);
      expect(getByText('Accept')).toBeTruthy();
      expect(getByText('Reject')).toBeTruthy();
      expect(getByText('Counter')).toBeTruthy();
    });

    it('does NOT render action buttons when status is accepted', () => {
      const props = { ...defaultProps(), offer: makeOffer({ status: 'accepted' }) };
      const { queryByText, getByText } = render(<SellerOfferCard {...props} />);
      expect(queryByText('Accept')).toBeNull();
      expect(getByText('Offer Accepted')).toBeTruthy();
    });

    it('renders rejected status card', () => {
      const props = { ...defaultProps(), offer: makeOffer({ status: 'rejected' }) };
      const { getByText } = render(<SellerOfferCard {...props} />);
      expect(getByText('Offer Rejected')).toBeTruthy();
    });
  });

  // 7. Counter offer details
  describe('counterOffer details', () => {
    it('renders counter offer price and quantity when status is countered', () => {
      const props = {
        ...defaultProps(),
        offer: makeOffer({
          status: 'countered',
          counterOffer: { price: 320, quantity: 180, terms: 'Delivery within 7 days' },
        }),
      };
      const { getByText } = render(<SellerOfferCard {...props} />);
      expect(getByText('Counter Offer Sent')).toBeTruthy();
      expect(getByText(/320\/ton/)).toBeTruthy();
      expect(getByText(/180 tons/)).toBeTruthy();
      expect(getByText(/Delivery within 7 days/)).toBeTruthy();
    });

    it('does NOT render counter details when counterOffer is undefined', () => {
      const props = {
        ...defaultProps(),
        offer: makeOffer({ status: 'countered', counterOffer: undefined }),
      };
      const { getByText, queryByText } = render(<SellerOfferCard {...props} />);
      expect(getByText('Counter Offer Sent')).toBeTruthy();
      expect(queryByText(/\/ton/)).toBeNull();
    });

    it('does NOT render terms line when terms is empty', () => {
      const props = {
        ...defaultProps(),
        offer: makeOffer({
          status: 'countered',
          counterOffer: { price: 300, quantity: 150 },
        }),
      };
      const { queryByText } = render(<SellerOfferCard {...props} />);
      expect(queryByText(/Terms:/)).toBeNull();
    });
  });

  // 8. CTA callbacks
  describe('CTA callbacks', () => {
    it('calls onAccept when Accept is pressed', () => {
      const onAccept = jest.fn();
      const props = { ...defaultProps(), onAccept };
      const { getByText } = render(<SellerOfferCard {...props} />);
      fireEvent.press(getByText('Accept'));
      expect(onAccept).toHaveBeenCalledWith(props.offer);
    });

    it('calls onReject when Reject is pressed', () => {
      const onReject = jest.fn();
      const props = { ...defaultProps(), onReject };
      const { getByText } = render(<SellerOfferCard {...props} />);
      fireEvent.press(getByText('Reject'));
      expect(onReject).toHaveBeenCalledWith(props.offer);
    });

    it('calls onCounter when Counter is pressed', () => {
      const onCounter = jest.fn();
      const props = { ...defaultProps(), onCounter };
      const { getByText } = render(<SellerOfferCard {...props} />);
      fireEvent.press(getByText('Counter'));
      expect(onCounter).toHaveBeenCalledWith(props.offer);
    });
  });
});
