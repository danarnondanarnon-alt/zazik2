import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminSupabase();

  const { data, error } = await supabase
    .from('repairs')
    .select(`*, customer:customers(*), media:repair_media(*)`)
    .eq('id', params.id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });

  return NextResponse.json(data);
}
