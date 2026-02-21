import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify admin password header to prevent accidental calls
  const auth = req.headers.get('x-admin-auth');
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  const repairId = params.id;

  // 1. Fetch all media storage paths before deleting DB rows
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
      // Log but don't block — storage files may already be gone
      console.error('Storage deletion error:', storageErr.message);
    }
  }

  // 3. Delete the repair row — CASCADE handles:
  //    repair_media, repair_status_log, repair_messages
  const { error: dbErr } = await supabase
    .from('repairs')
    .delete()
    .eq('id', repairId);

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: repairId });
}
