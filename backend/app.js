require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

const authenticate = require('./middleware/authenticate');
const ipWhitelist = require('./middleware/ipWhitelist');
const rateLimiter = require('./middleware/rateLimiter');
const createLogger = require('./middleware/logger');
const createProxy = require('./middleware/proxyEngine');
const { requireAdmin, verifyAdminToken } = require('./middleware/adminAuth');

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function validateEnv() {
  const required = ['MONGO_URI', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET'];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGIN is required in production');
  }
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use(
  '/proxy',
  createLogger(io),
  authenticate,
  ipWhitelist,
  rateLimiter,
  createProxy()
);

app.use('/api/auth', require('./routes/auth'));
app.use('/api', requireAdmin, require('./routes/dashboard'));

io.use((socket, next) => {
  const session = verifyAdminToken(socket.handshake.auth?.token);
  if (!session) {
    next(new Error('Authentication required'));
    return;
  }

  socket.admin = session;
  next();
});

io.on('connection', (socket) => {
  console.log(`[ws] client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[ws] client disconnected: ${socket.id}`);
  });
});

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[db] MongoDB connected');
  } catch (err) {
    console.error('[db] Connection failed:', err.message);
    process.exit(1);
  }
}

async function start() {
  validateEnv();
  await connectDB();

  const port = process.env.PORT || 4000;
  server.listen(port, () => {
    console.log(`[server] Running on port ${port}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('[server] Startup failed:', err.message);
    process.exit(1);
  });
}

module.exports = { app, io, server, start, validateEnv };
