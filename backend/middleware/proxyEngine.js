const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function createProxy() {
  return (req, res, next) => {
    const target = req.keyData?.targetUrl;

    if (!target) {
      return res.status(500).json({ error: 'No target URL configured' });
    }

    return createProxyMiddleware({
      target,
      changeOrigin: true,
      timeout:      parseInt(process.env.PROXY_TIMEOUT_MS || '5000', 10),
      proxyTimeout: parseInt(process.env.PROXY_TIMEOUT_MS || '5000', 10),
      on: {
        error: (err, req, res) => {
          console.error('[proxy] error:', err.message);
          res.status(502).json({
            error:  'Upstream error',
            detail: err.message,
          });
        },
      },
    })(req, res, next);
  };
};