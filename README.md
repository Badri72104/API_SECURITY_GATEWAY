# API Security Gateway

A full-stack API gateway and dashboard for creating API keys, proxying upstream requests, viewing live logs, tracking analytics, exporting reports, and monitoring gateway activity.

The current project is split into two main applications:

- `backend/`: Express API gateway, dashboard API, MongoDB models, Redis helpers, proxy middleware, and Socket.IO events
- `frontend/`: React + Vite dashboard for login, analytics, live logs, API key management, exports, and settings

## Features

- Dashboard admin login backed by server-side credentials
- Bearer-token protected dashboard API routes
- API key creation and management
- API keys stored as bcrypt hashes
- Per-key target upstream URL
- Authenticated proxy routing through `/proxy/*`
- IP whitelist checks
- Redis-backed rate limiting with graceful fallback behavior
- MongoDB-backed key and request-log persistence
- Request logging and analytics
- Live dashboard updates through authenticated Socket.IO
- CSV and PDF report export
- Dark and light mode UI

## Tech Stack

Backend:

- Node.js
- Express 5
- MongoDB with Mongoose
- Redis with `ioredis`
- Socket.IO
- `http-proxy-middleware`
- `bcrypt`
- `helmet`
- `cors`
- `json2csv`
- `pdfkit`

Frontend:

- React 19
- Vite
- Tailwind CSS
- React Router
- Axios
- Chart.js with `react-chartjs-2`
- Socket.IO client
- React Hot Toast
- React Window
- date-fns

## Project Structure

```text
.
+-- README.md
+-- PROJECT_STRUCTURE.md
+-- package-lock.json
+-- backend/
|   +-- app.js
|   +-- package.json
|   +-- package-lock.json
|   +-- .env.example
|   +-- lib/
|   |   +-- redis.js
|   +-- middleware/
|   |   +-- adminAuth.js
|   |   +-- authenticate.js
|   |   +-- ipWhitelist.js
|   |   +-- logger.js
|   |   +-- proxyEngine.js
|   |   +-- rateLimiter.js
|   +-- models/
|   |   +-- ApiKey.js
|   |   +-- RequestLog.js
|   +-- routes/
|       +-- auth.js
|       +-- dashboard.js
+-- frontend/
    +-- index.html
    +-- package.json
    +-- package-lock.json
    +-- vite.config.js
    +-- .env.example
    +-- public/
    |   +-- favicon.svg
    |   +-- icons.svg
    +-- src/
        +-- App.jsx
        +-- main.jsx
        +-- index.css
        +-- assets/
        |   +-- hero.png
        +-- components/
        |   +-- AnalyticsChart.jsx
        |   +-- ApiKeyManager.jsx
        |   +-- ExportButtons.jsx
        |   +-- LiveLogViewer.jsx
        |   +-- LogFilter.jsx
        |   +-- MainLayout.jsx
        |   +-- ProtectedRoute.jsx
        +-- context/
        |   +-- AuthContext.jsx
        |   +-- GatewayProvider.jsx
        |   +-- ThemeContext.jsx
        +-- hooks/
        |   +-- useGatewaySocket.js
        +-- lib/
        |   +-- api.js
        +-- pages/
            +-- ApiKeysPage.jsx
            +-- DashboardPage.jsx
            +-- LogsPage.jsx
            +-- LoginPage.jsx
            +-- SettingsPage.jsx
```

`PROJECT_STRUCTURE.md` contains an additional architecture walkthrough. The root `package-lock.json` is not the primary application entry point; install and run dependencies inside `backend/` and `frontend/`.

## Backend Architecture

The backend entry point is `backend/app.js`.

Responsibilities:

- loads environment variables
- validates required configuration
- creates the Express app
- creates the HTTP server
- attaches Socket.IO
- configures Helmet, CORS, and JSON parsing
- exposes `/health`
- mounts `/proxy`
- mounts `/api/auth`
- protects dashboard routes under `/api`
- connects to MongoDB
- starts the HTTP server

## Backend Request Flow

Proxy traffic flows through the backend in this order:

```text
Client
  -> /proxy/*
  -> request logger
  -> API key authentication
  -> IP whitelist check
  -> rate limiter
  -> proxy engine
  -> upstream target URL
```

The middleware order matters:

