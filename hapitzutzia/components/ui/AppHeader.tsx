'use client';
import { useRouter } from 'next/navigation';
import styles from './AppHeader.module.css';

interface Props {
  title?: string;
  backHref?: string;
  rightSlot?: React.ReactNode;
  dark?: boolean;
}

export default function AppHeader({ title, backHref, rightSlot, dark }: Props) {
  const router = useRouter();

  return (
    <header className={`${styles.header} ${dark ? styles.dark : ''}`}>
      <div className={styles.right}>
        {rightSlot}
      </div>

      <div className={styles.center}>
        {title ? (
          <span className={styles.title}>{title}</span>
        ) : (
          <span className={styles.logo}>
            <span className={styles.logoRed}>הפיצוציה</span>
          </span>
        )}
      </div>

      <div className={styles.left}>
        {backHref ? (
          <button
            className={styles.backBtn}
            onClick={() => router.push(backHref)}
            aria-label="חזרה"
          >
            ←
          </button>
        ) : (
          <div style={{ width: 36 }} />
        )}
      </div>
    </header>
  );
}
