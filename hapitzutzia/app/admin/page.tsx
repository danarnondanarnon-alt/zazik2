'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAdminSession } from '@/lib/admin-auth';
import styles from './page.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError('סיסמה שגויה');
      return;
    }

    setAdminSession();
    router.push('/admin/dashboard');
  }

  return (
    <main className={styles.main}>
      <div className={styles.icon}>🔧</div>
      <h1 className={styles.title}>ממשק מנהל</h1>
      <p className={styles.sub}>הפיצוציה</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={e => setPassword(e.target.value)}
          dir="ltr"
          autoFocus
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.btn} disabled={loading}>
          {loading ? 'מתחבר...' : 'כניסה'}
        </button>
      </form>

      <a href="/" className={styles.back}>← חזרה לדף הבית</a>
    </main>
  );
}