- `logger.js` measures and records request activity.
- `authenticate.js` validates the `x-api-key` header.
- `ipWhitelist.js` blocks requests from IPs not allowed by the key.
- `rateLimiter.js` enforces per-key limits, using Redis when available.
- `proxyEngine.js` forwards valid traffic to the key's configured `targetUrl`.

## Backend Folders

- `backend/routes/auth.js`: admin login and current-user routes
- `backend/routes/dashboard.js`: API key, analytics, logs, and export routes
- `backend/models/ApiKey.js`: API key metadata, hashed key secret, rate limit, whitelist, usage, target URL, and active state
- `backend/models/RequestLog.js`: method, path, status, latency, IP, block status, and timestamp
- `backend/lib/redis.js`: Redis connection, key metadata cache, and rate-limit support
- `backend/middleware/adminAuth.js`: admin credential auth and bearer token verification
- `backend/middleware/authenticate.js`: gateway API key authentication
- `backend/middleware/ipWhitelist.js`: request IP allow-list checks
- `backend/middleware/logger.js`: request persistence and Socket.IO log events
- `backend/middleware/proxyEngine.js`: upstream proxy forwarding
- `backend/middleware/rateLimiter.js`: fixed-window request limiting

## Frontend Architecture

The frontend entry point is `frontend/src/main.jsx`, and routing is defined in `frontend/src/App.jsx`.

Routes:

- `/login`: public admin login page
- `/dashboard`: protected analytics overview
- `/logs`: protected live/request log view
- `/keys`: protected API key management
- `/settings`: protected profile, theme, and gateway settings page
- `/`: redirects to `/dashboard`

## Frontend Folders

- `frontend/src/context/AuthContext.jsx`: login state, local storage session, admin auth API calls
- `frontend/src/context/GatewayProvider.jsx`: Socket.IO connection, live logs, alerts, and connection state
- `frontend/src/context/ThemeContext.jsx`: dark/light mode state
- `frontend/src/components/MainLayout.jsx`: authenticated shell, navigation, export buttons, theme toggle, logout
- `frontend/src/components/ProtectedRoute.jsx`: protects private routes
- `frontend/src/components/ApiKeyManager.jsx`: creates, lists, toggles, and updates API keys
- `frontend/src/components/AnalyticsChart.jsx`: renders analytics using Chart.js
- `frontend/src/components/LiveLogViewer.jsx`: displays request logs and live updates
- `frontend/src/components/LogFilter.jsx`: log filtering controls
- `frontend/src/components/ExportButtons.jsx`: downloads CSV and PDF reports
- `frontend/src/lib/api.js`: shared Axios client
- `frontend/src/hooks/useGatewaySocket.js`: Socket.IO hook

## Environment Setup

Create `backend/.env` from `backend/.env.example` and set real values:

```env
NODE_ENV=production
PORT=4000

MONGO_URI=mongodb+srv://user:password@cluster.example.mongodb.net/gateway
REDIS_HOST=localhost
REDIS_PORT=6379

CORS_ORIGIN=https://your-dashboard.example.com,http://localhost:5174
PROXY_TIMEOUT_MS=5000

ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-long-random-password
ADMIN_EMAIL=admin@example.com
ADMIN_SESSION_SECRET=change-this-to-a-long-random-secret
ADMIN_SESSION_TTL_MS=86400000
```

Backend variables:

- `NODE_ENV`: runtime environment
- `PORT`: backend port, default `4000`
- `MONGO_URI`: required MongoDB connection string
- `REDIS_HOST`: Redis host for caching and rate limiting
- `REDIS_PORT`: Redis port
- `CORS_ORIGIN`: comma-separated allowed dashboard origins
- `PROXY_TIMEOUT_MS`: upstream proxy timeout
- `ADMIN_USERNAME`: dashboard login username
- `ADMIN_PASSWORD`: dashboard login password
- `ADMIN_EMAIL`: admin profile email shown by `/api/auth/me`
- `ADMIN_SESSION_SECRET`: secret used for admin session tokens
- `ADMIN_SESSION_TTL_MS`: admin token lifetime in milliseconds

For the frontend, create `frontend/.env` from `frontend/.env.example` when the API is not served from the same origin:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_GATEWAY_SERVER_URL=http://localhost:4000
```

Frontend variables:

- `VITE_API_BASE_URL`: base URL for REST API calls
- `VITE_GATEWAY_SERVER_URL`: Socket.IO/gateway server URL

## Local Setup

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

In development, Vite proxies `/api` and `/proxy` to `http://localhost:4000`.

