'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import MediaGallery from '@/components/ui/MediaGallery';
import { Repair, STATUS_LABELS, BOARD_TYPE_LABELS, DELIVERY_LABELS } from '@/lib/types';
import styles from './page.module.css';

interface Message {
  id: string;
  author_type: 'customer' | 'admin';
  text: string;
  created_at: string;
}

const STATUS_STEPS = ['waiting', 'working', 'ready'] as const;

export default function RepairDetailPage() {
  const { id }         = useParams<{ id: string }>();
  const searchParams   = useSearchParams();
  const isNew          = searchParams.get('new') === '1';

  const [repair, setRepair]           = useState<Repair | null>(null);
  const [loading, setLoading]         = useState(true);
  const [paymentLink, setPaymentLink] = useState('');
  const [messages, setMessages]       = useState<Message[]>([]);
  const [newMsg, setNewMsg]           = useState('');
  const [sendingMsg, setSendingMsg]   = useState(false);
  const messagesEndRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/repairs/${id}`).then(r => r.json()).then(setRepair).finally(() => setLoading(false));
    fetch('/api/settings').then(r => r.json()).then(s => setPaymentLink(s.payment_link ?? ''));
    loadMessages();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    const data = await fetch(`/api/repairs/${id}/messages`).then(r => r.json());
    setMessages(Array.isArray(data) ? data : []);
  }

  async function sendMessage() {
    if (!newMsg.trim()) return;
    setSendingMsg(true);
    await fetch(`/api/repairs/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newMsg.trim(), author_type: 'customer' }),
    });
    setNewMsg('');
    await loadMessages();
    setSendingMsg(false);
  }

  function getStepIndex(status: string) {
    return STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);
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
            <div><div className={styles.infoKey}>דחיפות</div><div className={`${styles.infoVal} ${repair.urgency === 'urgent' ? styles.urgentText : ''}`}>{repair.urgency === 'urgent' ? 'דחוף' : 'לא דחוף'}</div></div>
            <div><div className={styles.infoKey}>מסירה</div><div className={styles.infoVal}>{repair.delivery_other || DELIVERY_LABELS[repair.delivery_location]}</div></div>
            <div><div className={styles.infoKey}>נשלח</div><div className={styles.infoVal}>{new Date(repair.created_at).toLocaleDateString('he-IL')}</div></div>
          </div>
          <div className={styles.divider} />
          <div className={styles.infoKey}>תיאור</div>
          <div className={styles.desc}>{repair.description}</div>
        </div>

        {/* Media */}
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
            <a href={paymentLink} target="_blank" rel="noopener noreferrer" className={styles.payBtn}>
              לתשלום →
            </a>
          </div>
        )}

        {/* Messages thread */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>הודעות</div>
          <div className={styles.messages}>
            {messages.length === 0 && (
              <p className={styles.noMessages}>אין הודעות עדיין. שלחו שאלה לסדנא 👇</p>
            )}
            {messages.map(m => (
              <div key={m.id}
                className={`${styles.bubble} ${m.author_type === 'customer' ? styles.bubbleCustomer : styles.bubbleAdmin}`}>
                <div className={styles.bubbleText}>{m.text}</div>
                <div className={styles.bubbleTime}>
                  {m.author_type === 'admin' ? '🔧 סדנא · ' : ''}
                  {new Date(m.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  {' '}
                  {new Date(m.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.msgInput}>
            <input
              className={styles.msgField}
              type="text"
              placeholder="כתבו הודעה לסדנא..."
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !sendingMsg && sendMessage()}
            />
            <button
              className={styles.msgSend}
              onClick={sendMessage}
              disabled={sendingMsg || !newMsg.trim()}
            >
              {sendingMsg ? '...' : 'שלח'}
            </button>
          </div>
        </div>

        <div style={{ height: 24 }} />
      </main>
    </>
  );
}
