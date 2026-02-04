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

export function getContext(channelId) {
  return contextCache.get(channelId);
}

export function setContext(channelId, messages) {
  contextCache.set(channelId, messages);
}

export function getUser(userId) {
  return userCache.get(userId);
}

export function setUser(userId, data) {
  userCache.set(userId, data);
}

export function checkRateLimit(userId) {
  const limit = rateLimitCache.get(userId) || { count: 0, start: Date.now() };
  const now = Date.now();
  const windowMs = config.rateLimit.windowSeconds * 1000;

  if (now - limit.start > windowMs) {
    rateLimitCache.set(userId, { count: 1, start: now });
    return { allowed: true, remaining: config.rateLimit.maxRequests - 1 };
  }

  if (limit.count >= config.rateLimit.maxRequests) {
    const resetIn = Math.ceil((limit.start + windowMs - now) / 1000);
    return { allowed: false, resetIn };
  }

  rateLimitCache.set(userId, { count: limit.count + 1, start: limit.start });
  return { allowed: true, remaining: config.rateLimit.maxRequests - limit.count - 1 };
}

export default { getContext, setContext, getUser, setUser, checkRateLimit };
