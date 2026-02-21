import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createAdminSupabase();
  const { searchParams } = new URL(req.url);

  const phone    = searchParams.get('phone');
  const status   = searchParams.get('status');
  const search   = searchParams.get('search');
  const dateFrom = searchParams.get('date_from');
  const dateTo   = searchParams.get('date_to');
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  const boardType = searchParams.get('board_type');

  let query = supabase
    .from('repairs')
    .select(`
      *,
      customer:customers(*),
      media:repair_media(*)
    `)
    .order('created_at', { ascending: false });

  // Customer lookup by phone
  if (phone) {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .single();
    if (!customer) return NextResponse.json([]);
    query = query.eq('customer_id', customer.id);
  }

  if (status)    query = query.eq('status', status);
  if (boardType) query = query.eq('board_type', boardType);
  if (dateFrom)  query = query.gte('created_at', dateFrom);
  if (dateTo)    query = query.lte('created_at', dateTo);
  if (priceMin)  query = query.gte('price', Number(priceMin));
  if (priceMax)  query = query.lte('price', Number(priceMax));

  if (search) {
    // Search by name or phone via customers
    const { data: matchedCustomers } = await supabase
      .from('customers')
      .select('id')
      .or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    const ids = matchedCustomers?.map((c) => c.id) ?? [];
    if (ids.length > 0) {
      query = query.in('customer_id', ids);
    } else {
      return NextResponse.json([]);
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createAdminSupabase();
  const body = await req.json();
  const { name, phone, board_type, description, urgency, delivery_location, delivery_other } = body;

  // Upsert customer
  let customer;
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();

  if (existing) {
    customer = existing;
  } else {
    const { data: created, error: cErr } = await supabase
      .from('customers')
      .insert({ name, phone })
      .select()
      .single();
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    customer = created;
  }

  // Create repair
  const { data: repair, error: rErr } = await supabase
    .from('repairs')
    .insert({
      customer_id: customer.id,
      board_type,
      description,
      urgency,
      delivery_location,
      delivery_other: delivery_location === 'other' ? delivery_other : null,
      status: 'waiting',
    })
    .select()
    .single();

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  // Log status creation
  await supabase.from('repair_status_log').insert({
    repair_id: repair.id,
    new_status: 'waiting',
  });

  return NextResponse.json({ repair, customer }, { status: 201 });
}
