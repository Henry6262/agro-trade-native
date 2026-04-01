import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

/**
 * NI-17: useNetworkStatus
 *
 * Subscribes to the device network state and returns the current connectivity
 * status.  Uses @react-native-community/netinfo under the hood and keeps the
 * value up-to-date via a native event listener.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  useEffect(() => {
    const handleChange = (state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    };

    // Seed with current state immediately
    NetInfo.fetch().then(handleChange);

    const unsubscribe = NetInfo.addEventListener(handleChange);
    return unsubscribe;
  }, []);

  return status;
}
