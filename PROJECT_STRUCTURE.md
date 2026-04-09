# Secure API Gateway Project Structure

## Overview

This project is split into two main applications:

- `backend/` - Express-based API gateway server, dashboard API, MongoDB models, Redis helpers, and Socket.IO event source
- `frontend/` - React + Vite dashboard UI for login, analytics, logs, API key management, exports, and settings

At a high level:

1. The frontend runs on Vite during development, usually on `http://localhost:5173`.
2. The backend runs on Express, usually on `http://localhost:4000`.
3. The frontend talks to the backend through `/api/...` routes and a Socket.IO connection.
4. Proxied client traffic goes through `/proxy/...` on the backend.
5. MongoDB stores API keys and request logs.
6. Redis is used for caching and rate limiting when available, but the app now has fallback behavior if Redis is unavailable.

---

## Root Folder Layout

```text
secure-api-gateway/
├─ backend/
├─ frontend/
└─ PROJECT_STRUCTURE.md
```

### Root responsibilities

- `backend/` contains all server-side logic
- `frontend/` contains the dashboard UI
- `package-lock.json` at the root is not the main app entry point

---

## Backend Structure

Backend path:

[`backend`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend)

### Main backend files

```text
backend/
├─ .env
├─ app.js
├─ package.json
├─ lib/
│  └─ redis.js
├─ middleware/
│  ├─ authenticate.js
│  ├─ ipWhitelist.js
│  ├─ logger.js
│  ├─ proxyEngine.js
│  └─ rateLimiter.js
├─ models/
│  ├─ ApiKey.js
│  └─ RequestLog.js
└─ routes/
   └─ dashboard.js
```

### Backend entry point

