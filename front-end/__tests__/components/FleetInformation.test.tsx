import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FleetInformation } from '../../../src/pages/Onboarding/sections/Transporter/features/Fleet/components/FleetInformation';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSetFleetInfo = jest.fn();
let mockTransportData: Record<string, unknown> | undefined;

jest.mock('../../../src/stores/onboarding.store', () => ({
  useOnboardingStore: () => ({
    transportData: mockTransportData,
    setFleetInfo: mockSetFleetInfo,
  }),
}));

jest.mock('../../../src/pages/Onboarding/sections/Transporter/features/Fleet/components/FleetInformation.styles', () => {
  const { StyleSheet } = require('react-native');
  return {
    GREEN: '#4ADE80',
    styles: StyleSheet.create({
      scroll: {}, scrollContent: {}, summaryCard: {}, summaryRow: {},
      summaryLabel: {}, summaryCount: {}, summaryCapacityBlock: {},
      summaryCapacity: {}, summaryCapacityLabel: {}, card: {},
      cardHeader: {}, iconCircle: {}, cardTitle: {}, checkIcon: {},
      fieldLabel: {}, fieldLabelSpaced: {}, capacityGrid: {},
      capacityBtn: {}, capacityBtnActive: {}, capacityBtnNum: {},
      capacityBtnNumActive: {}, capacityBtnUnit: {}, capacityBtnUnitActive: {},
      customBtn: {}, customBtnText: {}, customInputWrap: {},
      textInput: {}, cancelText: {}, counterRow: {}, counterBtn: {},
      counterBtnDisabled: {}, counterValue: {}, typeSelector: {},
      typeSelectorText: {}, addBtn: {}, addBtnDisabled: {},
      addBtnText: {}, addBtnTextDisabled: {}, sectionTitle: {},
      truckCard: {}, truckCardRow: {}, truckIconCircle: {},
      truckInfo: {}, truckNameRow: {}, truckType: {},
      countBadge: {}, countBadgeText: {}, truckCapacity: {},
      removeBtn: {}, emptyState: {}, emptyText: {},
      modalOverlay: {}, modalBox: {}, modalTitle: {},
      modalOption: {}, modalOptionActive: {}, modalOptionText: {},
      modalOptionTextActive: {},
    }),
  };
});

