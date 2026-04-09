const router   = require('express').Router();
const ApiKey   = require('../models/ApiKey');
const ReqLog   = require('../models/RequestLog');
const { redis, cacheApiKey } = require('../lib/redis');
const crypto   = require('crypto');

// ── Create a new API key ─────────────────────────────────────────
router.post('/keys', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name || !body.targetUrl) {
      return res.status(400).json({
        error: 'name and targetUrl are required',
      });
    }

    const rawKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
    const prefix = rawKey.slice(0, 8);

    const doc = await ApiKey.create({
      name:        body.name,
      targetUrl:   body.targetUrl,
      rateLimit:   body.rateLimit   || 100,
      ipWhitelist: body.ipWhitelist || [],
      usageLimit:  body.usageLimit  || 10000,
      prefix,
      keyHash: rawKey,
    });

    await cacheApiKey(prefix, doc);

    // Raw key returned only once — never stored in plain text
    res.status(201).json({ key: rawKey, id: doc._id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── List all keys (never return keyHash) ────────────────────────
router.get('/keys', async (req, res) => {
  try {
    const keys = await ApiKey.find().select('-keyHash');
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Update IP whitelist ──────────────────────────────────────────
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
    ).select('-keyHash');
    if (!doc) {
      return res.status(404).json({ error: 'API key not found' });
    }
    await cacheApiKey(doc.prefix, doc);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Toggle key active/inactive ───────────────────────────────────
router.patch('/keys/:id/toggle', async (req, res) => {
  try {
    if (typeof req.body?.isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const doc = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    ).select('-keyHash');
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
    res.status(500).json({ error: err.message });
  }
});

// ── Analytics — last 24h aggregated by hour ──────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const data  = await ReqLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: {
          _id:        { $hour: '$timestamp' },
          total:      { $sum: 1 },
          blocked:    { $sum: { $cond: ['$blocked', 1, 0] } },
          avgLatency: { $avg: '$latencyMs' },
      }},
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Export CSV ───────────────────────────────────────────────────
router.get('/export/csv', async (req, res) => {
  try {
    const { Parser } = require('json2csv');
    const logs = await ReqLog.find().lean().limit(10000);
    const csv  = logs.length > 0
      ? new Parser().parse(logs)
      : 'message\nNo logs available\n';
    res.header('Content-Type', 'text/csv');
    res.attachment('gateway-logs.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Export PDF ───────────────────────────────────────────────────
router.get('/export/pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const doc  = new PDFDocument();
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

    logs.forEach(l => {
      doc.fontSize(9).text(
        `[${new Date(l.timestamp).toISOString()}] ${l.method} ${l.path} → ${l.statusCode} (${l.latencyMs}ms) ${l.blocked ? '⚠ BLOCKED' : ''}`
      );
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
