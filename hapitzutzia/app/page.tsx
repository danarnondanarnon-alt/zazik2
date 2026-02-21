'use client';
import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      <div className={styles.hero}>
        <h1 className={styles.logo}>הפיצוציה 🏄</h1>
        <p className={styles.sub}>סדנת תיקון גלשנים</p>
        <div className={styles.divider} />
        <p className={styles.tagline}>שלחו גלשן,<br />קבלו אותו חזרה חדש</p>
      </div>

      <div className={styles.actions}>
        <Link href="/customer/login" className={`${styles.btn} ${styles.btnPrimary}`}>
          כניסת לקוח
        </Link>
        <Link href="/admin" className={`${styles.btn} ${styles.btnOutline}`}>
          כניסת מנהל 🔧
        </Link>
      </div>

      <p className={styles.footer}>פרדס חנה | חוף שדות ים</p>
    </main>
  );
}
