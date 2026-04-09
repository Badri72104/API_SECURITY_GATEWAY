module.exports = function ipWhitelist(req, res, next) {
  const { ipList } = req.keyData;

  // No whitelist configured — allow all IPs
  if (!ipList || ipList.length === 0) return next();

  // Normalize IPv4-mapped IPv6 (::ffff:127.0.0.1 → 127.0.0.1)
  const clientIp = req.ip.replace('::ffff:', '');

  if (ipList.includes(clientIp)) return next();

  req.blocked     = true;
  req.blockReason = 'IP_NOT_WHITELISTED';
  return res.status(403).json({
    error: 'IP not whitelisted',
    ip:    clientIp,
  });
};