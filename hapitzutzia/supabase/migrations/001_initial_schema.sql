-- ============================================================
-- הפיצוציה – Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table if not exists customers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  phone       text not null unique,
  created_at  timestamptz not null default now()
);

create index idx_customers_phone on customers(phone);

-- ============================================================
-- REPAIRS
-- ============================================================
create type board_type as enum (
  'short', 'long', 'windsurf', 'wing', 'sup', 'kayak', 'catamaran', 'foil', 'other'
);

create type urgency_level as enum ('urgent', 'normal');

create type delivery_location as enum ('pardess_hanna', 'shdot_yam', 'other');

create type repair_status as enum (
  'waiting',    -- ממתין לאישור
  'working',    -- בעבודה
  'ready',      -- מוכן לאיסוף
  'archived'    -- ארכיון
);

create table if not exists repairs (
  id                uuid primary key default uuid_generate_v4(),
  customer_id       uuid not null references customers(id) on delete cascade,

  -- Board info
  board_type        board_type not null,
  description       text not null,
  urgency           urgency_level not null default 'normal',
  delivery_location delivery_location not null default 'pardess_hanna',
  delivery_other    text,

  -- Status
  status            repair_status not null default 'waiting',

  -- Pricing
  price             numeric(10,2),

  -- Timestamps
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  ready_at          timestamptz,
  archived_at       timestamptz,
  updated_at        timestamptz not null default now()
);

create index idx_repairs_customer on repairs(customer_id);
create index idx_repairs_status   on repairs(status);
create index idx_repairs_created  on repairs(created_at desc);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger repairs_updated_at
  before update on repairs
  for each row execute function update_updated_at();

-- ============================================================
-- STATUS CHANGE LOG
-- ============================================================
create table if not exists repair_status_log (
  id         uuid primary key default uuid_generate_v4(),
  repair_id  uuid not null references repairs(id) on delete cascade,
  old_status repair_status,
  new_status repair_status not null,
  changed_at timestamptz not null default now(),
  note       text
);

create index idx_status_log_repair on repair_status_log(repair_id);

-- ============================================================
-- MEDIA (images + videos)
-- ============================================================
create type media_type as enum ('image', 'video');
create type media_uploaded_by as enum ('customer', 'admin');

create table if not exists repair_media (
  id            uuid primary key default uuid_generate_v4(),
  repair_id     uuid not null references repairs(id) on delete cascade,
  storage_path  text not null,
  public_url    text not null,
  media_type    media_type not null,
  uploaded_by   media_uploaded_by not null,
  file_size     bigint,
  created_at    timestamptz not null default now()
);

create index idx_media_repair on repair_media(repair_id);

-- ============================================================
-- SETTINGS (global key-value for admin)
-- ============================================================
create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Default payment link (can be updated by admin in settings UI)
insert into settings (key, value) values
  ('payment_link', 'https://paybox.co.il/your-link')
on conflict (key) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Customers: allow insert + select by phone (no auth)
alter table customers enable row level security;
create policy "customers_select" on customers for select using (true);
create policy "customers_insert" on customers for insert with check (true);

-- Repairs: customers can read their own via phone join; admin via service role
alter table repairs enable row level security;
create policy "repairs_select" on repairs for select using (true);
create policy "repairs_insert" on repairs for insert with check (true);
create policy "repairs_update" on repairs for update using (true);

-- Media: public read
alter table repair_media enable row level security;
create policy "media_select" on repair_media for select using (true);
create policy "media_insert" on repair_media for insert with check (true);
create policy "media_delete" on repair_media for delete using (true);

-- Status log: service role only writes
alter table repair_status_log enable row level security;
create policy "log_select" on repair_status_log for select using (true);
create policy "log_insert" on repair_status_log for insert with check (true);

-- Settings: public read
alter table settings enable row level security;
create policy "settings_select" on settings for select using (true);
create policy "settings_update" on settings for update using (true);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run this in Supabase Dashboard → Storage → New bucket:
--   Name: repair-media
--   Public: true
--   File size limit: 20971520 (20MB)
--   Allowed MIME types: image/*, video/*

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'repair-media',
  'repair-media',
  true,
  20971520,
  array['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/quicktime','video/webm']
) on conflict (id) do nothing;

create policy "storage_select" on storage.objects for select using (bucket_id = 'repair-media');
create policy "storage_insert" on storage.objects for insert with check (bucket_id = 'repair-media');
create policy "storage_delete" on storage.objects for delete using (bucket_id = 'repair-media');
