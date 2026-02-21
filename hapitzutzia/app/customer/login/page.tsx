'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import { validateIsraeliPhone, normalizeIsraeliPhone } from '@/lib/utils';
import styles from './page.module.css';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('נא להזין שם');
    if (!validateIsraeliPhone(phone)) return setError('מספר טלפון לא תקין');

    setLoading(true);
    const normalized = normalizeIsraeliPhone(phone);

    // Store in sessionStorage for dashboard
    sessionStorage.setItem('customer_name', name.trim());
    sessionStorage.setItem('customer_phone', normalized);

    router.push('/customer/dashboard');
  }

  return (
    <>
      <AppHeader backHref="/" />
      <main className={styles.main}>
        <div className={styles.greeting}>
          <h1 className={styles.title}>שלום 👋</h1>
          <p className={styles.sub}>הכניסו שם וטלפון לצפייה בתיקונים שלכם</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>שם מלא</label>
          <input
            className={styles.input}
            type="text"
            placeholder="ישראל ישראלי"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />

          <label className={styles.label}>מספר טלפון</label>
          <input
            className={styles.input}
            type="tel"
            placeholder="050-0000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            inputMode="tel"
          />

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'טוען...' : 'כניסה'}
          </button>
        </form>

        <p className={styles.newRepair}>
          תיקון חדש?{' '}
          <a href="/new-repair" className={styles.link}>הגישו בקשה כאן ←</a>
        </p>
      </main>
    </>
  );
}
