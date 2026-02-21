import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { RepairStatus } from '@/lib/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminSupabase();
  const { status, note } = await req.json() as { status: RepairStatus; note?: string };

  // Get current repair
  const { data: current } = await supabase
    .from('repairs')
    .select('status, started_at, ready_at, archived_at')
    .eq('id', params.id)
    .single();

  if (!current) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });

  const updates: Record<string, unknown> = { status };

  // Set timestamps
  if (status === 'working' && !current.started_at) {
    updates.started_at = new Date().toISOString();
  }
  if (status === 'ready' && !current.ready_at) {
    updates.ready_at = new Date().toISOString();
  }
  if (status === 'archived' && !current.archived_at) {
    updates.archived_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('repairs')
    .update(updates)
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log change
  await supabase.from('repair_status_log').insert({
    repair_id: params.id,
    old_status: current.status,
    new_status: status,
    note,
  });

  return NextResponse.json({ ok: true });
}
