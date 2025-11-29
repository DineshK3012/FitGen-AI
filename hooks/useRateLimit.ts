import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RateLimitConfig {
  limit: number; // Number of requests allowed
  interval: number; // Interval in milliseconds (e.g., 60000 for 1 minute)
}

/**
 * Custom hook to prevent excessive API usage.
 * Stores timestamps in localStorage to persist across reloads.
 */
export function useRateLimit(key: string, config: RateLimitConfig = { limit: 5, interval: 60000 }) {
  const [isLimited, setIsLimited] = useState(false);

  const checkLimit = useCallback((): boolean => {
    const storageKey = `ratelimit_${key}`;
    const now = Date.now();
    
    // Get existing timestamps
    const timestampsStr = localStorage.getItem(storageKey);
    let timestamps: number[] = [];
    
    try {
      if (timestampsStr) {
        const parsed = JSON.parse(timestampsStr);
        if (Array.isArray(parsed)) {
          timestamps = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse rate limit timestamps', e);
      timestamps = [];
    }

    // Filter out timestamps older than the interval
    timestamps = timestamps.filter(t => typeof t === 'number' && now - t < config.interval);

    if (timestamps.length >= config.limit) {
      const resetTime = Math.ceil((config.interval - (now - timestamps[0])) / 1000);
      setIsLimited(true);
      toast.warning(`Rate limit reached. Please wait ${resetTime} seconds.`);
      return false;
    }

    // Add new timestamp
    timestamps.push(now);
    localStorage.setItem(storageKey, JSON.stringify(timestamps));
    setIsLimited(false);
    return true;
  }, [key, config]);

  return { checkLimit, isLimited };
}