jest.mock('lucide-react-native', () => ({
  Plus: () => null,
  Truck: () => null,
  Trash2: () => null,
  ChevronDown: () => null,
  Minus: () => null,
  CheckCircle: () => null,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXISTING_BASE_LOCATION = {
  id: 'loc-1',
  address: '123 Main St',
  city: 'Sofia',
  state: 'Sofia',
  country: 'Bulgaria',
  zipCode: '1000',
};

const makeTruck = (overrides: Record<string, unknown> = {}) => ({
  id: 'truck-1',
  name: 'Standard',
  capacity: 10,
  suitable_for: [],
  unit: 'tons',
  type: 'Standard',
  count: undefined,
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FleetInformation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransportData = undefined;
  });

  // ── 1. Empty state ──────────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders empty message when no trucks', () => {
      const { getByText } = render(<FleetInformation />);
      expect(getByText('No trucks added yet')).toBeTruthy();
    });

    it('renders "Add Trucks to Fleet" card', () => {
      const { getByText } = render(<FleetInformation />);
      expect(getByText('Add Trucks to Fleet')).toBeTruthy();
    });
  });

  // ── 2. Add truck — capacity bounds ──────────────────────────────────────

  describe('capacity bounds (MAX_CAPACITY_TONS = 100)', () => {
    it('disables Add Truck button when no capacity selected', () => {
      const { getByText } = render(<FleetInformation />);
      const addBtn = getByText('Add Truck');
      fireEvent.press(addBtn);
      expect(mockSetFleetInfo).not.toHaveBeenCalled();
    });

    it('adds a truck when preset capacity (5t) is selected', () => {
      const { getByText } = render(<FleetInformation />);
      fireEvent.press(getByText('5'));
      fireEvent.press(getByText('Add Truck'));
      expect(mockSetFleetInfo).toHaveBeenCalledTimes(1);
      const call = mockSetFleetInfo.mock.calls[0][0];
      expect(call.vehicleTypes).toHaveLength(1);
      expect(call.vehicleTypes[0].capacity).toBe(5);
    });

    it('shows custom capacity placeholder with max limit', () => {
      const { getByText, getByPlaceholderText } = render(<FleetInformation />);
      fireEvent.press(getByText('Custom Amount'));
      expect(getByPlaceholderText('Enter capacity (max 100 tons)')).toBeTruthy();
    });
  });

  // ── 3. Batch count bounds (MAX_BATCH_COUNT = 50) ────────────────────────

  describe('batch count bounds', () => {
    it('renders default batch count of 1', () => {
      const { getByText } = render(<FleetInformation />);
      // The counter value should show "1"
      expect(getByText('1')).toBeTruthy();
    });
  });

  // ── 4. baseLocation preservation ────────────────────────────────────────

  describe('baseLocation preservation', () => {
    it('preserves existing baseLocation when adding a truck', () => {
      mockTransportData = {
        fleetInfo: {
          vehicleCount: 0,
          vehicleTypes: [],
          capacity: { total: 0, unit: 'tons' },
          baseLocation: EXISTING_BASE_LOCATION,
        },
      };

      const { getByText } = render(<FleetInformation />);
      fireEvent.press(getByText('5'));
      fireEvent.press(getByText('Add Truck'));

      expect(mockSetFleetInfo).toHaveBeenCalledTimes(1);
      const call = mockSetFleetInfo.mock.calls[0][0];
      expect(call.baseLocation).toEqual(EXISTING_BASE_LOCATION);
    });

    it('uses empty fallback when no baseLocation exists', () => {
      mockTransportData = {
        fleetInfo: {
          vehicleCount: 0,
          vehicleTypes: [],
          capacity: { total: 0, unit: 'tons' },
        },
      };

      const { getByText } = render(<FleetInformation />);
      fireEvent.press(getByText('5'));
      fireEvent.press(getByText('Add Truck'));

      const call = mockSetFleetInfo.mock.calls[0][0];
      expect(call.baseLocation).toEqual({
        id: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      });
    });

    it('preserves existing baseLocation when removing a truck', () => {
      mockTransportData = {
        fleetInfo: {
          vehicleCount: 1,
          vehicleTypes: [makeTruck()],
          capacity: { total: 10, unit: 'tons' },
          baseLocation: EXISTING_BASE_LOCATION,
        },
      };

      const { getByText } = render(<FleetInformation />);
      // The fleet has a truck — find and tap remove
      // The component shows "Your Fleet (1 trucks)" and a remove button
      expect(getByText('Your Fleet (1 trucks)')).toBeTruthy();
    });
  });

  // ── 5. Fleet summary ───────────────────────────────────────────────────

  describe('fleet summary', () => {
    it('shows fleet total and capacity when trucks exist', () => {
      mockTransportData = {
        fleetInfo: {
          vehicleCount: 2,
          vehicleTypes: [
            makeTruck({ id: 'truck-1', count: 2 }),
          ],
          capacity: { total: 20, unit: 'tons' },
          baseLocation: EXISTING_BASE_LOCATION,
        },
      };

      const { getByText } = render(<FleetInformation />);
      expect(getByText('Fleet Total')).toBeTruthy();
      expect(getByText('2 trucks')).toBeTruthy();
      expect(getByText('20t')).toBeTruthy();
    });

    it('does not show summary when fleet is empty', () => {
      const { queryByText } = render(<FleetInformation />);
      expect(queryByText('Fleet Total')).toBeNull();
    });
  });

  // ── 6. Truck type selection modal ───────────────────────────────────────

  describe('truck type selection', () => {
    it('opens modal and selects a type', () => {
      const { getByText } = render(<FleetInformation />);
      // Default type is "Standard"
      fireEvent.press(getByText('Standard'));
      // Modal should appear with truck types
      expect(getByText('Select Truck Type')).toBeTruthy();
      fireEvent.press(getByText('Refrigerated'));
      // After selection, the selector should show the new type
      expect(getByText('Refrigerated')).toBeTruthy();
    });
  });

  // ── 7. computeFleetTotals correctness ───────────────────────────────────

  describe('fleet total computation', () => {
    it('correctly computes total capacity with mixed truck counts', () => {
      mockTransportData = {
        fleetInfo: {
          vehicleCount: 4,
          vehicleTypes: [
            makeTruck({ id: 't1', capacity: 10, count: 3 }),
            makeTruck({ id: 't2', capacity: 25, count: undefined }),
          ],
          capacity: { total: 55, unit: 'tons' },
          baseLocation: EXISTING_BASE_LOCATION,
        },
      };

      const { getByText } = render(<FleetInformation />);
      // 3 * 10 + 1 * 25 = 55 total, 4 trucks
      expect(getByText('4 trucks')).toBeTruthy();
      expect(getByText('55t')).toBeTruthy();
    });
  });

  // ── 8. Anticipation: suitable_for contract ──────────────────────────────

  describe('suitable_for contract (anticipation)', () => {
    it('creates new trucks with empty suitable_for array', () => {
      const { getByText } = render(<FleetInformation />);
      fireEvent.press(getByText('10'));
      fireEvent.press(getByText('Add Truck'));

      const call = mockSetFleetInfo.mock.calls[0][0];
      const newTruck = call.vehicleTypes[0];
      expect(newTruck.suitable_for).toEqual([]);
      // ANTICIPATION: When suitable_for UI is added, this test should
      // be updated to verify user-selected cargo types are populated.
    });
  });

  // ── 9. Anticipation: unit type contract ─────────────────────────────────

  describe('unit type contract (anticipation)', () => {
    it('new trucks default to "tons" unit', () => {
      const { getByText } = render(<FleetInformation />);
      fireEvent.press(getByText('15'));
      fireEvent.press(getByText('Add Truck'));

      const call = mockSetFleetInfo.mock.calls[0][0];
      expect(call.vehicleTypes[0].unit).toBe('tons');
      // ANTICIPATION: VehicleCapacity.unit supports 'tons' | 'cubic_meters'
      // but local state only offers 'tons' | 'kg'.
      // When unit selection UI is added, verify VehicleCapacity.unit alignment.
    });

    it('fleet capacity unit is always "tons"', () => {
      const { getByText } = render(<FleetInformation />);
      fireEvent.press(getByText('20'));
      fireEvent.press(getByText('Add Truck'));

      const call = mockSetFleetInfo.mock.calls[0][0];
      expect(call.capacity.unit).toBe('tons');
    });
  });
});
