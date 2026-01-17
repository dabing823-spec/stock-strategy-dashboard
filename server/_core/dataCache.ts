/**
 * 簡單的內存快取實現
 * 用於緩存 API 數據，避免頻繁調用外部 API
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // 生存時間（毫秒）
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * 設置快取
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  /**
   * 獲取快取
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 檢查是否過期
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 檢查快取是否存在且未過期
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 清除特定快取
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清除所有快取
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 獲取快取大小
   */
  size(): number {
    return this.cache.size;
  }
}

// 導出單例
export const dataCache = new DataCache();

/**
 * 帶快取的 API 調用包裝器
 */
export async function cachedApiCall<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T | null> {
  try {
    // 檢查快取
    const cached = dataCache.get<T>(key);
    if (cached) {
      console.log(`[Cache] Hit for key: ${key}`);
      return cached;
    }

    // 調用 API
    console.log(`[Cache] Miss for key: ${key}, fetching from API`);
    const data = await fetcher();

    // 保存到快取
    if (data) {
      dataCache.set(key, data, ttlSeconds);
    }

    return data;
  } catch (error) {
    console.error(`[Cache] Error fetching ${key}:`, error);
    return null;
  }
}
