// src/hooks/useAsyncStorage.js
// AsyncStorage wrapper hook'u - kalıcı veri saklama

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage hook'u
 * @param {string} key - Storage anahtarı
 * @param {any} initialValue - Başlangıç değeri
 * @returns {[any, Function, Function, boolean]} - [value, setValue, removeValue, loading]
 */
export const useAsyncStorage = (key, initialValue = null) => {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Storage'dan değeri oku
  useEffect(() => {
    const loadValue = async () => {
      try {
        setLoading(true);
        const item = await AsyncStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch (e) {
        console.error(`AsyncStorage read error for key "${key}":`, e);
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [key]);

  // Değeri kaydet
  const setValue = useCallback(async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (e) {
      console.error(`AsyncStorage write error for key "${key}":`, e);
      setError(e);
    }
  }, [key, storedValue]);

  // Değeri sil
  const removeValue = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (e) {
      console.error(`AsyncStorage remove error for key "${key}":`, e);
      setError(e);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue, loading, error];
};

/**
 * Son aramalar hook'u
 * @param {number} maxItems - Maksimum kayıt sayısı
 * @returns {Object} - { searches, addSearch, clearSearches, loading }
 */
export const useRecentSearches = (maxItems = 10) => {
  const [searches, setSearches, clearSearches, loading] = useAsyncStorage('recent_searches', []);

  const addSearch = useCallback(async (kalkis, varis, tarih) => {
    const newSearch = {
      id: Date.now(),
      kalkis,
      varis,
      tarih,
      timestamp: new Date().toISOString(),
    };

    const updatedSearches = [
      newSearch,
      ...searches.filter(s => !(s.kalkis === kalkis && s.varis === varis)),
    ].slice(0, maxItems);

    await setSearches(updatedSearches);
  }, [searches, setSearches, maxItems]);

  return { searches, addSearch, clearSearches, loading };
};

/**
 * Favori rotalar hook'u
 * @returns {Object} - { favorites, addFavorite, removeFavorite, isFavorite, loading }
 */
export const useFavoriteRoutes = () => {
  const [favorites, setFavorites, clearFavorites, loading] = useAsyncStorage('favorite_routes', []);

  const addFavorite = useCallback(async (route) => {
    const newFavorite = {
      ...route,
      favoritedAt: new Date().toISOString(),
    };

    await setFavorites([...favorites, newFavorite]);
  }, [favorites, setFavorites]);

  const removeFavorite = useCallback(async (routeId) => {
    await setFavorites(favorites.filter(f => f.id !== routeId));
  }, [favorites, setFavorites]);

  const isFavorite = useCallback((routeId) => {
    return favorites.some(f => f.id === routeId);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite, clearFavorites, loading };
};

export default useAsyncStorage;
