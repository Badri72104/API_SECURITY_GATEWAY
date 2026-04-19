# API Security Gateway

A full-stack API gateway and dashboard for managing API keys, proxying upstream requests, viewing live logs, tracking analytics, exporting reports, and monitoring gateway activity.

## Features

- API key creation and management
- Authenticated proxy routing through `/proxy/*`
- Dashboard login backed by server-side admin credentials
- Request logging and analytics
- IP whitelist checks
- Redis-backed rate limiting with MongoDB fallback for key lookup
- CSV and PDF export
- Live dashboard updates with authenticated Socket.IO
- Dark and light mode UI

## Tech Stack

- Backend: Node.js, Express, MongoDB with Mongoose, Redis with ioredis, Socket.IO
- Frontend: React, Vite, Tailwind CSS, Chart.js, Axios, React Router

## Environment

Create `backend/.env` from `backend/.env.example` and set real values:

```env
NODE_ENV=production
PORT=4000
MONGO_URI=your_mongodb_connection_string
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=https://your-dashboard.example.com
PROXY_TIMEOUT_MS=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=use-a-long-random-password
ADMIN_EMAIL=admin@example.com
ADMIN_SESSION_SECRET=use-a-long-random-secret
ADMIN_SESSION_TTL_MS=86400000
```

For the frontend, create `frontend/.env` from `frontend/.env.example` when the API is not served from the same origin:

```env
VITE_API_BASE_URL=https://your-api.example.com
VITE_GATEWAY_SERVER_URL=https://your-api.example.com
```

## Local Setup

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/health`

## Gateway Flow

```text
Client -> /proxy/* -> authenticate -> whitelist -> rate limit -> proxy upstream
```

Example:

```bash
curl.exe -H "x-api-key: YOUR_REAL_KEY" http://localhost:4000/proxy/posts/1
```

## Backend Routes

- `GET /health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/keys`
- `GET /api/keys`
- `PATCH /api/keys/:id/whitelist`
- `PATCH /api/keys/:id/toggle`
- `GET /api/analytics`
- `GET /api/export/csv`
- `GET /api/export/pdf`

All `/api/*` dashboard routes except `/api/auth/login` require a bearer token returned by login.

## Scripts

Backend:

```bash
npm run dev
npm start
npm test
```

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Production Notes

- Set `NODE_ENV=production` and `CORS_ORIGIN` to the exact dashboard origin.
- Use strong, unique values for `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
- Keep `.env` files out of Git; only `.env.example` files should be committed.
- Rotate the MongoDB credential that was previously present in local configuration before deployment.
