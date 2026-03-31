CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  profile_image_url TEXT,
  job_title VARCHAR(150),
  industry VARCHAR(150),
  linkedin_profile_url TEXT,
  account_status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'pending_verification')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  -- deleted this because, it can be queried from the user event section instead of saving it as a field
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  original_prompt TEXT NOT NULL,
  tone VARCHAR(100) NOT NULL,
  goal VARCHAR(150) NOT NULL,
  draft_content TEXT NOT NULL,
  hashtags JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'archived', 'deleted')),
  last_opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  tone VARCHAR(100) NOT NULL,
  goal VARCHAR(150) NOT NULL,
  generated_content TEXT NOT NULL,
  hashtags JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta TEXT,
  model_name VARCHAR(100),
  generation_status VARCHAR(30) NOT NULL DEFAULT 'success'
    CHECK (generation_status IN ('success', 'failed')),
  error_message TEXT,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Stores the "Who, Where, and When" of a login.
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    ip_address INET,            -- Better than VARCHAR for IPs
    user_agent TEXT,            -- Stores browser/device info once
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores the "What" they did during that specific session.
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL, 
    event_type VARCHAR(30) NOT NULL, 
    event_name VARCHAR(50) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_event_type CHECK (event_type IN ('auth', 'post', 'draft', 'edit')),
    CONSTRAINT check_event_name CHECK (event_name IN ('signup', 'login', 'generate_post', 'save_draft'))
);


-- separate admins from users for better security isolation (RBAC).
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'moderator' 
        CHECK (role IN ('super_admin', 'moderator', 'support')),
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keeps the 'users' table clean by moving non-auth data here.
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_tone VARCHAR(100) DEFAULT 'professional',
    default_goal VARCHAR(150) DEFAULT 'engagement',
    ui_theme VARCHAR(20) DEFAULT 'light',
    notification_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================
-- ADDITIONAL INDEXES & TRIGGERS
-- =========================================

-- Index for session expiration cleanup jobs
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_session_id ON usage_events(session_id);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);

CREATE INDEX IF NOT EXISTS idx_generated_posts_user_id ON generated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_draft_id ON generated_posts(draft_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_status ON generated_posts(generation_status);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_name ON usage_events(event_name);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_metadata ON usage_events USING GIN(metadata);


CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_preferences updated_at
DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_drafts_updated_at ON drafts;
CREATE TRIGGER trg_drafts_updated_at
BEFORE UPDATE ON drafts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
