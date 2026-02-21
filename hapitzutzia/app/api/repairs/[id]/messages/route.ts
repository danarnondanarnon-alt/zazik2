import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from('repair_messages')
    .select('*')
    .eq('repair_id', params.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminSupabase();
  const { text, author_type } = await req.json();

  if (!text?.trim()) return NextResponse.json({ error: 'טקסט חסר' }, { status: 400 });

  const { data, error } = await supabase
    .from('repair_messages')
    .insert({
      repair_id: params.id,
      author_type,
      text: text.trim(),
      read_by_admin: author_type === 'admin', // admin messages are pre-read
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH - mark customer messages as read (admin opens repair)
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminSupabase();
  await supabase
    .from('repair_messages')
    .update({ read_by_admin: true })
    .eq('repair_id', params.id)
    .eq('author_type', 'customer')
    .eq('read_by_admin', false);

  return NextResponse.json({ ok: true });
}
