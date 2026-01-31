// src/hooks/useAppState.js
// App yaşam döngüsü ve state hook'ları

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Platform, Dimensions, Keyboard } from 'react-native';

/**
 * App foreground/background durumu
 * @returns {Object} - { appState, isForeground, isBackground }
 */
export const useAppState = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    appState,
    isForeground: appState === 'active',
    isBackground: appState === 'background',
    isInactive: appState === 'inactive',
  };
};

/**
 * App foreground'a geldiğinde callback çalıştır
 * @param {Function} callback - Foreground'a gelince çalışacak fonksiyon
 */
export const useOnForeground = (callback) => {
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current !== 'active' && nextAppState === 'active') {
        callback();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [callback]);
};

/**
 * Ekran boyutları hook'u
 * @returns {Object} - { width, height, isPortrait, isLandscape }
 */
export const useDimensions = () => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    ...dimensions,
    isPortrait: dimensions.height > dimensions.width,
    isLandscape: dimensions.width > dimensions.height,
  };
};

/**
 * Keyboard durumu hook'u
 * @returns {Object} - { isKeyboardVisible, keyboardHeight }
 */
export const useKeyboard = () => {
  const [keyboardState, setKeyboardState] = useState({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardState({
        isVisible: true,
        height: e.endCoordinates.height,
      });
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardState({
        isVisible: false,
        height: 0,
      });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    isKeyboardVisible: keyboardState.isVisible,
    keyboardHeight: keyboardState.height,
    dismissKeyboard: dismiss,
  };
};

/**
 * Mounting durumu hook'u (memory leak önleme)
 * @returns {Object} - { isMounted }
 */
export const useMounted = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { isMounted: isMountedRef };
};

/**
 * Previous value hook'u
 * @param {any} value - İzlenecek değer
 * @returns {any} - Önceki değer
 */
export const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

export default useAppState;
