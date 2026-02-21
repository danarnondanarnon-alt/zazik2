-- ============================================================
-- Migration 003 – Verify CASCADE on repair_messages + delete policy
-- Run in Supabase SQL Editor
-- ============================================================

-- Add DELETE policy for repair_status_log (needed for cascade delete to work with RLS)
create policy if not exists "log_delete" on repair_status_log
  for delete using (true);

-- Add DELETE policy for repair_messages (needed for cascade delete to work with RLS)
create policy if not exists "messages_delete" on repair_messages
  for delete using (true);

-- Allow deleting repairs
create policy if not exists "repairs_delete" on repairs
  for delete using (true);

-- Allow deleting customers (only happens if no repairs remain due to cascade)
create policy if not exists "customers_delete" on customers
  for delete using (true);
