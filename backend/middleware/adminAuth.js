const crypto = require('crypto');

const SESSION_TTL_MS = parseInt(process.env.ADMIN_SESSION_TTL_MS || '86400000', 10);

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload) {
  const secret = getRequiredEnv('ADMIN_SESSION_SECRET');
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
}

function createAdminToken(username) {
  const payload = base64url(JSON.stringify({
    sub: username,
    exp: Date.now() + SESSION_TTL_MS,
  }));
  return `${payload}.${sign(payload)}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const provided = Buffer.from(signature);
  const actual = Buffer.from(expected);
  if (provided.length !== actual.length || !crypto.timingSafeEqual(provided, actual)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session.exp || session.exp < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function secureCompare(value, expected) {
  const valueBuffer = Buffer.from(value || '');
  const expectedBuffer = Buffer.from(expected || '');

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const session = verifyAdminToken(token);

  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.admin = session;
  next();
}

function authenticateAdminCredentials(username, password) {
  const expectedUser = getRequiredEnv('ADMIN_USERNAME');
  const expectedPassword = getRequiredEnv('ADMIN_PASSWORD');

  return secureCompare(username, expectedUser) && secureCompare(password, expectedPassword);
}

module.exports = {
  authenticateAdminCredentials,
  createAdminToken,
  requireAdmin,
  verifyAdminToken,
};
