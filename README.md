# EventSphere AI — Multi-Tenant Event Management Platform

A complete SaaS solution for event management with QR-based attendance tracking, food distribution, accommodation management, and real-time analytics.

## 🎯 What This Is

EventSphere AI is a **multi-tenant SaaS platform** where:
- One codebase powers unlimited organizations (universities, hackathons, conferences)
- Each organization gets their own isolated workspace
- Real-time QR scanning, attendance tracking, and analytics
- Subscription-based monetization (Free, Pro, Enterprise)

## 📦 What's Included

This repo contains **everything you need** to run the platform:

```
eventsphere/
├── apps/
│   ├── api/          ← FastAPI backend (Python)
│   └── web/          ← Next.js frontend (React)
├── infra/
│   └── scripts/      ← Database schema (PostgreSQL/Supabase)
└── .gitignore
```

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites

Install:
- Python 3.11+ ([python.org](https://python.org))
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Git ([git-scm.com](https://git-scm.com))

### 2. Database Setup

1. Go to **[supabase.com](https://supabase.com)** and create a free account
2. Create a new project
3. Go to **Settings → Database** and copy the "Connection string (URI)"
4. Save it somewhere safe — you'll need it next

### 3. Backend Setup

```bash
cd apps/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your DATABASE_URL from Supabase
nano .env  # or use your editor

# Run the server
uvicorn main:app --reload
```

**Expected output:**
```
Uvicorn running on http://127.0.0.1:8000
Press CTRL+C to quit
```

### 4. Frontend Setup

In a **new terminal**:

```bash
cd apps/web

# Install dependencies
npm install

# Create .env.local
cp .env.local.example .env.local

# Run the development server
npm run dev
```

**Expected output:**
```
Ready in ...
Local: http://localhost:3000
```

### 5. Test It

1. Open http://localhost:3000 in your browser
2. Click "Sign up"
3. Create an organization:
   - Slug: `test-org`
   - Name: `Test Organization`
   - Email: `admin@test.org`
   - Password: `password123`
4. You're logged in! 🎉

## 📚 File Structure Explained

### Backend (`apps/api/`)

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app entry point — sets up server & routes |
| `requirements.txt` | Python dependencies |
| `.env.example` | Template for secrets (DATABASE_URL, JWT_SECRET, etc) |
| `app/database/connection.py` | PostgreSQL connection pool & tenant context |
| `app/auth/jwt.py` | JWT token creation, password hashing |
| `app/middleware/tenant.py` | Multi-tenant resolver (subdomain → tenant_id) |
| `app/routes/*.py` | API endpoints for auth, events, delegates, etc |

### Frontend (`apps/web/`)

| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `next.config.js` | Next.js configuration |
| `tailwind.config.js` | Tailwind CSS theme |
| `.env.local.example` | Template for API URL |
| `src/app/layout.js` | Root layout with AuthProvider |
| `src/app/page.js` | Home page (redirects to login) |
| `src/app/login/page.js` | Login form |
| `src/app/signup/page.js` | Organization signup form |
| `src/app/dashboard/page.js` | Main dashboard (after login) |
| `src/context/AuthContext.jsx` | Global auth state + login/logout |
| `src/utils/api.js` | Axios HTTP client with auth |

## 🧪 API Endpoints

### Public
- `POST /api/health` — Check if API is alive
- `POST /api/auth/register-tenant` — Create new organization
- `POST /api/auth/login` — Login with email/password

### Protected (need JWT token)
- `GET /api/events/` — List all events
- `POST /api/events/` — Create event
- `GET /api/delegates/?event_id=...` — List delegates
- `POST /api/delegates/` — Register delegate
- `POST /api/scan/` — QR scanning
- `GET /api/reports/attendance/{event_id}` — Attendance report

See full API docs at `http://localhost:8000/docs` (Swagger UI)

## 🔑 Key Concepts

### Multi-Tenancy

Every database table has a `tenant_id` column. When a user logs in, their tenant_id is set. All queries are automatically filtered — `ABC University` can never see `XYZ College`'s data.

```sql
-- Example: Get delegates for ABC University only
SELECT * FROM delegates 
WHERE tenant_id = 'abc-university-uuid'
```

### JWT Authentication

1. User logs in with email/password
2. Server returns `access_token` (expires in 15 min) + `refresh_token` (7 days)
3. Frontend stores tokens in `localStorage`
4. All API requests include `Authorization: Bearer <token>`

### QR Codes

Each delegate gets a unique QR code. When scanned:
1. QR is verified (HMAC signature prevents faking)
2. Duplicate scans are blocked (can't claim same meal twice)
3. Scan is logged with timestamp, location, staff member
4. Dashboard updates in real time

## 🚢 Deployment

### Backend → Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app), sign up, connect GitHub repo
3. Railway auto-detects Python
4. Add env variables (DATABASE_URL, JWT_SECRET, etc)
5. Deploy! Get a live API URL

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com), sign up, import repo
2. Set "Root directory" to `apps/web`
3. Add `NEXT_PUBLIC_API_URL` env var (your Railway API URL)
4. Deploy! Get a live app URL

### Database → Supabase

Already set up. Just use the connection string in your Railway app.

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError: fastapi` | Run `pip install -r requirements.txt` |
| `CORS error in console` | Check backend is running on :8000 |
| `Connection refused on DATABASE_URL` | Check .env has correct Supabase URL |
| `Tokens expired` | Delete localStorage, log in again |
| `"Tenant not found"` | Make sure you're in dev mode using subdomain or X-Tenant-Slug header |

## 📖 Next Steps

1. **Create an event** — Use the dashboard to create your first event
2. **Register delegates** — Add participants
3. **Generate QR codes** — Download QR passes
4. **Test QR scanning** — Use the scanner UI
5. **View reports** — Check attendance analytics

## 🛠 Development

### Running Both Servers

```bash
# Terminal 1 - Backend
cd apps/api
source venv/bin/activate
uvicorn main:app --reload

# Terminal 2 - Frontend
cd apps/web
npm run dev

# Terminal 3 - (Optional) Watch database
# Create new Supabase query in web dashboard
```

### Making Changes

- **Backend changes** → Save file, auto-reloads thanks to `--reload`
- **Frontend changes** → Save file, hot-reload in browser
- **Database schema** → Edit `infra/scripts/001_schema.sql`, re-run in Supabase SQL editor

### Testing API

Use curl or [Postman](https://postman.com):

```bash
# Create organization
curl -X POST http://localhost:8000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "org_slug": "test-org",
    "org_name": "Test Org",
    "email": "admin@test.org",
    "password": "password123",
    "name": "Admin User"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: test-org" \
  -d '{
    "email": "admin@test.org",
    "password": "password123"
  }'
```

## 📝 Environment Variables

### Backend (`.env`)

```
DATABASE_URL=postgresql://...  # From Supabase
JWT_SECRET=your-secret-key      # Generate with: python -c "import secrets; print(secrets.token_hex(32))"
QR_HMAC_SECRET=qr-secret        # For signing QR codes
PLATFORM_DOMAIN=eventsphere.app # Your domain
```

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000  # Dev: localhost, Prod: your Railway URL
```

## 📄 License

Copyright © 2026 Raj Konde. All Rights Reserved.

## 🤝 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the code comments
3. Check API docs at `localhost:8000/docs`

---

**You're ready to build! 🚀**

Questions? Check the PDF implementation guide in the outputs folder.
