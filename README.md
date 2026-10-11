# Small Ecommerce — Assignment 14 (MERN)

A small product catalogue with secure JWT authentication. Users can register, log in, and create, edit and delete products. The session uses short-lived **access tokens** held in memory and **rotating refresh tokens** stored in an HttpOnly cookie and tracked server-side.

## Features

- Register / login / logout / "who am I" with field-level validation (`express-validator`)
- Passwords hashed with bcrypt (12 salt rounds); duplicate emails return **409**
- Access token (15 min) sent as `Authorization: Bearer …`, stored only in Redux memory
- Refresh token (7 days) in an `HttpOnly; Secure; SameSite=Strict; Path=/api/auth` cookie, never readable by JavaScript
- Refresh-token rotation with **replay detection** (reusing an old token revokes all of the user's sessions)
- Safe handling of **simultaneous refreshes from multiple tabs** (see [Session design](#session-design))
- Login rate limiting backed by MongoDB (works across serverless instances)
- Trusted-origin check on auth routes (CSRF defence) and CORS allow-list
- Product CRUD with pagination, ID validation, 400/401/404 handling and a consistent error shape
- React UI with loading, empty and error states; session restored on page reload

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite 8, Redux Toolkit, React Router 8, Tailwind CSS 4 |
| Backend | Node.js 24, Express 5, Mongoose 9, jsonwebtoken, bcryptjs, express-validator, express-rate-limit |
| Database | MongoDB (local for development, MongoDB Atlas in production) |
| Tests | `node:test` (backend, against a real MongoDB), Vitest (frontend) |
| Hosting | Vercel — one project serving the frontend and the API on the same domain |

## Folder structure

```
.
├── api/
│   └── index.js            # Vercel serverless entry → wraps the Express app
├── backend/
│   ├── app.js              # Express app (middleware + routes), no listen()
│   ├── server.js           # Local dev server (connects DB, calls listen)
│   ├── config/             # db.js (cached connection), env.js (env checks, allowed origins)
│   ├── controllers/        # auth + product request handlers
│   ├── middlewares/        # auth (Bearer), error, security (rate limit, origin), validation
│   ├── models/             # User, Session, Product, LoginAttempt
│   ├── routes/             # /api/auth, /api/products
│   ├── services/           # auth.service.js (register, login, rotate, logout)
│   ├── utils/              # tokens, refresh cookie, http errors, rate-limit store
│   ├── validators/         # express-validator rule sets
│   └── tests/              # node:test integration + unit tests
├── frontend/
│   ├── src/
│   │   ├── api/            # fetch client (auto refresh), auth + product API functions
│   │   ├── store/          # Redux Toolkit store, auth slice, thunks
│   │   ├── components/     # Layout, route guards, forms, UI pieces
│   │   ├── pages/          # Products, product detail, create/edit, login, register, account
│   │   └── utils/          # client-side validation, formatting
│   └── vite.config.js      # dev proxy: /api → backend
├── package.json            # root helper scripts + "type": "module" for /api
└── vercel.json             # build, output and rewrites for Vercel
```

## Prerequisites

- Node.js 24.x and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string

## Local setup

```bash
# 1. Install dependencies for both apps
npm run install:all

# 2. Create env files from the examples and fill in real values
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # optional, defaults work

# 3. Start the API (http://localhost:5000)
npm run dev:backend

# 4. In another terminal start the frontend (http://localhost:5173)
npm run dev:frontend
```

In development Vite proxies `/api/*` to the backend, so the browser sees one origin, just like in production.

## Environment variables

### Backend (`backend/.env`, or Vercel → Project Settings → Environment Variables)

| Name | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string. Must be an Atlas (or other reachable) URI in production. |
| `dbName` | recommended | Database name, e.g. `small_ecommerce`. |
| `ACCESS_TOKEN_SECRET` | yes | Long random string for signing access tokens. |
| `REFRESH_TOKEN_SECRET` | yes | Different long random string for refresh tokens (startup fails if equal). |
| `NODE_ENV` | yes in prod | `production` makes the refresh cookie `Secure`. |
| `CLIENT_URL` | optional | Comma-separated extra origins allowed by CORS and the origin check. Same-origin requests are always allowed. Dev default `http://localhost:5173`. |
| `COOKIE_SAME_SITE` | optional | `strict` (default), `lax` or `none`. Keep `strict` for the same-domain Vercel setup. |
| `LOGIN_RATE_LIMIT_MAX` | optional | Failed logins allowed per IP per 15 minutes (default 10). |
| `TRUST_PROXY` | optional | Number of proxy hops. Automatically `1` on Vercel. |
| `PORT` | optional | Local dev port (default 5000). Not used on Vercel. |

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Name | Description |
| --- | --- |
| `VITE_API_URL` | Leave **empty** for same-origin (`/api`). Only set it if the API lives on another domain. |
| `VITE_DEV_API_PROXY` | Dev only: where Vite proxies `/api` (default `http://localhost:5000`). |

Real `.env` files are git-ignored; only the placeholder `.env.example` files are committed.

## Scripts

| Command (from repo root) | What it does |
| --- | --- |
| `npm run install:all` | `npm ci` in backend and frontend |
| `npm run dev:backend` | API with nodemon on port 5000 |
| `npm run dev:frontend` | Vite dev server on port 5173 |
| `npm test` | Backend tests, then frontend tests |
| `npm run lint` | ESLint for the frontend |
| `npm run build` | Production build of the frontend into `frontend/dist` |

Production backend locally: `npm start --prefix backend`.

## API

All responses look like `{ success, message?, data?, errors? }`. Validation errors return **400** with `errors: [{ field, message }]`.

### Auth — `/api/auth`

| Method | Path | Auth | Body | Success |
| --- | --- | --- | --- | --- |
| POST | `/register` | – | `name, email, password, confirmPassword` | 201 `{ user }` |
| POST | `/login` | – (rate limited) | `email, password` | 200 `{ user, accessToken }` + refresh cookie |
| POST | `/refresh-token` | refresh cookie | – | 200 `{ accessToken }` + rotated cookie |
| POST | `/logout` | Bearer | – | 200, session revoked, cookie cleared |
| GET | `/me` | Bearer | – | 200 `{ user }` |

Errors: 401 invalid credentials / token, 403 untrusted origin or refresh-token reuse, 409 duplicate email (register) or a concurrent refresh (refresh-token, client retries), 429 too many failed logins.

Password rules: 8–128 characters with an uppercase letter, a lowercase letter and a number.

### Products — `/api/products`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | – | `?page=1&limit=12` (limit 1–50), newest first, returns `pagination` |
| GET | `/:id` | – | 400 malformed id, 404 not found |
| POST | `/` | Bearer | `name, description, price, stock, category` (all required) |
| PUT | `/:id` | Bearer | Any subset of the fields above; unknown fields are rejected |
| DELETE | `/:id` | Bearer | 404 if it does not exist |

`GET /api/health` returns `{ success: true }`.

## Session design

1. **Login** returns an access token (15 min) in JSON and sets the refresh token (7 days) as an HttpOnly cookie. Only a SHA-256 hash of the refresh token is stored in the `sessions` collection.
2. The frontend keeps the access token in Redux (memory only, never `localStorage`). On page load it calls `/refresh-token`; the browser sends the cookie automatically.
3. **Rotation:** every refresh atomically revokes the current session and creates a new one.
4. **Replay detection:** presenting a token that was already rotated revokes *all* of that user's sessions (403).
5. **Multiple tabs:** if two tabs refresh with the same cookie at the same moment, one wins. The other receives **409 with no tokens and no cookie change** if the token was rotated less than 15 seconds ago. Cookies are shared between tabs, so the client waits briefly and retries with the new cookie. Outside that window, or for tokens revoked by logout, normal replay detection applies. This means a stolen old token never yields new credentials.
6. **Logout** revokes the session and clears the cookie.

## Testing

```bash
npm test                       # everything
npm test --prefix backend      # backend only (needs MongoDB from backend/.env)
npm test --prefix frontend     # frontend only
```

Backend tests run against `<dbName>_<suite>_test` databases. They refuse to drop any database whose name does not end in `_test`.

## Deploying to Vercel (single project)

The frontend and the API are served from **one Vercel project on one domain**. The refresh cookie is first-party and can stay `SameSite=Strict`, and CORS is not needed in production.

`vercel.json` already contains:

- **Install:** `npm ci --prefix frontend && npm ci --prefix backend`
- **Build:** `npm run build --prefix frontend`
- **Output:** `frontend/dist`
- **Rewrites:** `/api/*` → `api/index.js` (Express); every other path → `index.html` so deep links and refreshes work. Static files are served first.

Steps:

1. Create a MongoDB Atlas cluster and a database user. Under *Network Access*, allow `0.0.0.0/0`, because Vercel functions have no fixed IPs. Copy the `mongodb+srv://…` URI.
2. Vercel → **Add New → Project** → import `NakulTalwar10/assignment-14-cohort-3`.
3. Settings: **Root Directory** `./` (repo root), **Framework Preset** `Other`. Leave Build/Output/Install empty; `vercel.json` sets them.
4. Add the environment variables for Production (and Preview if you use previews): `MONGO_URI`, `dbName`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `NODE_ENV=production`, `COOKIE_SAME_SITE=strict`. Optional: `CLIENT_URL=https://<your-domain>` and `LOGIN_RATE_LIMIT_MAX`.
5. Deploy, then check `https://<your-domain>/api/health` and run through register → login → reload page → product CRUD → logout.

### Production cookie / CORS notes

- Frontend and API share an origin, so the browser treats the refresh cookie as first-party: `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`.
- `requireTrustedOrigin` accepts same-origin requests automatically, so preview URLs work too. It rejects any other origin not listed in `CLIENT_URL`.
- If you ever split the frontend and API onto different domains, you would need `COOKIE_SAME_SITE=none` (forces `Secure`), `CLIENT_URL=<frontend origin>`, `VITE_API_URL=<api origin>`, and credentialed CORS. Third-party cookies are increasingly blocked by browsers, which is why the single-domain setup is used.

## Live URLs

Not deployed yet. They will be added here once the deployment is verified.
