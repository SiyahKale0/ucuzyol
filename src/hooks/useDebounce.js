// src/hooks/useDebounce.js
// Debounce hook - arama ve input optimizasyonu için

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounced değer hook'u
 * @param {any} value - Debounce edilecek değer
 * @param {number} delay - Gecikme süresi (ms)
 * @returns {any} - Debounced değer
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Debounced callback hook'u
 * @param {Function} callback - Debounce edilecek fonksiyon
 * @param {number} delay - Gecikme süresi (ms)
 * @param {Array} deps - Dependency array
 * @returns {Function} - Debounced fonksiyon
 */
export const useDebouncedCallback = (callback, delay = 300, deps = []) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Callback'i güncelle
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay, ...deps]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Throttle hook'u - rate limiting için
 * @param {any} value - Throttle edilecek değer
 * @param {number} limit - Minimum süre aralığı (ms)
 * @returns {any} - Throttled değer
 */
export const useThrottle = (value, limit = 300) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

export default useDebounce;
