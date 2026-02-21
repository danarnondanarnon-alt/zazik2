-- ============================================================
-- Migration 002 – Repair Messages
-- Run in Supabase SQL Editor
-- ============================================================

create type message_author as enum ('customer', 'admin');

create table if not exists repair_messages (
  id             uuid primary key default uuid_generate_v4(),
  repair_id      uuid not null references repairs(id) on delete cascade,
  author_type    message_author not null,
  text           text not null,
  read_by_admin  boolean not null default false,
  created_at     timestamptz not null default now()
);

create index idx_messages_repair on repair_messages(repair_id);
create index idx_messages_unread on repair_messages(repair_id, read_by_admin)
  where author_type = 'customer' and read_by_admin = false;

-- RLS
alter table repair_messages enable row level security;
create policy "messages_select" on repair_messages for select using (true);
create policy "messages_insert" on repair_messages for insert with check (true);
create policy "messages_update" on repair_messages for update using (true);
