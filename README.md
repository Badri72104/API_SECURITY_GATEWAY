# API Security Gateway

A full-stack API gateway and dashboard for managing API keys, proxying upstream requests, viewing live logs, tracking analytics, exporting reports, and monitoring gateway activity.

## Features

- API key creation and management
- Authenticated proxy routing through `/proxy/*`
- Request logging and analytics
- IP whitelist checks
- Rate limiting support
- CSV and PDF export
- Live dashboard updates with Socket.IO
- Dark and light mode UI

## Tech Stack

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- Redis with ioredis
- Socket.IO
- http-proxy-middleware

### Frontend

- React
- Vite
- Tailwind CSS
- Chart.js
- Axios
- React Router

## Project Structure

```text
secure-api-gateway/
├─ backend/
├─ frontend/
├─ PROJECT_STRUCTURE.md
└─ README.md
```

For a detailed breakdown of every major backend and frontend file, see:

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Badri72104/API_SECURITY_GATEWAY.git
cd API_SECURITY_GATEWAY
```

### 2. Configure the backend environment

Create:

```text
backend/.env
```

Expected variables:

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
REDIS_HOST=localhost
REDIS_PORT=6379
PROXY_TIMEOUT_MS=5000
NODE_ENV=development
```

Notes:

- MongoDB is required for backend startup
- Redis is recommended, but the app includes fallback behavior if Redis is unavailable

### 3. Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

## Running the Project

### Start the backend

```bash
cd backend
node app.js
```

Expected output:

```text
[db] MongoDB connected
[server] Running on http://localhost:4000
```

### Start the frontend

```bash
cd frontend
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/health`

## How It Works

### Dashboard flow

1. Sign in through the dashboard UI
2. Create an API key
3. Send requests through the gateway using that key
4. Watch logs and analytics update in the dashboard

### Gateway flow

The gateway request path is:

```text
Client -> /proxy/* -> authenticate -> whitelist -> rate limit -> proxy upstream
```

Example:

```bash
curl.exe -H "x-api-key: YOUR_REAL_KEY" http://localhost:4000/proxy/posts/1
```

## Main Dashboard Pages

- Login
- Dashboard
- Logs
- API Keys
- Settings

## Available Backend API Routes

- `GET /health`
- `POST /api/keys`
- `GET /api/keys`
- `PATCH /api/keys/:id/whitelist`
- `PATCH /api/keys/:id/toggle`
- `GET /api/analytics`
- `GET /api/export/csv`
- `GET /api/export/pdf`

## Development Scripts

### Backend

```bash
npm run dev
npm start
npm test
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Notes

- Authentication is currently mocked in the frontend
- MongoDB Atlas works for local development and deployment
- Redis improves caching and rate limiting behavior, but is not strictly required for local testing
- Sensitive files like `.env` and generated folders like `node_modules` and `dist` are ignored in Git

## Recommended Next Steps

- add production environment-based API URLs for deployment
- deploy backend to Render or Railway
- deploy frontend to Vercel or Netlify
- replace mocked login with real authentication

