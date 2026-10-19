-- 梦角 DreamCorner 数据库初始化脚本
-- 首次部署时自动执行，创建业务表

-- 启用行级安全扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- user_profile 自定义类型（如不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profile') THEN
    CREATE TYPE user_profile AS (
      user_id text,
      name text,
      avatar text,
      email text
    );
  END IF;
END$$;

-- file_attachment 自定义类型（如不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_attachment') THEN
    CREATE TYPE file_attachment AS (
      bucket_id text,
      file_path text
    );
  END IF;
END$$;

-- ========== 业务表 ==========

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_name varchar(50) NOT NULL DEFAULT 'dream_purple',
  primary_color varchar(20) NOT NULL DEFAULT 'hsl(280 80% 72%)',
  accent_color varchar(20) NOT NULL DEFAULT 'hsl(320 70% 70%)',
  background_color varchar(20) NOT NULL DEFAULT 'hsl(270 40% 8%)',
  dream_role_name varchar(50) NOT NULL DEFAULT '梦角',
  dream_role_avatar varchar(10) NOT NULL DEFAULT '梦',
  dream_role_avatar_color varchar(30) NOT NULL DEFAULT 'from-violet-400 to-pink-400',
  user_name varchar(50) NOT NULL,
  user_avatar varchar(10) NOT NULL DEFAULT '我',
  user_avatar_color varchar(30) NOT NULL DEFAULT 'from-blue-400 to-cyan-400',
  dream_role_avatar_url text NOT NULL DEFAULT '',
  user_avatar_url text NOT NULL DEFAULT '',
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_unique_user
  ON user_settings (((_created_by).user_id));

-- AI 设置表
CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider varchar(30) NOT NULL DEFAULT 'openai_compatible',
  api_key text NOT NULL DEFAULT '',
  base_url text NOT NULL DEFAULT '',
  model_name varchar(100) NOT NULL DEFAULT '',
  temperature numeric NOT NULL DEFAULT 0.7,
  system_prompt text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT false,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_settings_unique_user
  ON ai_settings (((_created_by).user_id));

-- 塔罗抽牌记录表
CREATE TABLE IF NOT EXISTS tarot_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name varchar(100) NOT NULL,
  card_number integer NOT NULL,
  is_reversed boolean NOT NULL DEFAULT false,
  position varchar(20) NOT NULL DEFAULT 'single',
  message text NOT NULL DEFAULT '',
  dream_message text NOT NULL DEFAULT '',
  context varchar(50) NOT NULL DEFAULT 'general',
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE INDEX IF NOT EXISTS idx_tarot_draws_created ON tarot_draws(_created_at);

-- 梦角聊天消息表
CREATE TABLE IF NOT EXISTS dream_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role varchar(20) NOT NULL,
  content text NOT NULL,
  tarot_draw_id uuid REFERENCES tarot_draws(id) ON DELETE SET NULL,
  message_type varchar(30) NOT NULL DEFAULT 'text',
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE INDEX IF NOT EXISTS idx_dream_chat_created ON dream_chat_messages(_created_at);

-- 日记表
CREATE TABLE IF NOT EXISTS diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  content text NOT NULL,
  mood varchar(50) NOT NULL DEFAULT 'neutral',
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  is_dream boolean NOT NULL DEFAULT false,
  dream_role_message text NOT NULL DEFAULT '',
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON diary_entries(entry_date);

-- 朋友圈表
CREATE TABLE IF NOT EXISTS moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  likes integer NOT NULL DEFAULT 0,
  is_from_dream boolean NOT NULL DEFAULT false,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE INDEX IF NOT EXISTS idx_moments_created ON moments(_created_at);

-- 日程表
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  description text NOT NULL DEFAULT '',
  schedule_date date NOT NULL,
  schedule_time varchar(10) NOT NULL DEFAULT '',
  is_done boolean NOT NULL DEFAULT false,
  category varchar(50) NOT NULL DEFAULT 'general',
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(schedule_date);

-- 经期记录表
CREATE TABLE IF NOT EXISTS period_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date,
  cycle_length integer NOT NULL DEFAULT 28,
  period_length integer NOT NULL DEFAULT 5,
  notes text NOT NULL DEFAULT '',
  symptoms text[] NOT NULL DEFAULT '{}',
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE INDEX IF NOT EXISTS idx_period_records_start ON period_records(start_date);

-- 启用 RLS（自部署版本默认简化策略，可按需调整）
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_records ENABLE ROW LEVEL SECURITY;

-- 默认 policy：允许所有认证用户操作（自部署版本简化）
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_settings', 'ai_settings', 'tarot_draws',
    'dream_chat_messages', 'diary_entries', 'moments',
    'schedules', 'period_records'
  ]::text[]
  LOOP
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "allow_all_auth" ON %I
       AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "service_role_bypass_policy" ON %I
       TO service_role USING (true)',
      t
    );
  END LOOP;
END$$;
