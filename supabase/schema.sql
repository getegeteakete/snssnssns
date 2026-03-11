-- ═══════════════════════════════════════════════
-- AIMO Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','business','enterprise')),
  points          INTEGER NOT NULL DEFAULT 30,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  line_user_id    TEXT,
  affiliate_code  TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  referred_by     TEXT REFERENCES profiles(affiliate_code),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SNS ACCOUNTS
-- ─────────────────────────────────────────────
CREATE TABLE sns_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('twitter','instagram','facebook','line_official','gmb')),
  account_id      TEXT NOT NULL,
  account_name    TEXT,
  access_token    TEXT,
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  followers_count INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, account_id)
);

-- ─────────────────────────────────────────────
-- POSTS
-- ─────────────────────────────────────────────
CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  content         TEXT NOT NULL,
  image_urls      TEXT[],
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','failed')),
  scheduled_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  platform_post_id TEXT,
  likes_count     INTEGER DEFAULT 0,
  comments_count  INTEGER DEFAULT 0,
  shares_count    INTEGER DEFAULT 0,
  impressions     INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  ai_generated    BOOLEAN DEFAULT false,
  points_used     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AUTO LIKE / FOLLOW JOBS
-- ─────────────────────────────────────────────
CREATE TABLE auto_engagement_jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  job_type        TEXT NOT NULL CHECK (job_type IN ('like','follow','unfollow')),
  target_type     TEXT NOT NULL CHECK (target_type IN ('hashtag','keyword','competitor_followers','location')),
  target_value    TEXT NOT NULL,
  daily_limit     INTEGER DEFAULT 100,
  executed_today  INTEGER DEFAULT 0,
  total_executed  INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  last_run_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- KEYWORD TRIGGERS (auto reply + URL generation)
-- ─────────────────────────────────────────────
CREATE TABLE keyword_triggers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('comment','dm','mention')),
  keywords        TEXT[] NOT NULL,
  reply_template  TEXT NOT NULL,
  url_type        TEXT CHECK (url_type IN ('product_lp','gift_download','reservation','custom')),
  destination_url TEXT,
  is_active       BOOLEAN DEFAULT true,
  triggered_count INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- KEYWORD TRIGGER LOGS (issued URLs)
-- ─────────────────────────────────────────────
CREATE TABLE trigger_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_id      UUID NOT NULL REFERENCES keyword_triggers(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  sender_id       TEXT NOT NULL,
  sender_name     TEXT,
  matched_keyword TEXT NOT NULL,
  reply_sent      TEXT NOT NULL,
  issued_url      TEXT,
  unique_token    TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  url_clicked     BOOLEAN DEFAULT false,
  url_clicked_at  TIMESTAMPTZ,
  converted       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AI AUTO REPLY SETTINGS
-- ─────────────────────────────────────────────
CREATE TABLE ai_reply_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  platform        TEXT[] DEFAULT ARRAY['instagram','twitter'],
  mode            TEXT NOT NULL DEFAULT 'approval' CHECK (mode IN ('auto','approval','hybrid')),
  brand_tone      TEXT DEFAULT '丁寧でフレンドリーなトーン',
  auto_types      TEXT[] DEFAULT ARRAY['thank_you','general_question'],
  approval_types  TEXT[] DEFAULT ARRAY['complaint','price','reservation'],
  is_active       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AI REPLY QUEUE
-- ─────────────────────────────────────────────
CREATE TABLE ai_reply_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  comment_id      TEXT NOT NULL,
  post_id         TEXT,
  sender_id       TEXT NOT NULL,
  sender_name     TEXT,
  original_text   TEXT NOT NULL,
  ai_reply        TEXT NOT NULL,
  reply_type      TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','sent','rejected','auto_sent')),
  reviewed_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  sent_at         TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- GMB POSTS
-- ─────────────────────────────────────────────
CREATE TABLE gmb_posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id     TEXT NOT NULL,
  location_name   TEXT,
  post_type       TEXT NOT NULL CHECK (post_type IN ('whats_new','event','offer','product')),
  title           TEXT,
  content         TEXT NOT NULL,
  cta_type        TEXT,
  cta_url         TEXT,
  event_start     TIMESTAMPTZ,
  event_end       TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','failed')),
  scheduled_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  gmb_post_name   TEXT,
  view_count      INTEGER DEFAULT 0,
  click_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ANALYTICS SNAPSHOTS (daily)
-- ─────────────────────────────────────────────
CREATE TABLE analytics_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  platform        TEXT NOT NULL,
  metric_type     TEXT NOT NULL,
  value           NUMERIC NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, platform, metric_type)
);

