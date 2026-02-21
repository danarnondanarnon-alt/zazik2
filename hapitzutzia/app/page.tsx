'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/ui/AppHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/admin-auth';
import { Repair, RepairStatus, BOARD_TYPE_LABELS } from '@/lib/types';
import styles from './page.module.css';

const STATUS_FILTERS: { label: string; value: RepairStatus | 'all' }[] = [
  { label: 'הכל', value: 'all' },
  { label: 'ממתין', value: 'waiting' },
  { label: 'בעבודה', value: 'working' },
  { label: 'מוכן', value: 'ready' },
  { label: 'ארכיון', value: 'archived' },
];

interface Stats {
  totalRepairs: number;
  totalIncome: number;
  byStatus: Record<string, number>;
}

interface RepairWithUnread extends Repair {
  unread_count?: number;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, direction: 'rtl' }}>טוען...</div>}>
      <AdminDashboardInner />
    </Suspense>
  );
}

function AdminDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [repairs, setRepairs] = useState<RepairWithUnread[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'all'>('all');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace('/admin');
      return;
    }

    fetch('/api/analytics')
      .then(r => r.json())
      .then(setStats);

    loadData();

    if (searchParams.get('deleted') === '1') {
      setToast('✅ התיקון נמחק לצמיתות');
      setTimeout(() => setToast(''), 3500);
      router.replace('/admin/dashboard');
    }
  }, [router, searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    const data: Repair[] = await fetch(`/api/repairs?${params}`)
      .then(r => r.json());

    const repairList = Array.isArray(data) ? data : [];

    const withUnread = await Promise.all(
      repairList.map(async (r) => {
        try {
          const msgs = await fetch(`/api/repairs/${r.id}/messages`)
            .then(res => res.json());

          const unread = Array.isArray(msgs)
            ? msgs.filter((m: { author_type: string; read_by_admin: boolean }) =>
                m.author_type === 'customer' && !m.read_by_admin
              ).length
            : 0;

          return { ...r, unread_count: unread };
        } catch {
          return { ...r, unread_count: 0 };
        }
      })
    );

    setRepairs(withUnread);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(loadData, 300);
    return () => clearTimeout(t);
  }, [loadData]);

  function logout() {
    clearAdminSession();
    router.push('/admin');
  }

  const agingCount = repairs.filter(r => {
    if (r.status !== 'working' || !r.started_at) return false;
    return Math.floor(
      (Date.now() - new Date(r.started_at).getTime()) / 86400000
    ) > 14;
  }).length;

  const logoutBtn = (
    <button onClick={logout} className={styles.logoutBtn} title="יציאה">
      ✕
    </button>
  );

  const newBtn = (
    <Link href="/admin/new-repair" className={styles.newBtn}>
      + תיקון
    </Link>
  );

  return (
    <>
      {toast && <div className={styles.toast}>{toast}</div>}

      <AppHeader title="לוח בקרה" rightSlot={logoutBtn} />

      <main className={styles.main}>

        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statNum}>{stats.totalRepairs}</div>
              <div className={styles.statLabel}>תיקונים החודש</div>
            </div>

            <div className={styles.statBox}>
              <div className={`${styles.statNum} ${styles.income}`}>
                ₪{(stats.totalIncome ?? 0).toLocaleString()}
              </div>
              <div className={styles.statLabel}>הכנסה החודש</div>
            </div>

            <div className={styles.statBox}>
              <div className={`${styles.statNum} ${styles.blue}`}>
                {stats.byStatus?.working ?? 0}
              </div>
              <div className={styles.statLabel}>בעבודה</div>
            </div>

            <div className={styles.statBox}>
              <div className={`${styles.statNum} ${styles.green}`}>
                {stats.byStatus?.ready ?? 0}
              </div>
              <div className={styles.statLabel}>מוכן לאיסוף</div>
            </div>

            {agingCount > 0 && (
              <div className={`${styles.statBox} ${styles.fullWidth}`}>
                <div className={`${styles.statNum} ${styles.warn}`}>
                  {agingCount}
                </div>
                <div className={styles.statLabel}>
                  ⚠️ מעל 14 יום בעבודה
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.quickLinks}>
          {newBtn}
          <Link href="/admin/analytics" className={styles.ql}>📊 אנליטיקות</Link>
          <Link href="/admin/settings" className={styles.ql}>⚙️ הגדרות</Link>
        </div>

        <input
          className={styles.search}
          type="search"
          placeholder="חפשו שם או טלפון..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className={styles.chips}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              className={`${styles.chip} ${
                statusFilter === f.value ? styles.chipActive : ''
              }`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : repairs.length === 0 ? (
          <div className={styles.empty}>אין תיקונים</div>
        ) : (
          <div>
            {repairs.map(repair => {
              const daysInWork =
                repair.status === 'working' && repair.started_at
                  ? Math.floor(
                      (Date.now() -
                        new Date(repair.started_at).getTime()) /
                        86400000
                    )
                  : 0;

              const isAging = daysInWork > 14;

              return (
                <Link
                  key={repair.id}
                  href={`/admin/repairs/${repair.id}`}
                  className={`${styles.repairCard} ${
                    isAging ? styles.aging : ''
                  }`}
                >
                  <div className={styles.rcTop}>
                    <div>
                      <div className={styles.rcTitle}>
                        {repair.customer?.name} ·{' '}
                        {BOARD_TYPE_LABELS[repair.board_type]}

                        {(repair.unread_count ?? 0) > 0 && (
                          <span className={styles.unreadBadge}>
                            💬 {repair.unread_count}
                          </span>
                        )}
                      </div>

                      <div className={styles.rcSub}>
                        {repair.customer?.phone}
                        {isAging && (
                          <span className={styles.agingWarn}>
                            {' '}· ⚠️ {daysInWork} ימים
                          </span>
                        )}
                      </div>
                    </div>

                    <StatusBadge status={repair.status} />
                  </div>

                  <div className={styles.rcBottom}>
                    <span className={styles.rcDesc}>
                      {repair.description.slice(0, 55)}
                      {repair.description.length > 55 ? '…' : ''}
                    </span>

                    {repair.price ? (
                      <span className={styles.rcPrice}>
                        ₪{Number(repair.price).toLocaleString()}
                      </span>
                    ) : (
                      <span className={styles.rcNoPrice}>
                        טרם תומחר
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ height: 24 }} />
      </main>
    </>
  );
}
