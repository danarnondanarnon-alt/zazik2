'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import RepairCard from '@/components/ui/RepairCard';
import { Repair } from '@/lib/types';
import styles from './page.module.css';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const n = sessionStorage.getItem('customer_name') ?? '';
    const p = sessionStorage.getItem('customer_phone') ?? '';
    if (!p) { router.push('/customer/login'); return; }
    setName(n);
    setPhone(p);

    fetch(`/api/repairs?phone=${encodeURIComponent(p)}`)
      .then((r) => r.json())
      .then((data) => { setRepairs(Array.isArray(data) ? data : []); })
      .finally(() => setLoading(false));
  }, [router]);

  const newRepairBtn = (
    <a href="/new-repair" className={styles.newBtn}>+ תיקון</a>
  );

  return (
    <>
      <AppHeader rightSlot={newRepairBtn} />
      <main className={styles.main}>
        <div className={styles.welcome}>
          <p className={styles.hey}>שלום,</p>
          <h1 className={styles.custName}>{name || 'לקוח יקר'}</h1>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>טוען תיקונים...</p>
          </div>
        ) : repairs.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🏄</p>
            <p className={styles.emptyText}>אין תיקונים עדיין</p>
            <a href="/new-repair" className={styles.emptyBtn}>הגישו בקשה ראשונה</a>
          </div>
        ) : (
          <div className="stagger">
            {repairs.map((repair) => (
              <RepairCard
                key={repair.id}
                repair={repair}
                href={`/repair/${repair.id}`}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
