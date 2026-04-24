/*
  # Replace old schema with new SDR CRM schema

  1. Changes
    - Drop all existing tables, functions, triggers, and policies
    - Recreate with new schema using proper enums, better RLS, and auto-setup functions
    - New features: fn_my_workspace_ids() for RLS, fn_create_default_stages(), fn_handle_new_user() auto-creates workspace + stages
    - activity_logs (renamed from activity_log), generated_messages.variations as jsonb, stage_required_fields check constraint

  2. Security
    - RLS on all tables using fn_my_workspace_ids() helper
    - SECURITY DEFINER with fixed search_path to prevent privilege escalation

  3. Important Notes
    - All data will be lost (tables are dropped and recreated)
    - The fn_handle_new_user() trigger auto-creates workspace + default stages on signup
    - Auto-confirms users by setting email_confirmed_at
*/

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.campaigns;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.fn_handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.fn_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.fn_my_workspace_ids() CASCADE;
DROP FUNCTION IF EXISTS public.fn_create_default_stages(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_member(uuid) CASCADE;

-- Drop all tables (cascading will handle dependent objects)
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.generated_messages CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.stage_required_fields CASCADE;
DROP TABLE IF EXISTS public.lead_custom_values CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.custom_field_definitions CASCADE;
DROP TABLE IF EXISTS public.funnel_stages CASCADE;
DROP TABLE IF EXISTS public.workspace_members CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.workspaces CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS public.workspace_role CASCADE;
DROP TYPE IF EXISTS public.field_type CASCADE;
DROP TYPE IF EXISTS public.activity_type CASCADE;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.workspace_role AS ENUM ('admin', 'member');
CREATE TYPE public.field_type     AS ENUM ('text', 'number', 'date', 'select');
CREATE TYPE public.activity_type  AS ENUM (
  'lead_created',
  'stage_changed',
  'message_generated',
  'message_sent',
  'lead_updated'
);

-- ============================================================
-- 1. WORKSPACES
-- ============================================================
CREATE TABLE public.workspaces (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT        NOT NULL DEFAULT '',
  email      TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. WORKSPACE MEMBERS
-- ============================================================
CREATE TABLE public.workspace_members (
  id           UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID                  NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID                  NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  role         public.workspace_role NOT NULL DEFAULT 'member',
  joined_at    TIMESTAMPTZ           NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

-- ============================================================
-- 4. FUNNEL STAGES
-- ============================================================
CREATE TABLE public.funnel_stages (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  position     INTEGER     NOT NULL DEFAULT 0,
  color        TEXT        NOT NULL DEFAULT '#6B7280',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. CUSTOM FIELD DEFINITIONS
-- ============================================================
CREATE TABLE public.custom_field_definitions (
  id           UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID              NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT              NOT NULL,
  field_type   public.field_type NOT NULL DEFAULT 'text',
  options      TEXT[]            NOT NULL DEFAULT '{}',
  position     INTEGER           NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. LEADS
-- ============================================================
CREATE TABLE public.leads (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID        NOT NULL REFERENCES public.workspaces(id)    ON DELETE CASCADE,
  stage_id     UUID        NOT NULL REFERENCES public.funnel_stages(id),
  assigned_to  UUID                 REFERENCES public.profiles(id)       ON DELETE SET NULL,
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL DEFAULT '',
  phone        TEXT        NOT NULL DEFAULT '',
  company      TEXT        NOT NULL DEFAULT '',
  job_title    TEXT        NOT NULL DEFAULT '',
  source       TEXT        NOT NULL DEFAULT '',
  notes        TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. LEAD CUSTOM VALUES
-- ============================================================
CREATE TABLE public.lead_custom_values (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id  UUID NOT NULL REFERENCES public.leads(id)                    ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  value    TEXT NOT NULL DEFAULT '',
  UNIQUE (lead_id, field_id)
);

-- ============================================================
-- 8. STAGE REQUIRED FIELDS
-- ============================================================
CREATE TABLE public.stage_required_fields (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_id        UUID REFERENCES public.funnel_stages(id)            ON DELETE CASCADE,
  standard_field  TEXT,
  custom_field_id UUID REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  CONSTRAINT only_one_field_source CHECK (
    (standard_field IS NOT NULL) <> (custom_field_id IS NOT NULL)
  )
);

-- ============================================================
-- 9. CAMPAIGNS
-- ============================================================
CREATE TABLE public.campaigns (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id     UUID        NOT NULL REFERENCES public.workspaces(id)    ON DELETE CASCADE,
  trigger_stage_id UUID                 REFERENCES public.funnel_stages(id) ON DELETE SET NULL,
  name             TEXT        NOT NULL,
  context          TEXT        NOT NULL,
  prompt           TEXT        NOT NULL,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. GENERATED MESSAGES
-- ============================================================
CREATE TABLE public.generated_messages (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id        UUID        NOT NULL REFERENCES public.leads(id)     ON DELETE CASCADE,
  campaign_id    UUID        NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  variations     JSONB       NOT NULL DEFAULT '[]',
  was_sent       BOOLEAN     NOT NULL DEFAULT false,
  sent_at        TIMESTAMPTZ,
  sent_variation INTEGER,
  auto_generated BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. ACTIVITY LOGS
-- ============================================================
CREATE TABLE public.activity_logs (
  id            UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID                 NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id       UUID                          REFERENCES public.leads(id)      ON DELETE CASCADE,
  user_id       UUID                          REFERENCES public.profiles(id)   ON DELETE SET NULL,
  activity_type public.activity_type NOT NULL,
  metadata      JSONB                NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ          NOT NULL DEFAULT now()
);

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Workspace IDs for the logged-in user (used in RLS policies)
CREATE OR REPLACE FUNCTION public.fn_my_workspace_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id
  FROM   public.workspace_members
  WHERE  user_id = auth.uid();
$$;

-- Create default funnel stages for a workspace
CREATE OR REPLACE FUNCTION public.fn_create_default_stages(p_workspace_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.funnel_stages (workspace_id, name, position, color)
  VALUES
    (p_workspace_id, 'Base',             0, '#6B7280'),
    (p_workspace_id, 'Lead Mapeado',     1, '#3B82F6'),
    (p_workspace_id, 'Tentando Contato', 2, '#F59E0B'),
    (p_workspace_id, 'Conexão Iniciada', 3, '#8B5CF6'),
    (p_workspace_id, 'Desqualificado',   4, '#EF4444'),
    (p_workspace_id, 'Qualificado',      5, '#10B981'),
    (p_workspace_id, 'Reunião Agendada', 6, '#14B8A6');
END;
$$;

-- Handle new user signup: create profile + workspace + member + stages
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  -- Auto-confirm email
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;

  -- Create profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );

  -- Create workspace
  INSERT INTO public.workspaces (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'Workspace') || '''s workspace')
  RETURNING id INTO v_workspace_id;

  -- Add user as admin
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, NEW.id, 'admin');

  -- Create default stages
  PERFORM public.fn_create_default_stages(v_workspace_id);

  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.workspaces               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_custom_values       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_required_fields    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs            ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_own"
  ON public.profiles FOR ALL
  USING (id = auth.uid());

-- WORKSPACES
CREATE POLICY "workspaces_member_select"
  ON public.workspaces FOR SELECT
  USING (id IN (SELECT public.fn_my_workspace_ids()));

CREATE POLICY "workspaces_insert"
  ON public.workspaces FOR INSERT
  WITH CHECK (true);

-- WORKSPACE MEMBERS
CREATE POLICY "workspace_members_select"
  ON public.workspace_members FOR SELECT
  USING (workspace_id IN (SELECT public.fn_my_workspace_ids()));

CREATE POLICY "workspace_members_insert"
  ON public.workspace_members FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.fn_my_workspace_ids()));

-- FUNNEL STAGES
CREATE POLICY "funnel_stages_all"
  ON public.funnel_stages FOR ALL
  USING (workspace_id IN (SELECT public.fn_my_workspace_ids()));

-- CUSTOM FIELD DEFINITIONS
CREATE POLICY "custom_field_definitions_all"
  ON public.custom_field_definitions FOR ALL
  USING (workspace_id IN (SELECT public.fn_my_workspace_ids()));

-- LEADS
CREATE POLICY "leads_all"
  ON public.leads FOR ALL
  USING (workspace_id IN (SELECT public.fn_my_workspace_ids()));

-- LEAD CUSTOM VALUES
CREATE POLICY "lead_custom_values_all"
  ON public.lead_custom_values FOR ALL
  USING (
    lead_id IN (
      SELECT id FROM public.leads
      WHERE  workspace_id IN (SELECT public.fn_my_workspace_ids())
    )
  );

-- STAGE REQUIRED FIELDS
CREATE POLICY "stage_required_fields_all"
  ON public.stage_required_fields FOR ALL
  USING (
    stage_id IN (
      SELECT id FROM public.funnel_stages
      WHERE  workspace_id IN (SELECT public.fn_my_workspace_ids())
    )
  );

-- CAMPAIGNS
CREATE POLICY "campaigns_all"
  ON public.campaigns FOR ALL
  USING (workspace_id IN (SELECT public.fn_my_workspace_ids()));

-- GENERATED MESSAGES
CREATE POLICY "generated_messages_all"
  ON public.generated_messages FOR ALL
  USING (
    lead_id IN (
      SELECT id FROM public.leads
      WHERE  workspace_id IN (SELECT public.fn_my_workspace_ids())
    )
  );

-- ACTIVITY LOGS
CREATE POLICY "activity_logs_all"
  ON public.activity_logs FOR ALL
  USING (workspace_id IN (SELECT public.fn_my_workspace_ids()));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_leads_workspace_id          ON public.leads(workspace_id);
CREATE INDEX idx_leads_stage_id              ON public.leads(stage_id);
CREATE INDEX idx_leads_assigned_to           ON public.leads(assigned_to);
CREATE INDEX idx_leads_created_at            ON public.leads(created_at DESC);
CREATE INDEX idx_workspace_members_user_id   ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_funnel_stages_workspace_id  ON public.funnel_stages(workspace_id);
CREATE INDEX idx_campaigns_workspace_id      ON public.campaigns(workspace_id);
CREATE INDEX idx_campaigns_trigger_stage     ON public.campaigns(trigger_stage_id);
CREATE INDEX idx_generated_messages_lead_id  ON public.generated_messages(lead_id);
CREATE INDEX idx_activity_logs_lead_id       ON public.activity_logs(lead_id);
CREATE INDEX idx_activity_logs_workspace_id  ON public.activity_logs(workspace_id);
CREATE INDEX idx_lead_custom_values_lead_id  ON public.lead_custom_values(lead_id);
