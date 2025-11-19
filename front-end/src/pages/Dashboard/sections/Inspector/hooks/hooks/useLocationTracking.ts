import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { UseLocationTrackingReturn } from '../types';

export const useLocationTracking = (): UseLocationTrackingReturn => {
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 42.6977,
    longitude: 23.3219,
    accuracy: 10,
    heading: 45,
    speed: 0,
  });
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const [error, setError] = useState<string | null>(null);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    checkLocationPermission();
    return () => {
      stopTracking();
    };
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        startTracking();
      }
    } catch (err) {
      console.error('Permission check error:', err);
      setError(err instanceof Error ? err.message : 'Permission check failed');
    }
  };

  const startTracking = async () => {
    try {
      setError(null);

      // Check permissions first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionStatus(status);
        setError('Location permission not granted');
        return;
      }

      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setError('Location services are disabled');
        return;
      }

      setIsTracking(true);

      // Get initial position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // Accept cached location up to 10s old
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 10,
        heading: location.coords.heading || 0,
        speed: location.coords.speed || 0,
      });

      // Start watching position
      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 10,
            heading: location.coords.heading || 0,
            speed: location.coords.speed || 0,
          });
        }
      );

      console.log('Started real-time location tracking');
    } catch (err) {
      console.error('Location tracking error:', err);
      setError(err instanceof Error ? err.message : 'Unknown location error');
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    setIsTracking(false);
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
    }
    console.log('Stopped location tracking');
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return {
    currentLocation,
    isTracking,
    permissionStatus,
    error,
    startTracking,
    stopTracking,
    calculateDistance,
  };
};
