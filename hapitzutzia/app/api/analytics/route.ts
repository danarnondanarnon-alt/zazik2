import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createAdminSupabase();
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') ?? 'month'; // month | half | year

  const now = new Date();
  let dateFrom: Date;

  if (period === 'half') {
    dateFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  } else if (period === 'year') {
    dateFrom = new Date(now.getFullYear(), 0, 1);
  } else {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const { data: repairs } = await supabase
    .from('repairs')
    .select('id, status, price, board_type, created_at, ready_at')
    .gte('created_at', dateFrom.toISOString());

  if (!repairs) return NextResponse.json({});

  const totalRepairs = repairs.length;
  const completedRepairs = repairs.filter((r) => r.ready_at);

  const totalIncome = repairs
    .filter((r) => r.price)
    .reduce((sum, r) => sum + Number(r.price), 0);

  const avgPrice = completedRepairs.length > 0
    ? totalIncome / completedRepairs.filter((r) => r.price).length
    : 0;

  // Duration in hours
  const durations = completedRepairs
    .filter((r) => r.ready_at)
    .map((r) =>
      (new Date(r.ready_at!).getTime() - new Date(r.created_at).getTime()) / 3600000
    );
  const avgDurationHours =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  // By board type
  const byBoard: Record<string, number> = {};
  repairs.forEach((r) => {
    byBoard[r.board_type] = (byBoard[r.board_type] ?? 0) + 1;
  });

  // By status
  const byStatus: Record<string, number> = {};
  repairs.forEach((r) => {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  });

  return NextResponse.json({
    totalRepairs,
    totalIncome,
    avgPrice: Math.round(avgPrice),
    avgDurationDays: Math.round(avgDurationHours / 24),
    byBoard,
    byStatus,
    period,
    dateFrom: dateFrom.toISOString(),
  });
}
