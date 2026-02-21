'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import styles from './page.module.css';

export default function SettingsPage() {
  const router = useRouter();
  const [paymentLink, setPaymentLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) { router.replace('/admin'); return; }
    fetch('/api/settings').then(r => r.json()).then(s => {
      setPaymentLink(s.payment_link ?? '');
    });
  }, [router]);

  async function save() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_link: paymentLink }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <AppHeader title="הגדרות" backHref="/admin/dashboard" />
      <main className={styles.main}>
        <div className={styles.card}>
          <label className={styles.label}>לינק לתשלום (גלובלי)</label>
          <input
            className={styles.input}
            type="url"
            placeholder="https://paybox.co.il/..."
            value={paymentLink}
            onChange={e => setPaymentLink(e.target.value)}
            dir="ltr"
          />
          <p className={styles.hint}>הלינק יופיע ללקוחות שהתיקון שלהם מוכן לאיסוף</p>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saved ? '✅ נשמר!' : saving ? 'שומר...' : 'שמור הגדרות'}
          </button>
        </div>
      </main>
    </>
  );
}