-- ─────────────────────────────────────────────
-- AI PROPOSALS (improvement suggestions)
-- ─────────────────────────────────────────────
CREATE TABLE ai_proposals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent           TEXT NOT NULL CHECK (agent IN ('cmo','sns','lp','analytics','notify')),
  category        TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','executed','snoozed')),
  expected_impact TEXT,
  data_basis      JSONB,
  approved_at     TIMESTAMPTZ,
  executed_at     TIMESTAMPTZ,
  line_notified   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- POINT TRANSACTIONS
-- ─────────────────────────────────────────────
CREATE TABLE point_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('purchase','bonus','use','refund','affiliate_bonus')),
  amount          INTEGER NOT NULL,
  balance_after   INTEGER NOT NULL,
  description     TEXT,
  stripe_payment_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AFFILIATE PROGRAM (AIMO referrals)
-- ─────────────────────────────────────────────
CREATE TABLE affiliate_conversions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('signup','paid_first','recurring')),
  plan            TEXT,
  amount          INTEGER NOT NULL DEFAULT 0,
  reward          INTEGER NOT NULL DEFAULT 0,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  stripe_transfer_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EC AFFILIATE PROGRAMS (user's own products)
-- ─────────────────────────────────────────────
CREATE TABLE ec_programs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  product_url     TEXT NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage','fixed')),
  commission_value NUMERIC NOT NULL,
  cookie_days     INTEGER DEFAULT 30,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ec_affiliators (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id      UUID NOT NULL REFERENCES ec_programs(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id),
  email           TEXT NOT NULL,
  name            TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  unique_tag      TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  clicks          INTEGER DEFAULT 0,
  conversions     INTEGER DEFAULT 0,
  total_revenue   NUMERIC DEFAULT 0,
  total_reward    NUMERIC DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ec_conversions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id      UUID NOT NULL REFERENCES ec_programs(id),
  affiliator_id   UUID NOT NULL REFERENCES ec_affiliators(id),
  order_id        TEXT,
  order_value     NUMERIC NOT NULL,
  commission      NUMERIC NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- LINE NOTIFICATIONS LOG
-- ─────────────────────────────────────────────
CREATE TABLE line_notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('proposal','warning','report','approval_request','execution_done')),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  proposal_id     UUID REFERENCES ai_proposals(id),
  status          TEXT DEFAULT 'sent' CHECK (status IN ('sent','failed','read')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sns_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_engagement_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reply_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reply_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ec_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ec_affiliators ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_notifications ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see their own data
CREATE POLICY "own_data" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_data" ON sns_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON auto_engagement_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON keyword_triggers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON trigger_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON ai_reply_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON ai_reply_queue FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON gmb_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON analytics_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON ai_proposals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON point_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON affiliate_conversions FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "own_data" ON ec_programs FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "own_data" ON line_notifications FOR ALL USING (auth.uid() = user_id);

-- EC affiliators can see programs they joined
CREATE POLICY "program_owner" ON ec_affiliators FOR ALL USING (
  EXISTS (SELECT 1 FROM ec_programs WHERE id = program_id AND owner_id = auth.uid())
  OR (SELECT id FROM profiles WHERE email = ec_affiliators.email AND id = auth.uid()) IS NOT NULL
);

-- ─────────────────────────────────────────────
-- TRIGGERS: auto-update updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- TRIGGER: auto-create profile on user signup
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────────
CREATE INDEX idx_posts_user_status ON posts(user_id, status);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_proposals_user_status ON ai_proposals(user_id, status);
CREATE INDEX idx_analytics_user_date ON analytics_snapshots(user_id, date);
CREATE INDEX idx_trigger_logs_trigger ON trigger_logs(trigger_id, created_at);
CREATE INDEX idx_ai_reply_queue_user_status ON ai_reply_queue(user_id, status);
CREATE INDEX idx_gmb_posts_user_status ON gmb_posts(user_id, status);
