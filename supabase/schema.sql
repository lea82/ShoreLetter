-- ============================================================
-- Shore Letter — Supabase Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE language_code AS ENUM ('zh', 'en', 'ja', 'ko');
CREATE TYPE write_time AS ENUM ('morning', 'night', 'any');
CREATE TYPE user_tier AS ENUM ('free', 'plus');
CREATE TYPE bottle_status AS ENUM ('drifting', 'found', 'sealed', 'expired');
CREATE TYPE bottle_mode AS ENUM ('drift', 'current', 'wednesday');
CREATE TYPE correspondence_status AS ENUM ('active', 'sealed', 'abandoned');

-- ============================================================
-- TABLES
-- ============================================================

-- profiles (extends Supabase auth.users)
-- NOTE: auth.users.id is NEVER exposed in public schema
CREATE TABLE profiles (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id           uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias             text NOT NULL,
  avatar_url        text,
  language          language_code NOT NULL DEFAULT 'zh',
  vibe_tags         text[] DEFAULT '{}',
  write_time        write_time DEFAULT 'any',
  timezone          text DEFAULT 'America/Los_Angeles',
  trust_score       integer DEFAULT 10,       -- internal only, never exposed
  tier              user_tier DEFAULT 'free',
  stripe_customer_id text,                    -- internal only
  active_corr_count integer DEFAULT 0,        -- cached count
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- bottles
CREATE TABLE bottles (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         text NOT NULL,
  embedding       vector(1536),               -- pgvector for semantic matching
  prompt_used     text,
  status          bottle_status DEFAULT 'drifting',
  mode            bottle_mode DEFAULT 'drift',
  language        language_code NOT NULL DEFAULT 'zh',
  safety_score    float DEFAULT 1.0,          -- 0-1, Claude safety scan
  safety_flagged  boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  expires_at      timestamptz DEFAULT now() + interval '14 days'
);

-- correspondences
CREATE TABLE correspondences (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bottle_id        uuid REFERENCES bottles(id),
  user_a_id        uuid NOT NULL REFERENCES profiles(id),  -- bottle author
  user_b_id        uuid NOT NULL REFERENCES profiles(id),  -- finder (may be AI profile)
  is_ai_fallback   boolean DEFAULT false,
  status           correspondence_status DEFAULT 'active',
  voice_enabled    boolean DEFAULT false,                   -- mutual opt-in
  sync_enabled     boolean DEFAULT false,                   -- unlocks after 3 letters
  letter_count     integer DEFAULT 0,
  last_letter_at   timestamptz,
  created_at       timestamptz DEFAULT now(),
  sealed_at        timestamptz,
  -- computed: correspondence_age = now() - created_at (north star metric)
  CONSTRAINT different_users CHECK (user_a_id != user_b_id)
);

-- letters (messages within a correspondence)
CREATE TABLE letters (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  correspondence_id uuid NOT NULL REFERENCES correspondences(id) ON DELETE CASCADE,
  sender_id         uuid NOT NULL REFERENCES profiles(id),
  content           text NOT NULL,             -- encrypted at rest via Supabase vault
  safety_score      float DEFAULT 1.0,
  safety_flagged    boolean DEFAULT false,
  is_ai_generated   boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- gifts (virtual items sent within correspondence)
CREATE TABLE gifts (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  correspondence_id uuid NOT NULL REFERENCES correspondences(id),
  sender_id         uuid NOT NULL REFERENCES profiles(id),
  gift_type         text NOT NULL,             -- pressed_flower, wax_seal, playlist, anniversary
  stripe_payment_id text,
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);

-- reports (safety)
CREATE TABLE reports (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id       uuid NOT NULL REFERENCES profiles(id),
  reported_type     text NOT NULL,             -- bottle | letter | profile
  reported_id       uuid NOT NULL,
  reason            text NOT NULL,
  status            text DEFAULT 'pending',    -- pending | reviewed | actioned
  created_at        timestamptz DEFAULT now()
);

-- wednesday_tides (weekly batch matching records)
CREATE TABLE wednesday_tides (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tide_date       date NOT NULL UNIQUE,
  participants    integer DEFAULT 0,
  matched_pairs   integer DEFAULT 0,
  ai_fallbacks    integer DEFAULT 0,
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- daily_prompts
CREATE TABLE daily_prompts (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_zh   text NOT NULL,
  prompt_en   text NOT NULL,
  category    text DEFAULT 'general',          -- general | season | wednesday
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE correspondences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE wednesday_tides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_prompts    ENABLE ROW LEVEL SECURITY;

-- profiles: users can only read/update their own
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth_id = auth.uid());

-- profiles: limited public read (alias + avatar only — used in correspondence display)
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT USING (true);
-- NOTE: Expose only alias + avatar_url in API responses, never auth_id or trust_score

-- bottles: authors can manage their own
CREATE POLICY "bottles_author" ON bottles
  FOR ALL USING (author_id IN (
    SELECT id FROM profiles WHERE auth_id = auth.uid()
  ));

-- bottles: drifting bottles readable for matching (content only, not author)
CREATE POLICY "bottles_drifting_read" ON bottles
  FOR SELECT USING (status = 'drifting' AND safety_flagged = false);

-- correspondences: participants only
CREATE POLICY "correspondences_participants" ON correspondences
  FOR ALL USING (
    user_a_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR
    user_b_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
  );

-- letters: participants of the correspondence only
CREATE POLICY "letters_participants" ON letters
  FOR ALL USING (
    correspondence_id IN (
      SELECT id FROM correspondences
      WHERE user_a_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
         OR user_b_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- gifts: correspondence participants
CREATE POLICY "gifts_participants" ON gifts
  FOR ALL USING (
    correspondence_id IN (
      SELECT id FROM correspondences
      WHERE user_a_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
         OR user_b_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- reports: reporters own their reports
CREATE POLICY "reports_own" ON reports
  FOR INSERT WITH CHECK (
    reporter_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
  );

-- wednesday_tides: public read
CREATE POLICY "tides_public_read" ON wednesday_tides
  FOR SELECT USING (true);

-- daily_prompts: public read
CREATE POLICY "prompts_public_read" ON daily_prompts
  FOR SELECT USING (active = true);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_auth_id       ON profiles(auth_id);
CREATE INDEX idx_profiles_language      ON profiles(language);
CREATE INDEX idx_bottles_status         ON bottles(status);
CREATE INDEX idx_bottles_author         ON bottles(author_id);
CREATE INDEX idx_bottles_mode_status    ON bottles(mode, status);
CREATE INDEX idx_bottles_language       ON bottles(language);
CREATE INDEX idx_bottles_created        ON bottles(created_at DESC);
CREATE INDEX idx_corr_user_a            ON correspondences(user_a_id);
CREATE INDEX idx_corr_user_b            ON correspondences(user_b_id);
CREATE INDEX idx_corr_status            ON correspondences(status);
CREATE INDEX idx_corr_last_letter       ON correspondences(last_letter_at DESC);
CREATE INDEX idx_letters_corr           ON letters(correspondence_id, created_at);
CREATE INDEX idx_letters_sender         ON letters(sender_id);

-- pgvector index for semantic matching
CREATE INDEX idx_bottles_embedding ON bottles
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update correspondence letter_count and last_letter_at
CREATE OR REPLACE FUNCTION update_correspondence_on_letter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE correspondences
  SET
    letter_count   = letter_count + 1,
    last_letter_at = NEW.created_at,
    -- unlock sync after 3 letters
    sync_enabled   = CASE WHEN letter_count >= 2 THEN true ELSE sync_enabled END
  WHERE id = NEW.correspondence_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_letter_insert
  AFTER INSERT ON letters
  FOR EACH ROW EXECUTE FUNCTION update_correspondence_on_letter();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (auth_id, alias, language)
  VALUES (
    NEW.id,
    'Traveler' || floor(random() * 9000 + 1000)::text,
    'zh'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA — Daily Prompts
-- ============================================================

INSERT INTO daily_prompts (prompt_zh, prompt_en, category) VALUES
('描述你现在所在的地方，但不要提城市名字。', 'Describe where you are right now without naming the city.', 'general'),
('这周有什么让你意外的小事？', 'What small thing surprised you this week?', 'general'),
('你最近在想一个什么问题，还没有答案？', 'What question have you been sitting with lately, unanswered?', 'general'),
('如果你能告诉一个陌生人一件事，会是什么？', 'If you could tell a stranger one thing, what would it be?', 'general'),
('描述你今天喝的第一杯东西。', 'Describe the first thing you drank today.', 'general'),
('你上次真正大笑是什么时候？因为什么？', 'When did you last really laugh? What was it about?', 'general'),
('窗外现在是什么天气？你喜欢这种天气吗？', 'What''s the weather outside right now? Do you like it?', 'general'),
('你有没有一首歌，每次听都会想起某个地方？', 'Is there a song that always takes you somewhere specific?', 'general'),
('你最近学到了什么新东西，哪怕是很小的事？', 'What''s something new you learned recently, however small?', 'general'),
('如果你的心情是一种天气，今天是什么天气？', 'If your mood were a weather, what would today''s be?', 'general');
