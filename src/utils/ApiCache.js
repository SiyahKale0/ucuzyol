// src/utils/ApiCache.js
// API yanıt önbellekleme sistemi

const CACHE_DURATION = 2 * 60 * 1000; // 2 dakika - bilet fiyatları sık değişebilir
const MAX_CACHE_SIZE = 100; // Maximum 100 kayıt

class ApiCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  /**
   * Cache anahtarı oluştur
   */
  generateKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  /**
   * Cache'e kaydet
   */
  set(key, data, duration = CACHE_DURATION) {
    // Cache boyut kontrolü
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, data);
    this.timestamps.set(key, {
      createdAt: Date.now(),
      expiresAt: Date.now() + duration,
    });
  }

  /**
   * Cache'den oku
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp.expiresAt) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Cache'den sil
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * En eski kaydı sil
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, timestamp] of this.timestamps) {
      if (timestamp.createdAt < oldestTime) {
        oldestTime = timestamp.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Tüm cache'i temizle
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Süresi dolmuş kayıtları temizle
   */
  cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.timestamps) {
      if (now > timestamp.expiresAt) {
        this.delete(key);
      }
    }
  }

  /**
   * Cache istatistikleri
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const apiCache = new ApiCache();

/**
 * Cache dekoratörü - fonksiyonları otomatik cache'le
 */
export const withCache = (fn, keyGenerator, duration = CACHE_DURATION) => {
  return async (...args) => {
    const key = keyGenerator(...args);
    
    // Cache kontrolü
    const cached = apiCache.get(key);
    if (cached !== null) {
      console.log(`📦 Cache hit: ${key.substring(0, 50)}...`);
      return cached;
    }

    // API çağrısı
    const result = await fn(...args);
    
    // Başarılı sonucu cache'le
    if (result && (!Array.isArray(result) || result.length > 0)) {
      apiCache.set(key, result, duration);
      console.log(`💾 Cache set: ${key.substring(0, 50)}...`);
    }

    return result;
  };
};

export default apiCache;