## API Documentation

### Health

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Backend health check |

### Admin Auth

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | No | Login with configured admin credentials |
| `GET` | `/api/auth/me` | Admin bearer token | Return current admin profile |

Login body:

```json
{
  "username": "admin",
  "password": "change-this-long-random-password"
}
```

Authenticated dashboard requests use:

```http
Authorization: Bearer <admin-token>
```

### Dashboard API

All dashboard routes below require an admin bearer token.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/keys` | Create a new API key |
| `GET` | `/api/keys` | List API keys |
| `PATCH` | `/api/keys/:id/whitelist` | Replace an API key's IP whitelist |
| `PATCH` | `/api/keys/:id/toggle` | Enable or disable an API key |
| `GET` | `/api/analytics` | Return 24-hour analytics grouped by hour |
| `GET` | `/api/logs` | Return recent request logs |
| `GET` | `/api/export/csv` | Download logs as CSV |
| `GET` | `/api/export/pdf` | Download a PDF gateway report |

Create key body:

```json
{
  "name": "Payments API",
  "targetUrl": "https://jsonplaceholder.typicode.com",
  "rateLimit": 100,
  "usageLimit": 10000,
  "ipWhitelist": []
}
```

Update whitelist body:

```json
{
  "ips": ["127.0.0.1"]
}
```

Toggle key body:

```json
{
  "isActive": false
}
```

### Gateway Proxy

Gateway clients call proxied upstream routes through:

```text
http://localhost:4000/proxy/<path>
```

Required header:

```http
x-api-key: <real-api-key>
```

Example:

```bash
curl.exe -H "x-api-key: YOUR_REAL_KEY" http://localhost:4000/proxy/posts/1
```

The key's `targetUrl` determines where the proxied request is forwarded.

## Data Models

### ApiKey

- `name`
- `keyHash`
- `prefix`
- `targetUrl`
- `rateLimit`
- `isActive`
- `ipWhitelist`
- `usageCount`
- `usageLimit`
- `createdAt`

The raw API key is returned only once when it is created. The database stores a bcrypt hash and a prefix for lookup.

### RequestLog

- `apiKeyId`
- `method`
- `path`
- `statusCode`
- `latencyMs`
- `ip`
- `blocked`
- `blockReason`
- `timestamp`

## Live Updates

The backend Socket.IO server authenticates clients with the admin token. The frontend uses the connection for:

- `request_log` events
- `threshold_alert` events
- connection status display
- live log updates
- alert banners

## Scripts

Backend:

```bash
npm run dev
npm start
npm test
```

- `npm run dev`: start backend with Nodemon
- `npm start`: start backend with Node
- `npm test`: run syntax checks over backend source files

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

- `npm run dev`: start Vite development server
- `npm run build`: create production build
- `npm run lint`: run ESLint
- `npm run preview`: preview the production build

## Security Notes

- Keep `.env` files out of Git.
- Commit only `.env.example` files.
- Use strong, unique values for `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
- In production, set `NODE_ENV=production` and restrict `CORS_ORIGIN` to exact trusted origins.
- MongoDB is required for backend startup.
- Redis improves cache and rate-limit behavior; local fallback behavior exists when Redis is unavailable.
- API keys are hashed at rest, so the raw key cannot be recovered after creation.
- Rotate any MongoDB credential that was previously present in local configuration before deployment.

## Typical Usage Flow

Dashboard flow:

1. Start MongoDB and optionally Redis.
2. Start `backend/`.
3. Start `frontend/`.
4. Log in with the configured admin credentials.
5. Create an API key with a target upstream URL.
6. View analytics, logs, exports, and settings from the dashboard.

Gateway flow:

1. A client sends a request to `/proxy/<path>`.
2. The client includes `x-api-key`.
3. The backend validates the key, whitelist, and rate limit.
4. The backend forwards the request to the configured upstream target.
5. Request activity appears in logs, analytics, and live Socket.IO updates.

## Production Checklist

- Set real production environment variables.
- Use HTTPS.
- Use a managed or properly secured MongoDB deployment.
- Run Redis for shared rate limiting and cache behavior.
- Restrict CORS to trusted dashboard origins.
- Store secrets in a secret manager or deployment platform environment.
- Add automated tests around auth, key creation, proxy behavior, logging, exports, and rate limiting.
- Review API key rotation and revocation workflows before onboarding real clients.
