import Link from 'next/link';
import { Repair, BOARD_TYPE_LABELS } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import styles from './RepairCard.module.css';

interface Props {
  repair: Repair;
  href: string;
  showAging?: boolean;
}

export default function RepairCard({ repair, href, showAging }: Props) {
  const daysInWork =
    repair.status === 'working' && repair.started_at
      ? Math.floor(
          (Date.now() - new Date(repair.started_at).getTime()) / 86400000
        )
      : 0;

  const isAging = showAging && daysInWork > 14;

  const timeAgo = formatDistanceToNow(new Date(repair.created_at), {
    addSuffix: true,
    locale: he,
  });

  return (
    <Link href={href} className={`${styles.card} ${isAging ? styles.aging : ''} animate-fade-up`}>
      <div className={styles.top}>
        <div className={styles.info}>
          <div className={styles.title}>
            {repair.customer?.name ?? '—'} · {BOARD_TYPE_LABELS[repair.board_type]}
          </div>
          <div className={styles.sub}>{timeAgo}</div>
          {isAging && (
            <div className={styles.agingWarn}>⚠️ {daysInWork} ימים בעבודה</div>
          )}
        </div>
        <StatusBadge status={repair.status} />
      </div>

      <div className={styles.bottom}>
        <span className={styles.desc}>{repair.description.slice(0, 60)}{repair.description.length > 60 ? '…' : ''}</span>
        {repair.price ? (
          <span className={styles.price}>₪{Number(repair.price).toLocaleString()}</span>
        ) : (
          <span className={styles.noPrice}>טרם תומחר</span>
        )}
      </div>
    </Link>
  );
}
