import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLocationTracking } from '../../../src/features/dashboard/screens/inspector/hooks/useLocationTracking';
import * as Location from 'expo-location';

jest.mock('expo-location');

describe('useLocationTracking', () => {
  const mockLocation = {
    coords: {
      latitude: 42.6977,
      longitude: 23.3219,
      accuracy: 10,
      altitude: 550,
      heading: 45,
      speed: 15.5,
    },
    timestamp: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockLocation);
    (Location.watchPositionAsync as jest.Mock).mockImplementation((options, callback) => {
      callback(mockLocation);
      return Promise.resolve({ remove: jest.fn() });
    });
  });

  it('should request location permissions on mount', async () => {
    renderHook(() => useLocationTracking());

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
    });
  });

  it('should get current location', async () => {
    const { result } = renderHook(() => useLocationTracking());

    await waitFor(() => {
      expect(result.current.currentLocation).toEqual({
        latitude: mockLocation.coords.latitude,
        longitude: mockLocation.coords.longitude,
        accuracy: mockLocation.coords.accuracy,
        heading: mockLocation.coords.heading,
        speed: mockLocation.coords.speed,
      });
    });
  });

  it('should start tracking location', async () => {
    const { result } = renderHook(() => useLocationTracking());

    await act(async () => {
      await result.current.startTracking();
    });

    expect(result.current.isTracking).toBe(true);
    expect(Location.watchPositionAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 10, // 10 meters
      }),
      expect.any(Function)
    );
  });

  it('should stop tracking location', async () => {
    const mockRemove = jest.fn();
    (Location.watchPositionAsync as jest.Mock).mockResolvedValue({
      remove: mockRemove,
    });

    const { result } = renderHook(() => useLocationTracking());

    await act(async () => {
      await result.current.startTracking();
      await result.current.stopTracking();
    });

    expect(result.current.isTracking).toBe(false);
    expect(mockRemove).toHaveBeenCalled();
  });

  it('should update location on position change', async () => {
    const { result } = renderHook(() => useLocationTracking());

    const newLocation = {
      coords: {
        latitude: 42.7077,
        longitude: 23.3319,
        accuracy: 8,
        altitude: 545,
        heading: 50,
        speed: 18.2,
      },
      timestamp: Date.now(),
    };

    await act(async () => {
      await result.current.startTracking();
    });

    act(() => {
      const callback = (Location.watchPositionAsync as jest.Mock).mock.calls[0][1];
      callback(newLocation);
    });

    expect(result.current.currentLocation).toEqual({
      latitude: newLocation.coords.latitude,
      longitude: newLocation.coords.longitude,
      accuracy: newLocation.coords.accuracy,
      heading: newLocation.coords.heading,
      speed: newLocation.coords.speed,
    });
  });

  it('should handle permission denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const { result } = renderHook(() => useLocationTracking());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe('denied');
      expect(result.current.currentLocation).toBeNull();
    });
  });

  it('should calculate distance between two points', () => {
    const { result } = renderHook(() => useLocationTracking());

    const distance = result.current.calculateDistance(
      42.6977,
      23.3219, // Point 1
      42.7077,
      23.3319 // Point 2
    );

    expect(distance).toBeCloseTo(1.41, 1); // ~1.41 km
  });

  it('should handle location errors', async () => {
    const mockError = new Error('Location unavailable');
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useLocationTracking());

    await waitFor(() => {
      expect(result.current.error).toBe('Location unavailable');
      expect(result.current.currentLocation).toBeNull();
    });
  });

  it('should enable background tracking for active job', async () => {
    const { result } = renderHook(() =>
      useLocationTracking({
        enableBackground: true,
      })
    );

    await act(async () => {
      await result.current.startTracking();
    });

    expect(Location.watchPositionAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        mayShowUserSettingsDialog: true,
        foregroundService: {
          notificationTitle: 'Location Tracking',
          notificationBody: 'Tracking location for active job',
        },
      }),
      expect.any(Function)
    );
  });

  it('should clean up on unmount', async () => {
    const mockRemove = jest.fn();
    (Location.watchPositionAsync as jest.Mock).mockResolvedValue({
      remove: mockRemove,
    });

    const { result, unmount } = renderHook(() => useLocationTracking());

    await act(async () => {
      await result.current.startTracking();
    });

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });
});
