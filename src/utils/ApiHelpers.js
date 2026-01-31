// src/utils/ApiHelpers.js
// API yardımcı fonksiyonları - retry, timeout, rate limiting

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry mekanizması ile fetch
 * @param {string} url - API URL
 * @param {Object} options - Fetch options
 * @param {number} maxRetries - Maksimum deneme sayısı
 * @param {number} timeout - Timeout süresi (ms)
 * @returns {Promise<Response>} - Fetch response
 */
export const fetchWithRetry = async (url, options = {}, maxRetries = 3, timeout = 15000) => {
  let lastError;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Timeout ile fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      if (__DEV__) console.log(`🔄 Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);

      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError;
};

/**
 * Timeout ile fetch
 * @param {Function} fetchFn - Fetch fonksiyonu
 * @param {number} timeout - Timeout süresi (ms)
 * @returns {Promise} - Sonuç
 */
export const fetchWithTimeout = (fetchFn, timeout = 15000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`İstek zaman aşımına uğradı (${timeout}ms)`));
    }, timeout);

    fetchFn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

/**
 * Rate limiter
 */
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async waitForSlot() {
    const now = Date.now();
    
    // Eski istekleri temizle
    this.requests = this.requests.filter(t => now - t < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      // Bekleme süresi hesapla
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (__DEV__) console.log(`⏳ Rate limit: ${waitTime}ms bekleniyor...`);
      await sleep(waitTime);
      
      return this.waitForSlot(); // Tekrar dene
    }

    this.requests.push(now);
    return true;
  }
  
  // Alias for backward compatibility
  acquire() {
    return this.waitForSlot();
  }
}

// Global rate limiter (dakikada max 60 istek)
export const globalRateLimiter = new RateLimiter(60, 60000);

/**
 * Paralel istekleri sınırlı şekilde çalıştır
 * @param {Array} tasks - Promise döndüren fonksiyon dizisi
 * @param {number} concurrency - Eşzamanlı istek limiti
 * @returns {Promise<Array>} - Sonuçlar
 */
export const parallelLimit = async (tasks, concurrency = 3) => {
  const results = [];
  const executing = new Set();

  for (const [index, task] of tasks.entries()) {
    const promise = Promise.resolve().then(() => task());
    results[index] = promise;

    const cleanup = () => executing.delete(promise);
    executing.add(promise);
    promise.then(cleanup, cleanup);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
};

/**
 * Hata mesajlarını kullanıcı dostu hale getir
 */
export const formatErrorMessage = (error) => {
  if (!error) return 'Bilinmeyen bir hata oluştu';

  // Network hataları
  if (error.message?.includes('Network request failed')) {
    return 'İnternet bağlantınızı kontrol edin';
  }
  if (error.message?.includes('timeout') || error.message?.includes('zaman aşımı')) {
    return 'Sunucu yanıt vermedi, lütfen tekrar deneyin';
  }

  // HTTP hataları
  if (error.status === 404) {
    return 'Aradığınız sefer bulunamadı';
  }
  if (error.status === 429) {
    return 'Çok fazla istek gönderildi, biraz bekleyin';
  }
  if (error.status >= 500) {
    return 'Sunucu hatası, lütfen daha sonra tekrar deneyin';
  }

  // Genel mesaj
  return error.message || 'Bir hata oluştu';
};

/**
 * API yanıtını normalize et
 */
export const normalizeApiResponse = (response, options = {}) => {
  const { defaultValue = null, extractPath = null } = options;

  if (!response) return defaultValue;

  if (extractPath) {
    const value = extractPath.split('.').reduce((obj, key) => obj?.[key], response);
    return value ?? defaultValue;
  }

  return response;
};

/**
 * Batch API istekleri
 */
export const batchRequests = async (items, batchFn, batchSize = 5) => {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(batchFn));
    results.push(...batchResults);

    // Batch'ler arası kısa bekleme
    if (i + batchSize < items.length) {
      await sleep(100);
    }
  }

  return results;
};

export default {
  fetchWithRetry,
  fetchWithTimeout,
  globalRateLimiter,
  sleep,
  parallelLimit,
  formatErrorMessage,
  normalizeApiResponse,
  batchRequests,
};
