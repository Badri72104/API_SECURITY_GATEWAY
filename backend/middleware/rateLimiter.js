const { checkRateLimit } = require('../lib/redis');

module.exports = async function rateLimiter(req, res, next) {
  const { rateLimit } = req.keyData;

  try {
    const { allowed, remaining, resetAt } = await checkRateLimit(
      req.keyPrefix,
      rateLimit
    );

    // Set rate limit headers on every response
    res.set({
      'X-RateLimit-Limit':     rateLimit,
      'X-RateLimit-Remaining': remaining,
      'X-RateLimit-Reset':     resetAt,
    });

    if (!allowed) {
      req.blocked     = true;
      req.blockReason = 'RATE_LIMIT_EXCEEDED';
      return res.status(429).json({
        error:      'Rate limit exceeded',
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
      });
    }

    next();

  } catch (err) {
    console.error('[ratelimit] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};