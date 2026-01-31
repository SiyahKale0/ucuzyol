// src/hooks/useNetworkStatus.js
// Network durumu izleme hook'u

import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Network durumu hook'u
 * @returns {Object} - { isConnected, isInternetReachable, connectionType, refresh }
 */
export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
    details: null,
  });

  const refresh = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        connectionType: state.type,
        details: state.details,
      });
    } catch (error) {
      console.warn('Network status fetch error:', error);
    }
  }, []);

  useEffect(() => {
    // İlk kontrol
    refresh();

    // Değişiklikleri dinle
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        connectionType: state.type,
        details: state.details,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [refresh]);

  return {
    ...networkState,
    refresh,
    isOffline: !networkState.isConnected,
  };
};

/**
 * Basit online/offline durumu
 * @returns {boolean} - Online mı?
 */
export const useIsOnline = () => {
  const { isConnected } = useNetworkStatus();
  return isConnected;
};

export default useNetworkStatus;
