-- ============================================================
-- EventSphere AI — Database Schema
-- Run this in Supabase SQL Editor (in order)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TENANTS
-- ============================================================
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            TEXT UNIQUE NOT NULL,           -- e.g. "abc-university"
    name            TEXT NOT NULL,
    plan            TEXT NOT NULL DEFAULT 'free'    -- free | pro | enterprise
                    CHECK (plan IN ('free', 'pro', 'enterprise')),
    logo_url        TEXT,
    primary_color   TEXT DEFAULT '#3C3489',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    is_active       BOOLEAN DEFAULT true,
    max_events      INT DEFAULT 1,                  -- plan limit
    max_delegates   INT DEFAULT 100,                -- plan limit
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. USERS (organizing committee + staff — NOT delegates)
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    phone           TEXT,
    role            TEXT NOT NULL DEFAULT 'volunteer'
                    CHECK (role IN (
                        'super_admin',
                        'organizer',
                        'registration_team',
                        'hospitality_team',
                        'food_staff',
                        'logistics_team',
                        'technical_team',
                        'volunteer_coordinator',
                        'volunteer'
                    )),
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT true,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- ============================================================
-- 3. EVENTS
-- ============================================================
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    venue           TEXT NOT NULL,
    city            TEXT,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    start_time      TIME,
    end_time        TIME,
    organizer_id    UUID REFERENCES users(id),
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
    registration_open BOOLEAN DEFAULT true,
    banner_url      TEXT,
    settings        JSONB DEFAULT '{}'::jsonb,      -- flexible config per event
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. DELEGATES (event participants — NOT staff)
-- ============================================================
CREATE TABLE delegates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT,
    college         TEXT,
    city            TEXT,
    qr_code         TEXT UNIQUE NOT NULL,           -- HMAC-signed unique token
    barcode         TEXT UNIQUE,
    payment_status  TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending', 'paid', 'waived', 'failed')),
    payment_amount  NUMERIC(10,2),
    payment_ref     TEXT,
    food_pref       TEXT DEFAULT 'veg'
                    CHECK (food_pref IN ('veg', 'non_veg', 'vegan', 'jain')),
    accommodation_required BOOLEAN DEFAULT false,
    accommodation_pref TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    registered_at   TIMESTAMPTZ DEFAULT NOW(),
    checked_in      BOOLEAN DEFAULT false,
    checked_in_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, event_id, email)
);

-- ============================================================
-- 5. SCAN LOGS (every QR scan recorded here)
-- ============================================================
CREATE TABLE scan_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    delegate_id     UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    scan_type       TEXT NOT NULL
                    CHECK (scan_type IN (
                        'entry', 'exit',
                        'food_breakfast', 'food_lunch', 'food_dinner',
                        'kit_collection',
                        'accommodation_checkin', 'accommodation_checkout',
                        'session_entry', 'session_exit'
                    )),
    scanned_by      UUID REFERENCES users(id),      -- staff who scanned
    session_id      UUID,                           -- if session scan
    location        TEXT,
    device_id       TEXT,
    ip_address      INET,
    is_valid        BOOLEAN NOT NULL DEFAULT true,
    rejection_reason TEXT,                          -- if is_valid = false
    scan_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    scanned_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. FOOD LOGS
-- ============================================================
CREATE TABLE food_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    delegate_id     UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    meal_type       TEXT NOT NULL
                    CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
    meal_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    claimed_at      TIMESTAMPTZ DEFAULT NOW(),
    staff_id        UUID REFERENCES users(id),
    -- Prevent duplicate: one meal per delegate per type per day
    UNIQUE(tenant_id, delegate_id, meal_type, meal_date)
);

