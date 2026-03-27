/**
 * NotificationBanner & OfflineBanner — Accessibility Regression Tests
 * Covers: alert role, assertive live region, label, dismiss button,
 * null when hidden, status announcement
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// ============================================================
// Mock stores and icons
// ============================================================
const mockNotifications: any[] = [];
const mockMarkAsRead = jest.fn();

jest.mock('@stores/notification.store', () => ({
  useNotificationStore: (selector: any) => {
    const store = {
      notifications: mockNotifications,
      markAsRead: mockMarkAsRead,
    };
    return selector(store);
  },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (name: string) => (props: any) => <View testID={`icon-${name}`} {...props} />;
  return { Bell: icon('Bell'), X: icon('X') };
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useAnimatedStyle: () => ({}),
    useSharedValue: (v: number) => ({ value: v }),
    withTiming: (v: number) => v,
  };
});

import { NotificationBanner } from '../../src/shared/components/NotificationBanner';
import { OfflineBanner } from '../../src/shared/components/OfflineBanner';

// ============================================================
// 1. NotificationBanner a11y
// ============================================================
describe('NotificationBanner a11y', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockNotifications.length = 0;
    mockMarkAsRead.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null when no notifications', () => {
    const { toJSON } = render(<NotificationBanner />);
    expect(toJSON()).toBeNull();
  });

  it('renders with accessibilityRole=alert when notification arrives', () => {
    mockNotifications.push({ id: '1', title: 'New Offer', body: 'You received an offer', read: false });
    const { getByRole } = render(<NotificationBanner />);
    const banner = getByRole('alert');
    expect(banner).toBeTruthy();
  });

  it('has accessibilityLiveRegion=assertive', () => {
    mockNotifications.push({ id: '2', title: 'Alert', body: 'Test body', read: false });
    const { getByRole } = render(<NotificationBanner />);
    expect(getByRole('alert').props.accessibilityLiveRegion).toBe('assertive');
  });

  it('accessibilityLabel contains title and body', () => {
    mockNotifications.push({ id: '3', title: 'Price Drop', body: 'Wheat price fell', read: false });
    const { getByLabelText } = render(<NotificationBanner />);
    expect(getByLabelText('Price Drop: Wheat price fell')).toBeTruthy();
  });

  it('dismiss button has accessibilityRole=button and label', () => {
    mockNotifications.push({ id: '4', title: 'Test', body: 'Body', read: false });
    const { getByLabelText } = render(<NotificationBanner />);
    const dismissBtn = getByLabelText('Dismiss notification');
    expect(dismissBtn.props.accessibilityRole).toBe('button');
    expect(dismissBtn.props.accessibilityHint).toBe('Closes this notification banner');
  });

  it('dismiss button fires markAsRead', () => {
    mockNotifications.push({ id: '5', title: 'Test', body: 'Body', read: false });
    const { getByLabelText } = render(<NotificationBanner />);
    fireEvent.press(getByLabelText('Dismiss notification'));
    // Animation callback triggers markAsRead; in mock it fires synchronously
    jest.runAllTimers();
    expect(mockMarkAsRead).toHaveBeenCalledWith('5');
  });

  // Anticipation: status type in label
  it.todo('includes notification type (success/error/info) in accessibilityLabel');
});

// ============================================================
// 2. OfflineBanner a11y
// ============================================================
describe('OfflineBanner a11y', () => {
  // Note: OfflineBanner uses fetch internally. We mock fetch to control online/offline.
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns null when online', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 204, ok: true });
    const { toJSON } = render(<OfflineBanner />);
    await act(async () => {});
    expect(toJSON()).toBeNull();
  });

  it('renders with accessibilityRole=alert when offline', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    const { findByRole } = render(<OfflineBanner />);
    const banner = await findByRole('alert');
    expect(banner).toBeTruthy();
  });

  it('has accessibilityLiveRegion=assertive when offline', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    const { findByRole } = render(<OfflineBanner />);
    const banner = await findByRole('alert');
    expect(banner.props.accessibilityLiveRegion).toBe('assertive');
  });

  it('has explicit accessibilityLabel when offline', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    const { findByLabelText } = render(<OfflineBanner />);
    const banner = await findByLabelText(/offline/i);
    expect(banner).toBeTruthy();
  });

  // Anticipation: reconnection announcement
  it.todo('announces reconnection to screen reader when back online');
});
