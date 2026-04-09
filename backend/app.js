require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const helmet     = require('helmet');
const cors       = require('cors');
const mongoose   = require('mongoose');

const authenticate = require('./middleware/authenticate');
const ipWhitelist  = require('./middleware/ipWhitelist');
const rateLimiter  = require('./middleware/rateLimiter');
const createLogger = require('./middleware/logger');
const createProxy  = require('./middleware/proxyEngine');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*' }
});

// ── Global middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Proxy route (full middleware chain) ──────────────────────────
app.use('/proxy',
  createLogger(io),   // ① log EVERYTHING including blocked requests
  authenticate,       // ② validate x-api-key
  ipWhitelist,        // ③ check IP whitelist
  rateLimiter,        // ④ check rate limit
  createProxy(),      // ⑤ forward to upstream
);

// ── Dashboard API routes ─────────────────────────────────────────
app.use('/api', require('./routes/dashboard'));

// ── Socket.io connection log ─────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[ws] client connected: ${socket.id}`);
  socket.on('disconnect', () =>
    console.log(`[ws] client disconnected: ${socket.id}`)
  );
});

// ── MongoDB + server start ───────────────────────────────────────
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
  await connectDB();
  server.listen(process.env.PORT, () => {
    console.log(`[server] Running on http://localhost:${process.env.PORT}`);
  });
}

start();

module.exports = { app, io };