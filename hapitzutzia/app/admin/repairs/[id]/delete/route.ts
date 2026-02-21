import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminSupabase();
  const repairId = params.id;

  // Verify the repair exists first
  const { data: repair } = await supabase
    .from('repairs')
    .select('id')
    .eq('id', repairId)
    .single();

  if (!repair) {
    return NextResponse.json({ error: 'תיקון לא נמצא' }, { status: 404 });
  }

  // 1. Fetch all media storage paths BEFORE deleting DB rows
  const { data: mediaRows } = await supabase
    .from('repair_media')
    .select('storage_path')
    .eq('repair_id', repairId);

  // 2. Delete files from Supabase Storage
  if (mediaRows && mediaRows.length > 0) {
    const paths = mediaRows.map((m) => m.storage_path);
    const { error: storageErr } = await supabase.storage
      .from('repair-media')
      .remove(paths);

    if (storageErr) {
      // Non-fatal: log but continue — orphaned storage files are acceptable
      console.error('Storage deletion partial error:', storageErr.message);
    }
  }

  // 3. Delete repair row — ON DELETE CASCADE handles:
  //    - repair_media rows
  //    - repair_status_log rows  
  //    - repair_messages rows
  const { error: dbErr } = await supabase
    .from('repairs')
    .delete()
    .eq('id', repairId);

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: repairId });
}
