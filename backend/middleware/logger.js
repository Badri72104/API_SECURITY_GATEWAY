const RequestLog = require('../models/RequestLog');
const ApiKey     = require('../models/ApiKey');

module.exports = function createLogger(io) {
  return async function logger(req, res, next) {
    const start = Date.now();

    res.on('finish', async () => {
      const latencyMs  = Date.now() - start;
      const statusCode = res.statusCode;
      const keyId      = req.keyData?.id || null;

      const logEntry = {
        apiKeyId:    keyId,
        method:      req.method,
        path:        req.path,
        statusCode,
        latencyMs,
        ip:          req.ip,
        blocked:     req.blocked     || false,
        blockReason: req.blockReason || null,
      };

      // Persist log to MongoDB
      try {
        await RequestLog.create(logEntry);
      } catch (err) {
        console.error('[logger] save error:', err.message);
      }

      // Check 90% usage threshold — only if key exists
      if (keyId) {
        try {
          const doc = await ApiKey.findByIdAndUpdate(
            keyId,
            { $inc: { usageCount: 1 } },
            { new: true }
          );
          if (doc) {
            const pct = (doc.usageCount / doc.usageLimit) * 100;
            if (pct >= 90) {
              io.emit('threshold_alert', {
                keyId,
                name:  doc.name,
                usage: doc.usageCount,
                limit: doc.usageLimit,
                pct:   pct.toFixed(1),
              });
            }
          }
        } catch (err) {
          console.error('[logger] usage update error:', err.message);
        }
      }

      // Emit to React dashboard via Socket.io
      io.emit('request_log', {
        ...logEntry,
        timestamp: new Date().toISOString(),
      });
    });

    next();
  };
};