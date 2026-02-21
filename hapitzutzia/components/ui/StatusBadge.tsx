import { RepairStatus, STATUS_LABELS } from '@/lib/types';
import styles from './StatusBadge.module.css';

interface Props {
  status: RepairStatus;
  large?: boolean;
}

export default function StatusBadge({ status, large }: Props) {
  return (
    <span className={`${styles.badge} ${styles[status]} ${large ? styles.large : ''}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
