import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createAdminSupabase();
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  const search = searchParams.get('search');

  if (phone) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();
    return NextResponse.json(data ?? null);
  }

  if (search) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .or(`phone.ilike.%${search}%,name.ilike.%${search}%`)
      .limit(10);
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json([]);
}