[`backend/app.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/app.js)

Responsibilities:

- loads environment variables
- creates the Express app
- creates the HTTP server
- attaches Socket.IO
- enables global middleware like `helmet`, `cors`, and JSON parsing
- registers `/health`
- registers `/proxy`
- registers `/api`
- connects to MongoDB
- starts the server

### Backend request flow

The proxy request flow is:

```text
Client request
  -> /proxy/*
  -> logger middleware
  -> authenticate middleware
  -> IP whitelist middleware
  -> rate limiter middleware
  -> proxy engine
  -> upstream API
```

This order matters:

- `logger.js` records and emits request activity
- `authenticate.js` validates the API key
- `ipWhitelist.js` checks allowed IPs
- `rateLimiter.js` enforces per-key limits
- `proxyEngine.js` forwards the request to the configured upstream target

### Backend routes

[`backend/routes/dashboard.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/routes/dashboard.js)

This file provides dashboard-facing API routes:

- `POST /api/keys` - create a new API key
- `GET /api/keys` - list keys
- `PATCH /api/keys/:id/whitelist` - update IP whitelist
- `PATCH /api/keys/:id/toggle` - enable or disable a key
- `GET /api/analytics` - get dashboard analytics
- `GET /api/export/csv` - export logs as CSV
- `GET /api/export/pdf` - export logs as PDF

### Backend models

[`backend/models/ApiKey.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/models/ApiKey.js)

- stores API key metadata
- stores hashed key secrets with bcrypt
- keeps rate limit, whitelist, usage, and target URL data

[`backend/models/RequestLog.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/models/RequestLog.js)

- stores request history used for analytics and export

### Backend middleware

[`backend/middleware/authenticate.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/middleware/authenticate.js)

- reads `x-api-key`
- checks Redis cache first
- falls back to MongoDB if needed
- validates key hash with bcrypt
- blocks disabled keys

[`backend/middleware/ipWhitelist.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/middleware/ipWhitelist.js)

- checks caller IP against the key's whitelist

[`backend/middleware/rateLimiter.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/middleware/rateLimiter.js)

- applies fixed-window rate limits
- sets rate-limit headers
- falls back gracefully if Redis is unavailable

[`backend/middleware/logger.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/middleware/logger.js)

- logs request metadata
- persists log data
- emits live log events over Socket.IO

[`backend/middleware/proxyEngine.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/middleware/proxyEngine.js)

- forwards authenticated requests to the configured `targetUrl`

### Backend support library

[`backend/lib/redis.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/lib/redis.js)

Responsibilities:

- connects to Redis when available
- caches API key metadata
- supports rate limiting counters
- falls back safely if Redis is not running

### Backend environment variables

Stored in:

[`backend/.env`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/.env)

Expected variables:

- `PORT`
- `MONGO_URI`
- `REDIS_HOST`
- `REDIS_PORT`
- `PROXY_TIMEOUT_MS`
- `NODE_ENV`

### Backend scripts

Defined in:

[`backend/package.json`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/package.json)

- `npm run dev` - start backend with nodemon
- `npm start` - start backend with Node
- `npm test` - syntax validation for backend source files

---

## Frontend Structure

Frontend path:

[`frontend`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend)

### Main frontend files

```text
frontend/
├─ index.html
├─ package.json
├─ vite.config.js
└─ src/
   ├─ App.jsx
   ├─ main.jsx
   ├─ index.css
   ├─ components/
   │  ├─ AnalyticsChart.jsx
   │  ├─ ApiKeyManager.jsx
   │  ├─ ExportButtons.jsx
   │  ├─ LiveLogViewer.jsx
   │  ├─ LogFilter.jsx
   │  ├─ MainLayout.jsx
   │  └─ ProtectedRoute.jsx
   ├─ context/
   │  ├─ AuthContext.jsx
   │  ├─ GatewayProvider.jsx
   │  └─ ThemeContext.jsx
   └─ pages/
      ├─ ApiKeysPage.jsx
      ├─ DashboardPage.jsx
      ├─ LoginPage.jsx
      ├─ LogsPage.jsx
      └─ SettingsPage.jsx
```

### Frontend bootstrap

[`frontend/src/main.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/main.jsx)

- mounts the React app into `#root`

[`frontend/src/App.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/App.jsx)

- sets up routing
- wraps the app with providers
- defines public and protected pages

### Frontend providers

[`frontend/src/context/AuthContext.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/context/AuthContext.jsx)

- manages login state
- stores session data in `localStorage`
- currently uses mock login behavior rather than a real auth API

[`frontend/src/context/ThemeContext.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/context/ThemeContext.jsx)

- manages dark/light theme selection
- stores theme in `localStorage`
- applies the `dark` class to the root element

[`frontend/src/context/GatewayProvider.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/context/GatewayProvider.jsx)

- opens the Socket.IO connection
- stores live logs
- stores alerts
- tracks connection state

### Frontend pages

[`frontend/src/pages/LoginPage.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/pages/LoginPage.jsx)

- sign-in screen
- uses mocked local authentication

[`frontend/src/pages/DashboardPage.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/pages/DashboardPage.jsx)

- overview cards
- analytics chart

[`frontend/src/pages/ApiKeysPage.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/pages/ApiKeysPage.jsx)

- wrapper page for API key management UI

[`frontend/src/pages/LogsPage.jsx`](c:/Users/91956\Downloads\secure-api-gateway\secure-api-gateway\frontend\src\pages\LogsPage.jsx)

- wraps filters and live log viewer

[`frontend/src/pages/SettingsPage.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/pages/SettingsPage.jsx)

- displays profile, theme, gateway config, and app info

### Frontend components

[`frontend/src/components/MainLayout.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/components/MainLayout.jsx)

- top-level authenticated layout
- shows nav tabs, connection status, exports, theme toggle, and logout

[`frontend/src/components/ProtectedRoute.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/components/ProtectedRoute.jsx)

- prevents access to private routes unless logged in

[`frontend/src/components/ApiKeyManager.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/components/ApiKeyManager.jsx)

- fetches `/api/keys`
- creates keys with `POST /api/keys`
- toggles key state with `PATCH /api/keys/:id/toggle`

[`frontend/src/components/AnalyticsChart.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/components/AnalyticsChart.jsx)

- fetches `/api/analytics`
- renders bar charts with Chart.js

[`frontend/src/components/LiveLogViewer.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/components/LiveLogViewer.jsx)

- shows live Socket.IO log entries
- filters and displays request history in the UI

[`frontend/src/components/LogFilter.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/components/LogFilter.jsx)

- controls filtering for the log viewer

[`frontend/src/components/ExportButtons.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/components/ExportButtons.jsx)

- downloads CSV and PDF exports from backend API endpoints

### Frontend styling

[`frontend/src/index.css`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/index.css)

- imports Tailwind CSS
- defines class-based dark mode variant

### Frontend scripts

Defined in:

[`frontend/package.json`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/package.json)

- `npm run dev` - start Vite development server
- `npm run build` - production build
- `npm run lint` - lint React source
- `npm run preview` - preview production build

---

## How Frontend and Backend Communicate

### REST API

The frontend uses these HTTP endpoints:

- `/api/keys`
- `/api/analytics`
- `/api/export/csv`
- `/api/export/pdf`

In development, Vite proxies `/api` and `/proxy` to the backend server.

See:

[`frontend/vite.config.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/vite.config.js)

### Socket.IO

The frontend connects to the backend Socket.IO server to receive:

- `request_log`
- `threshold_alert`

This powers:

- live request log updates
- connection status badges
- alert banners

---

## Development Workflow

### Start backend

```powershell
cd C:\Users\91956\Downloads\secure-api-gateway\secure-api-gateway\backend
node app.js
```

### Start frontend

```powershell
cd C:\Users\91956\Downloads\secure-api-gateway\secure-api-gateway\frontend
npm run dev
```

### Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

---

## Typical Usage Flow

### Dashboard usage flow

1. User signs in through the mocked login UI.
2. Frontend stores auth data in local storage.
3. Protected routes become accessible.
4. Dashboard fetches analytics.
5. Logs page listens for live log events.
6. API Keys page creates and manages gateway keys.

### Gateway usage flow

1. User creates an API key in the dashboard.
2. Backend stores the key in MongoDB.
3. Client sends requests to:

```text
http://localhost:4000/proxy/<path>
```

4. Client includes:

```text
x-api-key: <real key>
```

5. Backend validates key and forwards request to the configured upstream API.
6. Request activity appears in live logs and analytics.

---

## Current Design Notes

- Authentication is mocked on the frontend, not production-grade auth
- MongoDB is required for full backend startup
- Redis is optional for local development because fallback behavior exists
- Dark/light mode is class-based through the root `dark` class
- CSV export now handles an empty log list gracefully

---

## Good Starting Files For New Contributors

If someone is new to the codebase, start here:

1. [`backend/app.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/app.js)
2. [`backend/routes/dashboard.js`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/backend/routes/dashboard.js)
3. [`frontend/src/App.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/App.jsx)
4. [`frontend/src/context/GatewayProvider.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/context/GatewayProvider.jsx)
5. [`frontend/src/components/ApiKeyManager.jsx`](c:/Users/91956/Downloads/secure-api-gateway/secure-api-gateway/frontend/src/components/ApiKeyManager.jsx)

