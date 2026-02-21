'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { BOARD_TYPE_LABELS, BoardType } from '@/lib/types';
import styles from './page.module.css';

type Period = 'month' | 'half' | 'year';

interface AnalyticsData {
  totalRepairs: number;
  totalIncome: number;
  avgPrice: number;
  avgDurationDays: number;
  byBoard: Record<string, number>;
  byStatus: Record<string, number>;
}

const PERIODS: { label: string; value: Period }[] = [
  { label: 'חודש נוכחי', value: 'month' },
  { label: 'חצי שנה', value: 'half' },
  { label: 'שנה', value: 'year' },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdminAuthenticated()) { router.replace('/admin'); return; }
  }, [router]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <>
      <AppHeader title="אנליטיקות" backHref="/admin/dashboard" />
      <main className={styles.main}>

        {/* Period selector */}
        <div className={styles.tabs}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              className={`${styles.tab} ${period === p.value ? styles.tabActive : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading || !data ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : (
          <>
            {/* Main stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statNum}>{data.totalRepairs}</div>
                <div className={styles.statLabel}>סה״כ תיקונים</div>
              </div>
              <div className={styles.statBox}>
                <div className={`${styles.statNum} ${styles.small}`}>₪{data.totalIncome.toLocaleString()}</div>
                <div className={styles.statLabel}>סה״כ הכנסות</div>
              </div>
              <div className={styles.statBox}>
                <div className={`${styles.statNum} ${styles.small}`}>₪{data.avgPrice.toLocaleString()}</div>
                <div className={styles.statLabel}>מחיר ממוצע</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>{data.avgDurationDays}</div>
                <div className={styles.statLabel}>ימים ממוצע לתיקון</div>
              </div>
            </div>

            {/* By board type */}
            {Object.keys(data.byBoard).length > 0 && (
              <div className={styles.card}>
                <div className={styles.cardTitle}>לפי סוג גלשן</div>
                {Object.entries(data.byBoard)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const pct = Math.round((count / data.totalRepairs) * 100);
                    return (
                      <div key={type} className={styles.barRow}>
                        <div className={styles.barLabel}>
                          {BOARD_TYPE_LABELS[type as BoardType] ?? type}
                        </div>
                        <div className={styles.barWrap}>
                          <div className={styles.bar} style={{ width: `${pct}%` }} />
                        </div>
                        <div className={styles.barCount}>{count}</div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
