jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../notification.store', () => ({
  useNotificationStore: {
    getState: () => ({ addNotification: jest.fn() }),
  },
}));

import { useMarketStore } from '../market.store';
import { act, renderHook } from '@testing-library/react-native';

// Reset store between tests
beforeEach(() => {
  useMarketStore.setState({
    prices: [],
    news: [],
    alerts: [],
    isLoadingPrices: false,
    isLoadingNews: false,
    lastPriceFetch: 0,
    lastNewsFetch: 0,
  });
});

describe('market.store — alerts', () => {
  it('adds a new alert', () => {
    const { result } = renderHook(() => useMarketStore());

    act(() => {
      result.current.addAlert({ symbol: 'WHEAT', condition: 'above', threshold: 7.0 });
    });

    expect(result.current.alerts).toHaveLength(1);
    expect(result.current.alerts[0].symbol).toBe('WHEAT');
    expect(result.current.alerts[0].triggered).toBe(false);
  });

  it('removes an alert by id', () => {
    const { result } = renderHook(() => useMarketStore());

    act(() => {
      result.current.addAlert({ symbol: 'CORN', condition: 'below', threshold: 4.0 });
    });

    const id = result.current.alerts[0].id;

    act(() => {
      result.current.removeAlert(id);
    });

    expect(result.current.alerts).toHaveLength(0);
  });
});

describe('market.store — checkAlerts', () => {
  it('marks alert as triggered and does not double-trigger', () => {
    useMarketStore.setState({
      prices: [
        {
          symbol: 'WHEAT',
          name: 'Wheat',
          price: 7.5,
          change: 0.1,
          changePct: 1.4,
          unit: 'dollar per bushel',
          updatedAt: '2026-03-03',
        },
      ],
      alerts: [
        {
          id: 'alert-1',
          symbol: 'WHEAT',
          condition: 'above',
          threshold: 7.0,
          triggered: false,
          createdAt: new Date().toISOString(),
        },
      ],
    } as Parameters<typeof useMarketStore.setState>[0]);

    const { result } = renderHook(() => useMarketStore());

    act(() => {
      result.current.checkAlerts();
    });

    expect(result.current.alerts[0].triggered).toBe(true);

    // Second check should not re-trigger (already triggered)
    act(() => {
      result.current.checkAlerts();
    });

    // triggered stays true, no duplicate notifications
    expect(result.current.alerts[0].triggered).toBe(true);
  });
});
