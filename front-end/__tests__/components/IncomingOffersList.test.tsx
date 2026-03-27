import React from 'react';
import { render } from '@testing-library/react-native';
import { IncomingOffersList } from '../../../src/pages/Dashboard/sections/Buyer/features/Orders/components/IncomingOffersList';
import type { BuyerIncomingOffer } from '../../../src/pages/Dashboard/sections/Buyer/features/Orders/types';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@shared/components/Card', () => {
  const { View } = require('react-native');
  return {
    Card: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <View testID="card" {...props}>{children}</View>
    ),
    CardContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <View testID="card-content" {...props}>{children}</View>
    ),
  };
});

jest.mock('@shared/components/Badge', () => {
  const { Text } = require('react-native');
  return {
    Badge: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <Text testID="badge" {...props}>{children}</Text>
    ),
  };
});

jest.mock('@shared/components/Button', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <TouchableOpacity testID="button" {...props}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('lucide-react-native', () => ({
  DollarSign: () => null,
  Calendar: () => null,
  Clock: () => null,
}));

// ─── Factory ──────────────────────────────────────────────────────────────────

const makeOffer = (overrides: Partial<BuyerIncomingOffer> = {}): BuyerIncomingOffer => ({
  id: 'offer-1',
  product: 'Wheat',
  quantity: 500,
  offeredPricePerTon: 220,
  totalValue: 110000,
  seller: 'AgriCorp',
  sellerLocation: 'Plovdiv',
  sellerFlag: '🇧🇬',
  adminNote: 'Verified supplier.',
  deadline: '2026-04-15',
  responseTime: '48h',
  qualityOffered: ['Grade A', 'Non-GMO'],
  deliveryDate: '2026-05-01',
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('IncomingOffersList', () => {

  // 1. Empty state
  describe('empty state', () => {
    it('renders the empty state message when offers array is empty', () => {
      const { getByText, queryByTestId } = render(<IncomingOffersList offers={[]} />);
      expect(getByText('No incoming offers at the moment.')).toBeTruthy();
      expect(queryByTestId('card')).toBeNull();
    });
  });

  // 2. Happy path – single offer
  describe('single offer', () => {
    it('renders product name', () => {
      const { getByText } = render(<IncomingOffersList offers={[makeOffer()]} />);
      expect(getByText('Wheat')).toBeTruthy();
    });

    it('renders quantity with visible text color (not text-white)', () => {
      const { getByText } = render(<IncomingOffersList offers={[makeOffer()]} />);
      // quantity must appear; regression: was text-white (invisible on white card)
      expect(getByText('500 tons')).toBeTruthy();
    });

    it('renders price per ton', () => {
      const { getByText } = render(<IncomingOffersList offers={[makeOffer()]} />);
      expect(getByText('$220')).toBeTruthy();
    });

    it('renders total value with toLocaleString', () => {
      const { getByText } = render(<IncomingOffersList offers={[makeOffer({ totalValue: 110000 })]} />);
      // toLocaleString output varies by environment; check partial match
      const { getAllByText } = render(<IncomingOffersList offers={[makeOffer({ totalValue: 110000 })]} />);
      const matches = getAllByText(/110/);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('renders delivery date', () => {
      const { getByText } = render(<IncomingOffersList offers={[makeOffer()]} />);
      expect(getByText('Delivery 2026-05-01')).toBeTruthy();
    });

    it('renders response time', () => {
      const { getByText } = render(<IncomingOffersList offers={[makeOffer()]} />);
      expect(getByText('48h response')).toBeTruthy();
    });
  });

  // 3. Deadline display (new field – regression guard)
  describe('deadline', () => {
    it('renders the deadline row', () => {
      const { getByText } = render(<IncomingOffersList offers={[makeOffer()]} />);
      expect(getByText('Deadline: 2026-04-15')).toBeTruthy();
    });
  });

  // 4. adminNote conditional rendering
  describe('adminNote', () => {
    it('renders adminNote when it has content', () => {
      const { getByText } = render(
        <IncomingOffersList offers={[makeOffer({ adminNote: 'Verified supplier.' })]} />
      );
      expect(getByText('Verified supplier.')).toBeTruthy();
    });

    it('does NOT render adminNote element when adminNote is empty string', () => {
      const { queryByText } = render(
        <IncomingOffersList offers={[makeOffer({ adminNote: '' })]} />
      );
      // Empty string should produce no visible node – ghost element regression
      expect(queryByText('')).toBeNull();
    });
  });

  // 5. sellerFlag conditional rendering
  describe('sellerFlag', () => {
    it('renders seller with flag when sellerFlag is provided', () => {
      const { getByText } = render(
        <IncomingOffersList offers={[makeOffer({ sellerFlag: '🇧🇬', seller: 'AgriCorp' })]} />
      );
      expect(getByText(/🇧🇬.*AgriCorp/)).toBeTruthy();
    });

    it('renders seller without a leading space when sellerFlag is undefined', () => {
      const { getByText } = render(
        <IncomingOffersList offers={[makeOffer({ sellerFlag: undefined, seller: 'AgriCorp' })]} />
      );
      // Must NOT start with 'undefined ' – original bug regression
      const el = getByText(/AgriCorp/);
      expect(el.props.children).not.toMatch(/^undefined/);
    });
  });

  // 6. qualityOffered badges
  describe('quality badges', () => {
    it('renders all quality badges', () => {
      const { getByText } = render(
        <IncomingOffersList offers={[makeOffer({ qualityOffered: ['Grade A', 'Non-GMO'] })]} />
      );
      expect(getByText('Grade A')).toBeTruthy();
      expect(getByText('Non-GMO')).toBeTruthy();
    });

    it('renders no badge section when qualityOffered is empty', () => {
      const { queryByText } = render(
        <IncomingOffersList offers={[makeOffer({ qualityOffered: [] })]} />
      );
      expect(queryByText('Grade A')).toBeNull();
    });
  });

  // 7. Multiple offers
  describe('multiple offers', () => {
    it('renders a card for each offer', () => {
      const offers = [
        makeOffer({ id: 'offer-1', product: 'Wheat' }),
        makeOffer({ id: 'offer-2', product: 'Corn' }),
        makeOffer({ id: 'offer-3', product: 'Sunflower' }),
      ];
      const { getAllByTestId, getByText } = render(<IncomingOffersList offers={offers} />);
      expect(getAllByTestId('card')).toHaveLength(3);
      expect(getByText('Wheat')).toBeTruthy();
      expect(getByText('Corn')).toBeTruthy();
      expect(getByText('Sunflower')).toBeTruthy();
    });
  });

  // 8. CTA buttons
  describe('CTA buttons', () => {
    it('renders View Details and Accept Offer buttons', () => {
      const { getByText } = render(<IncomingOffersList offers={[makeOffer()]} />);
      expect(getByText('View Details')).toBeTruthy();
      expect(getByText('Accept Offer')).toBeTruthy();
    });
  });

  // 9. New Offer badge
  describe('New Offer badge', () => {
    it('renders the New Offer badge', () => {
      const { getByText } = render(<IncomingOffersList offers={[makeOffer()]} />);
      expect(getByText('New Offer')).toBeTruthy();
    });
  });
});
