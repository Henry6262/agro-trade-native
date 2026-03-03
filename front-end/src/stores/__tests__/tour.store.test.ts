import { useTourStore } from '../tour.store';
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Reset store state between tests so tests are isolated
beforeEach(() => {
  useTourStore.setState({
    hasSeenTour: false,
    isTourActive: false,
    currentStep: 0,
    tourRole: null,
  });
});

describe('useTourStore', () => {
  it('starts with tour not active and not seen', () => {
    const { result } = renderHook(() => useTourStore());
    expect(result.current.isTourActive).toBe(false);
    expect(result.current.hasSeenTour).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.tourRole).toBeNull();
  });

  it('startTour sets role and activates tour at step 0', () => {
    const { result } = renderHook(() => useTourStore());
    act(() => {
      result.current.startTour('buyer');
    });
    expect(result.current.isTourActive).toBe(true);
    expect(result.current.tourRole).toBe('buyer');
    expect(result.current.currentStep).toBe(0);
  });

  it('nextStep increments currentStep', () => {
    const { result } = renderHook(() => useTourStore());
    act(() => {
      result.current.startTour('seller');
    });
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(1);
  });

  it('skipTour deactivates and marks seen', () => {
    const { result } = renderHook(() => useTourStore());
    act(() => {
      result.current.startTour('transport');
    });
    act(() => {
      result.current.skipTour();
    });
    expect(result.current.isTourActive).toBe(false);
    expect(result.current.hasSeenTour).toBe(true);
  });

  it('completeTour deactivates and marks seen', () => {
    const { result } = renderHook(() => useTourStore());
    act(() => {
      result.current.startTour('buyer');
    });
    act(() => {
      result.current.completeTour();
    });
    expect(result.current.isTourActive).toBe(false);
    expect(result.current.hasSeenTour).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('startTour resets hasSeenTour to false', () => {
    const { result } = renderHook(() => useTourStore());
    act(() => {
      result.current.startTour('buyer');
    });
    act(() => {
      result.current.completeTour();
    });
    act(() => {
      result.current.startTour('seller');
    }); // start again
    expect(result.current.hasSeenTour).toBe(false);
  });
});
