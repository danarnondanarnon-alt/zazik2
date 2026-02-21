import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createAdminSupabase();
  const { data } = await supabase.from('settings').select('*');
  const map: Record<string, string> = {};
  data?.forEach((row) => { map[row.key] = row.value; });
  return NextResponse.json(map);
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminSupabase();
  const body = await req.json() as Record<string, string>;

  for (const [key, value] of Object.entries(body)) {
    await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
  }

  return NextResponse.json({ ok: true });
}
