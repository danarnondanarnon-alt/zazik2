'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import MediaGallery from '@/components/ui/MediaGallery';
import { Repair, STATUS_LABELS, BOARD_TYPE_LABELS, DELIVERY_LABELS } from '@/lib/types';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/utils';
import styles from './page.module.css';

const STATUS_STEPS = ['waiting', 'working', 'ready'] as const;

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === '1';

  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');

  useEffect(() => {
    fetch(`/api/repairs/${id}`).then(r => r.json()).then(setRepair).finally(() => setLoading(false));
    fetch('/api/settings').then(r => r.json()).then(s => setPaymentLink(s.payment_link ?? ''));
  }, [id]);

  function getStepIndex(status: string) {
    return STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);
  }

  async function handleCopy() {
    if (!repair) return;
    const msg = buildWhatsAppMessage(repair, window.location.origin);
    await navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    if (!repair?.customer?.phone) return;
    const msg = buildWhatsAppMessage(repair, window.location.origin);
    window.open(buildWhatsAppUrl(repair.customer.phone, msg), '_blank');
  }

  if (loading) return (
    <>
      <AppHeader backHref="/customer/dashboard" />
      <div className={styles.loading}><div className={styles.spinner} /></div>
    </>
  );

  if (!repair) return (
    <>
      <AppHeader backHref="/customer/dashboard" />
      <div className={styles.notFound}>❌ תיקון לא נמצא</div>
    </>
  );

  const currentStep = getStepIndex(repair.status);

  return (
    <>
      <AppHeader title="פרטי תיקון" backHref="/customer/dashboard" />

      {isNew && (
        <div className={styles.successBanner}>
          ✅ הבקשה נשלחה בהצלחה! ניצור איתך קשר בקרוב
        </div>
      )}

      {/* Status bar */}
      <div className={styles.statusBar}>
        <div>
          <div className={styles.statusBarLabel}>סטטוס</div>
          <StatusBadge status={repair.status} large />
        </div>
        {repair.price && (
          <div className={styles.priceBlock}>
            <div className={styles.statusBarLabel}>מחיר</div>
            <div className={styles.priceBig}>₪{Number(repair.price).toLocaleString()}</div>
          </div>
        )}
      </div>

      <main className={styles.main}>
        {/* Progress steps */}
        {repair.status !== 'archived' && (
          <div className={styles.steps}>
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={`${styles.step} ${i <= currentStep ? styles.done : ''}`}>
                <div className={styles.dot}>{i + 1}</div>
                {i < STATUS_STEPS.length - 1 && <div className={styles.line} />}
                <div className={styles.stepLabel}>{STATUS_LABELS[step]}</div>
              </div>
            ))}
          </div>
        )}

        {/* Info card */}
        <div className={styles.card}>
          <div className={styles.infoGrid}>
            <div><div className={styles.infoKey}>גלשן</div><div className={styles.infoVal}>{BOARD_TYPE_LABELS[repair.board_type]}</div></div>
            <div><div className={styles.infoKey}>דחיפות</div><div className={`${styles.infoVal} ${repair.urgency === 'urgent' ? styles.urgent : ''}`}>{repair.urgency === 'urgent' ? 'דחוף' : 'לא דחוף'}</div></div>
            <div><div className={styles.infoKey}>מסירה</div><div className={styles.infoVal}>{repair.delivery_other || DELIVERY_LABELS[repair.delivery_location]}</div></div>
            <div><div className={styles.infoKey}>נשלח</div><div className={styles.infoVal}>{new Date(repair.created_at).toLocaleDateString('he-IL')}</div></div>
          </div>
          <div className={styles.divider} />
          <div className={styles.infoKey}>תיאור</div>
          <div className={styles.desc}>{repair.description}</div>
        </div>

        {/* Media gallery */}
        {repair.media && repair.media.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>תמונות וסרטונים</div>
            <MediaGallery media={repair.media} />
          </div>
        )}

        {/* Payment */}
        {repair.status === 'ready' && paymentLink && (
          <div className={styles.section}>
            <div className={styles.notice}>💳 הגלשן מוכן! ניתן לשלם ולתאם איסוף</div>
            <a href={paymentLink} target="_blank" rel="noopener noreferrer"
              className={styles.payBtn}>
              לתשלום →
            </a>
          </div>
        )}

        {/* WhatsApp */}
        <div className={styles.section}>
          <button className={styles.waBtn} onClick={handleWhatsApp}>
            <WhatsAppIcon /> שלח עדכון בוואטסאפ
          </button>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? '✅ הועתק!' : '📋 העתק הודעה'}
          </button>
        </div>
      </main>
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
