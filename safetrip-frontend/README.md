# SafeTrip Frontend

React frontend for SafeTrip, built to work with the Django backend.

## Setup

```bash
cd safetrip-frontend
npm install
```

## Environment

Copy `.env` and set:

- `REACT_APP_API_BASE_URL` – Django API base URL (default: `http://localhost:8000`)
- `REACT_APP_GOOGLE_MAPS_API_KEY` – Optional, for map features

## Run

```bash
npm start
```

Runs the app at [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Project structure

- `src/api/` – Axios config, endpoints, alert/auth services
- `src/components/` – Reusable (common, alerts, routing)
- `src/pages/` – Home, SOS, Dashboard, Safety Tips, Login, NotFound
- `src/hooks/` – useGeolocation, useAlerts
- `src/utils/` – validation, formatters, constants
- `src/styles/` – global and variables CSS

## Backend

Ensure the Django API is running (e.g. `http://localhost:8000`) with:

- `GET/POST /api/alerts/`
- `GET/PATCH/DELETE /api/alerts/:id/`

See the main SafeTrip README for backend setup.
