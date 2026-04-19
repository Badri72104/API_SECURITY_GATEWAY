const ApiKey  = require('../models/ApiKey');
const bcrypt  = require('bcrypt');
const { getCachedKey, cacheApiKey } = require('../lib/redis');

module.exports = async function authenticate(req, res, next) {
  const rawKey = req.headers['x-api-key'];

  if (!rawKey) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  const prefix = rawKey.slice(0, 8);

  try {
    // 1. Try Redis cache first
    let keyData = await getCachedKey(prefix);
    let doc = null;

    // 2. Cache miss — check MongoDB (include inactive keys too)
    if (!keyData) {
      doc = await ApiKey.findOne({ prefix }).select('+keyHash');
      if (!doc) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      await cacheApiKey(prefix, doc);
      keyData = await getCachedKey(prefix);
      if (!keyData) {
        keyData = {
          id: doc._id.toString(),
          targetUrl: doc.targetUrl,
          rateLimit: doc.rateLimit,
          ipList: doc.ipWhitelist || [],
          keyHash: doc.keyHash,
          active: doc.isActive ? '1' : '0',
        };
      }
    }

    // 3. Verify bcrypt FIRST before checking active status
    const valid = await bcrypt.compare(rawKey, keyData.keyHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // 4. THEN check if key is active
    if (keyData.active !== '1') {
      return res.status(403).json({ error: 'API key disabled' });
    }

    // 5. Attach to request for downstream middleware
    req.keyData   = keyData;
    req.keyPrefix = prefix;
    next();

  } catch (err) {
    console.error('[auth] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
