const router = require('express').Router();
const crypto = require('crypto');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

const ApiKey = require('../models/ApiKey');
const ReqLog = require('../models/RequestLog');
const { redis, cacheApiKey } = require('../lib/redis');

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function publicKey(doc) {
  const key = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete key.keyHash;
  return key;
}

router.post('/keys', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name || !body.targetUrl) {
      return res.status(400).json({ error: 'name and targetUrl are required' });
    }

    if (!isHttpUrl(body.targetUrl)) {
      return res.status(400).json({ error: 'targetUrl must be a valid HTTP or HTTPS URL' });
    }

    const rateLimit = Number(body.rateLimit || 100);
    const usageLimit = Number(body.usageLimit || 10000);
    if (!Number.isInteger(rateLimit) || rateLimit < 1 || !Number.isInteger(usageLimit) || usageLimit < 1) {
      return res.status(400).json({ error: 'rateLimit and usageLimit must be positive integers' });
    }

    const rawKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
    const prefix = rawKey.slice(0, 8);
    const doc = await ApiKey.create({
      name: body.name,
      targetUrl: body.targetUrl,
      rateLimit,
      ipWhitelist: Array.isArray(body.ipWhitelist) ? body.ipWhitelist : [],
      usageLimit,
      prefix,
      keyHash: rawKey,
    });

    await cacheApiKey(prefix, doc);
    res.status(201).json({ key: rawKey, id: doc._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

router.get('/keys', async (req, res) => {
  try {
    const keys = await ApiKey.find().sort({ createdAt: -1 });
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load API keys' });
  }
});

router.patch('/keys/:id/whitelist', async (req, res) => {
  try {
    const ips = Array.isArray(req.body?.ips) ? req.body.ips : null;
    if (!ips) {
      return res.status(400).json({ error: 'ips must be an array' });
    }

    const doc = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { ipWhitelist: ips },
      { new: true }
    ).select('+keyHash');

    if (!doc) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await cacheApiKey(doc.prefix, doc);
    res.json(publicKey(doc));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update whitelist' });
  }
});

router.patch('/keys/:id/toggle', async (req, res) => {
  try {
    if (typeof req.body?.isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const doc = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ error: 'API key not found' });
    }

    try {
      await redis.del(`apikeys:${doc.prefix}`);
    } catch (err) {
      console.error('[redis] cache clear failed:', err.message);
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const data = await ReqLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          total: { $sum: 1 },
          blocked: { $sum: { $cond: ['$blocked', 1, 0] } },
          avgLatency: { $avg: '$latencyMs' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 500), 1000);
    const logs = await ReqLog.find()
      .lean()
      .limit(limit)
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load logs' });
  }
});

router.get('/export/csv', async (req, res) => {
  try {
    const logs = await ReqLog.find().lean().limit(10000).sort({ timestamp: -1 });
    const csv = logs.length > 0
      ? new Parser().parse(logs)
      : 'message\nNo logs available\n';
    res.header('Content-Type', 'text/csv');
    res.attachment('gateway-logs.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

router.get('/export/pdf', async (req, res) => {
  try {
    const doc = new PDFDocument();
    const logs = await ReqLog.find()
      .lean()
      .limit(100)
      .sort({ timestamp: -1 });

    res.header('Content-Type', 'application/pdf');
    res.attachment('gateway-report.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('API Gateway Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(`Generated: ${new Date().toISOString()}`);
    doc.moveDown();

    logs.forEach((log) => {
      const status = log.blocked ? 'BLOCKED' : 'OK';
      doc.fontSize(9).text(
        `[${new Date(log.timestamp).toISOString()}] ${log.method} ${log.path} -> ${log.statusCode} (${log.latencyMs}ms) ${status}`
      );
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

module.exports = router;
