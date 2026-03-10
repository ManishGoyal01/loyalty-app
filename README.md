# Loyalty Streak App

A full-stack loyalty rewards app for small grocery shops. Customers scan a QR code, check in daily, and earn a free reward after 10 consecutive days. Shopkeepers manage everything from an admin dashboard.

## Features

- Customer daily check-in via QR code scan
- 10-day streak tracking with visual progress dots
- Automatic reward unlock on streak completion
- Live countdown timer to next check-in window (IST)
- Admin dashboard: stats, customer list, reward management, QR code for printing
- Phone-number-based login (no passwords, no third-party auth)

## Tech Stack

- **Frontend:** React + Vite, TailwindCSS, React Router
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Railway managed)
- **Auth:** JWT tokens
- **Deploy:** Railway (single service, ~$5/mo)

## Project Structure

```
loyalty-app/
├── railway.json              # Railway deploy config
├── client/                   # React frontend
│   ├── src/
│   │   ├── api/api.js        # All API calls
│   │   ├── components/       # StreakDots, CountdownTimer, RewardClaimScreen, CustomerCard
│   │   ├── pages/            # CustomerPage, AdminLogin, AdminDashboard
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                   # Express backend
│   ├── routes/               # customers.js, admin.js, config.js
│   ├── middleware/            # authMiddleware.js (JWT)
│   ├── prisma/               # schema.prisma, seed.js, migrations
│   ├── db/                   # prisma.js (client instance)
│   ├── helpers/              # dateHelpers.js (IST)
│   ├── server.js             # Entry point — also serves React build in production
│   ├── package.json
│   └── .env
└── README.md
```

## Setup

### 1. PostgreSQL Setup (Local Development)

Install PostgreSQL locally or use Docker:
```bash
# Option A: Docker (recommended)
docker run --name loyalty-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=loyalty_streak -p 5432:5432 -d postgres:16

# Option B: Install PostgreSQL locally and create a database
createdb loyalty_streak
```

### 2. Local Development

**Backend:**
```bash
cd server
npm install
```

Edit `server/.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/loyalty_streak
JWT_SECRET=pick_a_long_random_string_here
ADMIN_PHONES=9876543210,9123456789
PORT=5000
FRONTEND_URL=http://localhost:5173
```

```bash
npx prisma migrate dev --name init    # Creates tables
npx prisma db seed                     # Seeds default config
npm run dev
```

**Frontend:**
```bash
cd client
npm install
```

Edit `client/.env`:
```
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Open http://localhost:5173 — the app is running.

## Deploy to Railway

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/loyalty-app.git
git push -u origin main
```

### Step 2: Create Railway Service

1. Go to [railway.com](https://railway.com) and sign in with GitHub
2. **New Project** → **Deploy from GitHub repo** → select your repo
3. Railway auto-detects `railway.json` and configures build/start commands

### Step 3: Add PostgreSQL

In Railway dashboard → click **+ New** → **Database** → **PostgreSQL**. Railway automatically sets `DATABASE_URL` for your web service.

### Step 4: Add Environment Variables

In Railway dashboard → your service → **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Auto-injected by Railway when you add PostgreSQL (no manual setup) |
| `JWT_SECRET` | A long random secret string |
| `ADMIN_PHONES` | Comma-separated admin phone numbers, e.g. `9876543210,9123456789` |
| `PORT` | `5000` |

### Step 5: Deploy

Railway auto-deploys on push. The build process:
1. Installs server dependencies
2. Runs `prisma generate` and `prisma migrate deploy` (creates tables)
3. Installs client dependencies and builds React app (`vite build`)
4. Copies built files to `server/public/`
5. Express serves both the API and the React frontend

### Step 6: Go Live

1. Railway gives you a URL like `https://loyalty-app-production.up.railway.app`
2. Open `/admin` → log in with your admin phone number
3. Print the QR code from the dashboard
4. Stick it at your shop counter — done!

## Environment Variables Reference

### Backend (server/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Auto-injected by Railway. Local: `postgresql://postgres:password@localhost:5432/loyalty_streak` |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `ADMIN_PHONES` | Yes | Comma-separated admin phone numbers |
| `PORT` | No | Server port (default: 5000) |
| `FRONTEND_URL` | No | Only needed for local dev CORS (http://localhost:5173) |

### Frontend (client/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend URL — only needed for local dev. In production, leave empty (same origin). |

## How It Works

1. **QR Scan** → Customer opens the app on their phone
2. **Register** → Enter 10-digit phone number (one time, saved locally)
3. **Check In** → Tap the button once per day
4. **Streak** → 10 consecutive days = free reward (e.g. 1 milk packet)
5. **Miss a Day** → Streak resets to 0
6. **Claim** → Shopkeeper marks reward as claimed from admin panel or customer's screen
7. **Repeat** → Streak starts over, customer keeps coming back

## Architecture Note

In production, this runs as a **single service** on Railway:
- Express serves the React build from `server/public/`
- API routes are at `/api/*`
- All other routes fall through to React (client-side routing)
- No CORS configuration needed (same origin)
- During local development, Vite dev server runs separately on :5173 and proxies to Express on :5000

## Cost (50 users)

- **Railway Hobby Plan:** $5/mo (includes $5 usage credit)
- **Web Service compute:** ~$1.50/mo
- **PostgreSQL compute:** ~$1.10/mo
- **Total:** ~**$2-3/mo** (covered by the $5 hobby credit)
