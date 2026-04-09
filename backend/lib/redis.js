require('dotenv').config();
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  lazyConnect: true,
  connectTimeout: 1000,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});

redis.on('connect', () => console.log('[redis] connected'));
redis.on('error',   (err) => console.error('[redis] error:', err.message));

async function ensureRedisConnection() {
  if (redis.status === 'ready') {
    return true;
  }

  try {
    await redis.connect();
    return true;
  } catch (err) {
    console.error('[redis] unavailable:', err.message);
    return false;
  }
}

// Cache an API key from MongoDB into Redis
async function cacheApiKey(prefix, doc) {
  const isReady = await ensureRedisConnection();
  if (!isReady) {
    return false;
  }

  const key = `apikeys:${prefix}`;
  await redis.hset(key, {
    id:        doc._id.toString(),
    targetUrl: doc.targetUrl,
    rateLimit: doc.rateLimit.toString(),
    ipList:    JSON.stringify(doc.ipWhitelist),
    keyHash:   doc.keyHash,
    active:    doc.isActive ? '1' : '0',  // correctly reflects current state
  });
  await redis.expire(key, 300);
  return true;
}

// Retrieve a cached key (returns null on miss)
async function getCachedKey(prefix) {
  const isReady = await ensureRedisConnection();
  if (!isReady) {
    return null;
  }

  try {
    const data = await redis.hgetall(`apikeys:${prefix}`);
    if (!data || !data.id) return null;
    return {
      ...data,
      rateLimit: parseInt(data.rateLimit, 10),
      ipList:    JSON.parse(data.ipList || '[]'),
    };
  } catch (err) {
    console.error('[redis] cache read failed:', err.message);
    return null;
  }
}

// Fixed window rate limiter
// Returns { allowed, remaining, resetAt }
async function checkRateLimit(prefix, limitPerMin) {
  const isReady = await ensureRedisConnection();
  if (!isReady) {
    return {
      allowed: true,
      remaining: limitPerMin,
      resetAt: Date.now() + 60000,
    };
  }

  const minute = Math.floor(Date.now() / 60000);
  const key    = `ratelimit:${prefix}:${minute}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    return {
      allowed:   count <= limitPerMin,
      remaining: Math.max(0, limitPerMin - count),
      resetAt:   (minute + 1) * 60000,
    };
  } catch (err) {
    console.error('[redis] rate limit fallback:', err.message);
    return {
      allowed: true,
      remaining: limitPerMin,
      resetAt: Date.now() + 60000,
    };
  }
}

module.exports = { redis, cacheApiKey, getCachedKey, checkRateLimit };
