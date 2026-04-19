const router = require('express').Router();
const {
  authenticateAdminCredentials,
  createAdminToken,
  requireAdmin,
} = require('../middleware/adminAuth');

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!authenticateAdminCredentials(username, password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = createAdminToken(username);
  res.json({
    token,
    user: {
      username,
      email: process.env.ADMIN_EMAIL || '',
    },
  });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({
    user: {
      username: req.admin.sub,
      email: process.env.ADMIN_EMAIL || '',
    },
  });
});

module.exports = router;
