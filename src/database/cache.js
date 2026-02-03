import { LRUCache } from 'lru-cache';
import config from '../config.js';

const contextCache = new LRUCache({
  max: config.cache.maxSize,
  ttl: config.cache.ttlMinutes * 60 * 1000,
  updateAgeOnGet: true
});

const userCache = new LRUCache({
  max: 50,
  ttl: 10 * 60 * 1000
});

const rateLimitCache = new LRUCache({
  max: 100,
  ttl: config.rateLimit.windowSeconds * 1000
});

export function getContextCache(channelId) {
  return contextCache.get(channelId);
}

export function setContextCache(channelId, messages) {
  contextCache.set(channelId, messages);
}

export function getUserCache(userId) {
  return userCache.get(userId);
}

export function setUserCache(userId, data) {
  userCache.set(userId, data);
}

export function getRateLimit(userId) {
  return rateLimitCache.get(userId) || { count: 0, start: Date.now() };
}

export function setRateLimit(userId, data) {
  rateLimitCache.set(userId, data);
}

export function checkRateLimit(userId) {
  const limit = getRateLimit(userId);
  const now = Date.now();
  const windowMs = config.rateLimit.windowSeconds * 1000;
  
  if (now - limit.start > windowMs) {
    setRateLimit(userId, { count: 1, start: now });
    return { allowed: true, remaining: config.rateLimit.maxRequests - 1 };
  }
  
  if (limit.count >= config.rateLimit.maxRequests) {
    const resetIn = Math.ceil((limit.start + windowMs - now) / 1000);
    return { allowed: false, resetIn };
  }
  
  setRateLimit(userId, { count: limit.count + 1, start: limit.start });
  return { allowed: true, remaining: config.rateLimit.maxRequests - limit.count - 1 };
}

export function clearAllCaches() {
  contextCache.clear();
  userCache.clear();
  rateLimitCache.clear();
}

export default {
  getContextCache, setContextCache,
  getUserCache, setUserCache,
  getRateLimit, setRateLimit, checkRateLimit,
  clearAllCaches
};
