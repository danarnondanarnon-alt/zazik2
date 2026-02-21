import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminSupabase();
  const { mediaItems } = await req.json() as {
    mediaItems: { path: string; url: string; type: 'image' | 'video' }[];
  };

  const rows = mediaItems.map((m) => ({
    repair_id: params.id,
    storage_path: m.path,
    public_url: m.url,
    media_type: m.type,
    uploaded_by: 'admin' as const,
  }));

  const { error } = await supabase.from('repair_media').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminSupabase();
  const { mediaId, storagePath } = await req.json();

  // Delete from storage
  await supabase.storage.from('repair-media').remove([storagePath]);

  // Delete DB row
  const { error } = await supabase
    .from('repair_media')
    .delete()
    .eq('id', mediaId)
    .eq('repair_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
