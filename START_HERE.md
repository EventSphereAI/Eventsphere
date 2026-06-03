# 🚀 EventSphere - START HERE

**You now have a COMPLETE, working codebase.** Everything below will get you running in 15 minutes.

## ✅ What's Been Created

I've created **28 complete, working files** organized in a monorepo:

### Backend (FastAPI - Python)
- ✅ `apps/api/main.py` - Server entry point
- ✅ `apps/api/requirements.txt` - Dependencies
- ✅ `apps/api/app/database/connection.py` - Multi-tenant DB connection
- ✅ `apps/api/app/auth/jwt.py` - JWT tokens & password hashing
- ✅ `apps/api/app/middleware/tenant.py` - Tenant resolution
- ✅ `apps/api/app/routes/auth.py` - Login/signup/refresh
- ✅ `apps/api/app/routes/events.py` - Event management
- ✅ `apps/api/app/routes/delegates.py` - Participant registration
- ✅ `apps/api/app/routes/scanning.py` - QR scanning (duplicate prevention)
- ✅ `apps/api/app/routes/food.py` - Food distribution tracking
- ✅ `apps/api/app/routes/accommodation.py` - Room management
- ✅ `apps/api/app/routes/tenants.py` - Org management
- ✅ `apps/api/app/routes/reports.py` - Analytics & reports

### Frontend (Next.js - React)
- ✅ `apps/web/package.json` - Dependencies
- ✅ `apps/web/next.config.js` - Next.js config
- ✅ `apps/web/tailwind.config.js` - Tailwind CSS
- ✅ `apps/web/src/app/layout.js` - Root layout
- ✅ `apps/web/src/app/page.js` - Home (redirects to login)
- ✅ `apps/web/src/app/login/page.js` - Login form
- ✅ `apps/web/src/app/signup/page.js` - Organization signup
- ✅ `apps/web/src/app/dashboard/page.js` - Main dashboard
- ✅ `apps/web/src/context/AuthContext.jsx` - Auth state management
- ✅ `apps/web/src/utils/api.js` - HTTP client with auth

### Configuration & Docs
- ✅ `infra/scripts/001_schema.sql` - Complete database schema
- ✅ `README.md` - Full documentation
- ✅ `.gitignore` - What to exclude from Git

## 📋 Step-by-Step Setup (15 minutes)

### Step 1: Get Your Database Ready (3 min)

```bash
# Go to supabase.com
# Sign up (free)
# Create a new project
# Go to Settings → Database
# Copy the "Connection string (URI)" - looks like:
# postgresql://postgres:[PASSWORD]@[HOST]/postgres

# Save this somewhere safe!
```

### Step 2: Start Backend (5 min)

```bash
cd eventsphere/apps/api

# Create Python virtual environment
python -m venv venv

# Activate it
source venv/bin/activate
# On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env - add your DATABASE_URL
# (use your favorite editor: nano, vim, VS Code, etc)
nano .env

# Start the server
uvicorn main:app --reload
```

**You should see:**
```
✓ Database connected
✓ Application started
Uvicorn running on http://127.0.0.1:8000
```

### Step 3: Start Frontend (5 min)

**Open a NEW terminal** and run:

```bash
cd eventsphere/apps/web

# Install dependencies
npm install

# Create .env.local
cp .env.local.example .env.local

# Run dev server
npm run dev
```

**You should see:**
```
Ready in 1.2s
Local: http://localhost:3000
```

### Step 4: Test It! (2 min)

1. Open **http://localhost:3000** in your browser
2. Click **"Sign up"**
3. Fill in:
   - **Slug**: `test-university`
   - **Name**: `Test University`
   - **Your Name**: `Admin User`
   - **Email**: `admin@test.edu`
   - **Password**: `password123`
4. Click **"Create Organization"**
5. You're logged in to your dashboard! 🎉

## 🔧 What's Running?

| Service | URL | What It Does |
|---------|-----|--------------|
| **Backend API** | http://localhost:8000 | Your server (Python/FastAPI) |
| **Frontend** | http://localhost:3000 | Your app (React/Next.js) |
| **Database** | Supabase (cloud) | Your data (PostgreSQL) |
| **API Docs** | http://localhost:8000/docs | Interactive API explorer |

## 📖 Next Steps (After Getting It Running)

### Understand What You Have
1. Read `README.md` for full documentation
2. Check API docs at http://localhost:8000/docs
3. Explore the code - it's heavily commented

### Extend It
- Create events in the dashboard
- Register delegates
- Generate QR codes
- Test QR scanning
- View attendance reports

### Deploy (When Ready)
1. **Backend** → [railway.app](https://railway.app) (free tier available)
2. **Frontend** → [vercel.com](https://vercel.com) (free, instant deploy)
3. **Database** → Already on Supabase (just use same connection string)

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: fastapi` | `pip install -r requirements.txt` |
| Backend won't connect to database | Check DATABASE_URL in .env (copy from Supabase exactly) |
| Frontend won't connect to backend | Make sure backend is running on :8000, check NEXT_PUBLIC_API_URL |
| Ports already in use | Kill the process: `lsof -i :8000` (backend) or `:3000` (frontend) |
| `npm ERR! node_modules already exists` | Delete `node_modules` and `package-lock.json`, try again |

## 💡 Key Things to Know

### Multi-Tenancy
Every organization (university, hackathon, etc) is a "tenant". They all use the same servers but their data is completely isolated. This is controlled by `tenant_id` in the database.

### JWT Tokens
When you log in:
1. You get `access_token` (good for 15 min) + `refresh_token` (good for 7 days)
2. Browser stores them in `localStorage`
3. Every API call includes the token
4. Server verifies the token and scopes data to your tenant

### QR Codes
- Each delegate gets a unique, signed QR code
- Scanning validates the signature (prevents tampering)
- Duplicate scans are blocked (can't claim same meal twice)
- All scans are logged with timestamp

## 📁 Project Structure

```
eventsphere/
├── README.md                    ← Full documentation
├── .gitignore                   ← Git exclusions
├── apps/
│   ├── api/                     ← Python/FastAPI backend
│   │   ├── main.py              ← Server entry point
│   │   ├── requirements.txt      ← Dependencies
│   │   ├── .env.example         ← Config template
│   │   └── app/
│   │       ├── auth/            ← JWT & passwords
│   │       ├── database/        ← DB connection & tenant context
│   │       ├── middleware/      ← Tenant resolver
│   │       └── routes/          ← All API endpoints
│   └── web/                     ← React/Next.js frontend
│       ├── package.json         ← Dependencies
│       ├── .env.local.example   ← Config template
│       └── src/
│           ├── app/             ← Pages (login, signup, dashboard)
│           ├── context/         ← Auth state (useAuth hook)
│           └── utils/           ← API client
└── infra/
    └── scripts/
        └── 001_schema.sql       ← Database schema
```

## 🎯 Your Next 30 Minutes

1. **Follow the setup above** (15 min) - Get it running
2. **Test the flow** (5 min) - Signup, login, see dashboard
3. **Read the docs** (10 min) - Understand what you have
4. **Ask questions** - The code is yours, explore it!

## ✨ You're Ready!

You now have:
- ✅ A complete SaaS platform
- ✅ Multi-tenant architecture
- ✅ JWT authentication
- ✅ QR scanning with duplicate prevention
- ✅ Event & delegate management
- ✅ Food & accommodation tracking
- ✅ Reports & analytics endpoints

**Go build something amazing! 🚀**

---

Questions? Everything is documented in `README.md`.

Your EventSphere team 💜