-- ============================================================
-- 7. ACCOMMODATION
-- ============================================================
CREATE TABLE rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    room_number     TEXT NOT NULL,
    hostel_name     TEXT NOT NULL,
    floor           TEXT,
    capacity        INT NOT NULL DEFAULT 2,
    room_type       TEXT DEFAULT 'shared'
                    CHECK (room_type IN ('single', 'shared', 'dormitory')),
    gender_preference TEXT CHECK (gender_preference IN ('male', 'female', 'any')),
    is_available    BOOLEAN DEFAULT true,
    notes           TEXT,
    UNIQUE(tenant_id, event_id, hostel_name, room_number)
);

CREATE TABLE room_allocations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    delegate_id     UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    allocated_by    UUID REFERENCES users(id),
    checkin_time    TIMESTAMPTZ,
    checkout_time   TIMESTAMPTZ,
    allocated_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, delegate_id, event_id)     -- one room per delegate per event
);

-- ============================================================
-- 8. SESSIONS (event sub-sessions / workshops)
-- ============================================================
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    hall            TEXT,
    speaker         TEXT,
    session_date    DATE,
    start_time      TIME,
    end_time        TIME,
    capacity        INT,
    attendance_threshold_pct INT DEFAULT 75,       -- % needed for certificate
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. ATTENDANCE (per session)
-- ============================================================
CREATE TABLE attendance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    delegate_id     UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    checkin_time    TIMESTAMPTZ,
    checkout_time   TIMESTAMPTZ,
    duration_minutes INT,
    UNIQUE(tenant_id, delegate_id, session_id)
);

-- ============================================================
-- 10. KIT DISTRIBUTION
-- ============================================================
CREATE TABLE kit_distribution (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    delegate_id     UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    distributed_by  UUID REFERENCES users(id),
    items           JSONB DEFAULT '[]'::jsonb,      -- ["badge", "tshirt", "bag"]
    distributed_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, delegate_id, event_id)       -- one kit per delegate per event
);

-- ============================================================
-- 11. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    priority        TEXT DEFAULT 'normal'
                    CHECK (priority IN ('low', 'normal', 'high', 'emergency')),
    target_roles    TEXT[] DEFAULT ARRAY['all'],    -- which roles see this
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES — for fast tenant-scoped queries
-- ============================================================
CREATE INDEX idx_users_tenant          ON users(tenant_id);
CREATE INDEX idx_events_tenant         ON events(tenant_id);
CREATE INDEX idx_delegates_tenant      ON delegates(tenant_id);
CREATE INDEX idx_delegates_event       ON delegates(event_id);
CREATE INDEX idx_delegates_qr          ON delegates(qr_code);
CREATE INDEX idx_scan_logs_tenant      ON scan_logs(tenant_id);
CREATE INDEX idx_scan_logs_delegate    ON scan_logs(delegate_id);
CREATE INDEX idx_scan_logs_date        ON scan_logs(scan_date);
CREATE INDEX idx_food_logs_tenant      ON food_logs(tenant_id);
CREATE INDEX idx_food_logs_delegate    ON food_logs(delegate_id);
CREATE INDEX idx_room_alloc_tenant     ON room_allocations(tenant_id);
CREATE INDEX idx_attendance_delegate   ON attendance(delegate_id);
CREATE INDEX idx_attendance_session    ON attendance(session_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enforces tenant isolation at DB level
-- ============================================================
ALTER TABLE tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance       ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements    ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see rows matching their tenant_id
-- Your FastAPI backend sets app.current_tenant_id via SET LOCAL
CREATE POLICY tenant_isolation ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation ON events
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation ON delegates
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation ON scan_logs
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation ON food_logs
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation ON rooms
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation ON room_allocations
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation ON sessions
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation ON attendance
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation ON kit_distribution
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation ON announcements
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ============================================================
-- SEED: Super Admin tenant (your platform control tenant)
-- ============================================================
INSERT INTO tenants (id, slug, name, plan, max_events, max_delegates)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'eventsphere-admin',
    'EventSphere Platform',
    'enterprise',
    9999,
    9999999
);
