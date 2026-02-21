'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import RepairCard from '@/components/ui/RepairCard';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/admin-auth';
import { Repair, RepairStatus, BOARD_TYPE_LABELS, BoardType } from '@/lib/types';
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'all'>('all');

  useEffect(() => {
    if (!isAdminAuthenticated()) { router.replace('/admin'); return; }
    loadData();
    fetch('/api/analytics').then(r => r.json()).then(setStats);
  }, [router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    const data = await fetch(`/api/repairs?${params}`).then(r => r.json());
    setRepairs(Array.isArray(data) ? data : []);
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

  const logoutBtn = (
    <button onClick={logout} className={styles.logoutBtn} title="יציאה">✕</button>
  );

  const agingCount = repairs.filter(r => {
    if (r.status !== 'working' || !r.started_at) return false;
    return Math.floor((Date.now() - new Date(r.started_at).getTime()) / 86400000) > 14;
  }).length;

  return (
    <>
      <AppHeader title="לוח בקרה" rightSlot={logoutBtn} />
      <main className={styles.main}>

        {/* Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statNum}>{stats.totalRepairs}</div>
              <div className={styles.statLabel}>תיקונים החודש</div>
            </div>
            <div className={styles.statBox}>
              <div className={`${styles.statNum} ${styles.income}`}>
                ₪{stats.totalIncome.toLocaleString()}
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
                <div className={`${styles.statNum} ${styles.warn}`}>{agingCount}</div>
                <div className={styles.statLabel}>⚠️ מעל 14 יום בעבודה</div>
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className={styles.quickLinks}>
          <a href="/admin/analytics" className={styles.ql}>📊 אנליטיקות</a>
          <a href="/admin/settings" className={styles.ql}>⚙️ הגדרות</a>
        </div>

        {/* Search */}
        <input
          className={styles.search}
          type="search"
          placeholder="חפשו שם או טלפון..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Status filter chips */}
        <div className={styles.chips}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              className={`${styles.chip} ${statusFilter === f.value ? styles.chipActive : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Repair list */}
        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : repairs.length === 0 ? (
          <div className={styles.empty}>אין תיקונים</div>
        ) : (
          <div className="stagger">
            {repairs.map(repair => (
              <RepairCard
                key={repair.id}
                repair={repair}
                href={`/admin/repairs/${repair.id}`}
                showAging
              />
            ))}
          </div>
        )}
        <div style={{ height: 24 }} />
      </main>
    </>
  );
}
