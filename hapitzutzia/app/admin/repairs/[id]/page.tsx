'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import MediaGallery from '@/components/ui/MediaGallery';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { Repair, RepairStatus, STATUS_LABELS, BOARD_TYPE_LABELS, DELIVERY_LABELS } from '@/lib/types';
import { buildWhatsAppMessage, buildWhatsAppUrl, formatPhone } from '@/lib/utils';
import { uploadRepairMedia } from '@/lib/media';
import styles from './page.module.css';

const STATUSES: RepairStatus[] = ['waiting', 'working', 'ready', 'archived'];
const ADMIN_PHONE = '0525950685';

interface Message {
  id: string;
  author_type: 'customer' | 'admin';
  text: string;
  created_at: string;
  read_by_admin: boolean;
}

export default function AdminRepairPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [repair, setRepair]           = useState<Repair | null>(null);
  const [loading, setLoading]         = useState(true);
  const [price, setPrice]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [saved, setSaved]             = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [newMsg, setNewMsg]           = useState('');
  const [sendingMsg, setSendingMsg]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm]     = useState('');
  const [deleting, setDeleting]               = useState(false);
  const mediaRef                      = useRef<HTMLInputElement>(null);
  const messagesEndRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) { router.replace('/admin'); return; }
    loadRepair();
    loadMessages();
  }, [id, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadRepair() {
    setLoading(true);
    const data = await fetch(`/api/repairs/${id}`).then(r => r.json());
    setRepair(data);
    setPrice(data.price?.toString() ?? '');
    setLoading(false);
  }

  async function loadMessages() {
    // Mark customer messages as read when admin opens
    await fetch(`/api/repairs/${id}/messages`, { method: 'PATCH' });
    const data = await fetch(`/api/repairs/${id}/messages`).then(r => r.json());
    setMessages(Array.isArray(data) ? data : []);
  }

  async function sendAdminMessage() {
    if (!newMsg.trim()) return;
    setSendingMsg(true);
    await fetch(`/api/repairs/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newMsg.trim(), author_type: 'admin' }),
    });
    setNewMsg('');
    await loadMessages();
    setSendingMsg(false);
  }

  async function updateStatus(status: RepairStatus) {
    setSaving(true);
    await fetch(`/api/repairs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadRepair();
    setSaving(false);
  }

  async function savePrice() {
    setSaving(true);
    await fetch(`/api/repairs/${id}/price`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: Number(price) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await loadRepair();
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    e.target.value = '';
    setUploadLoading(true);
    const images = incoming.filter(f => f.type.startsWith('image/'));
    const videos = incoming.filter(f => f.type.startsWith('video/'));
    const uploaded = await uploadRepairMedia(id, images, videos, 'admin');
    if (uploaded.length > 0) {
      await fetch(`/api/repairs/${id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaItems: uploaded }),
      });
      await loadRepair();
    }
    setUploadLoading(false);
  }

  async function handleDelete() {
    if (deleteConfirm !== 'מחק') return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/repairs/${id}/delete`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('שגיאה במחיקה');
      router.push('/admin/dashboard?deleted=1');
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
      alert('שגיאה במחיקה. נסו שוב.');
    }
  }

  function handleWhatsApp() {
    if (!repair) return;
    const msg = buildWhatsAppMessage(repair, window.location.origin);
    // Send to admin's own number (for manual forwarding workflow)
    window.open(buildWhatsAppUrl(ADMIN_PHONE, msg), '_blank');
  }

  async function handleCopyMsg() {
    if (!repair) return;
    const msg = buildWhatsAppMessage(repair, window.location.origin);
    await navigator.clipboard.writeText(msg);
  }

  if (loading) return (
    <>
      <AppHeader title="עריכת תיקון" backHref="/admin/dashboard" />
      <div className={styles.loading}><div className={styles.spinner} /></div>
    </>
  );
  if (!repair) return null;

  return (
    <>
      <AppHeader title="עריכת תיקון" backHref="/admin/dashboard" />
      <main className={styles.main}>

        {/* Customer info */}
        <div className={styles.customerCard}>
          <div>
            <div className={styles.custName}>{repair.customer?.name}</div>
            <a href={`tel:${repair.customer?.phone}`} className={styles.custPhone}>
              📞 {formatPhone(repair.customer?.phone ?? '')}
            </a>
          </div>
          <div className={styles.custRight}>
            <div className={styles.infoKey}>גלשן</div>
            <div className={styles.infoVal}>{BOARD_TYPE_LABELS[repair.board_type]}</div>
          </div>
        </div>

        <div className={styles.descBox}>{repair.description}</div>

        {/* Status */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>שינוי סטטוס</div>
          <div className={styles.statusPills}>
            {STATUSES.map(s => (
              <button key={s}
                className={`${styles.pill} ${repair.status === s ? styles.pillActive : ''}`}
                onClick={() => updateStatus(s)} disabled={saving}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>מחיר תיקון</div>
          <div className={styles.priceRow}>
            <span className={styles.shekel}>₪</span>
            <input className={styles.priceInput} type="number" min="0" step="10"
              value={price} onChange={e => setPrice(e.target.value)}
              inputMode="numeric" dir="ltr" placeholder="0" />
            <button className={styles.saveBtn} onClick={savePrice} disabled={saving}>
              {saved ? '✅' : 'שמור'}
            </button>
          </div>
        </div>

        {/* Media */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>תמונות וסרטונים</div>
          {repair.media && <MediaGallery media={repair.media} />}
          <button className={styles.uploadBtn}
            onClick={() => mediaRef.current?.click()} disabled={uploadLoading}>
            📎 {uploadLoading ? 'מעלה...' : 'הוסיפו תמונות / סרטונים'}
          </button>
          <input ref={mediaRef} type="file" accept="image/*,video/*" multiple hidden
            onChange={handleMediaUpload} />
        </div>

        {/* Details */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>פרטים</div>
          <div className={styles.detailsGrid}>
            <div><div className={styles.infoKey}>מסירה</div><div className={styles.infoVal}>{repair.delivery_other || DELIVERY_LABELS[repair.delivery_location]}</div></div>
            <div><div className={styles.infoKey}>דחיפות</div><div className={styles.infoVal}>{repair.urgency === 'urgent' ? '🔴 דחוף' : '🟢 רגיל'}</div></div>
            <div><div className={styles.infoKey}>נפתח</div><div className={styles.infoVal}>{new Date(repair.created_at).toLocaleDateString('he-IL')}</div></div>
            {repair.started_at && <div><div className={styles.infoKey}>התחיל</div><div className={styles.infoVal}>{new Date(repair.started_at).toLocaleDateString('he-IL')}</div></div>}
            {repair.ready_at && <div><div className={styles.infoKey}>הושלם</div><div className={styles.infoVal}>{new Date(repair.ready_at).toLocaleDateString('he-IL')}</div></div>}
          </div>
        </div>

        {/* Messages */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>הודעות</div>
          <div className={styles.messages}>
            {messages.length === 0 && <p className={styles.noMessages}>אין הודעות</p>}
            {messages.map(m => (
              <div key={m.id}
                className={`${styles.bubble} ${m.author_type === 'admin' ? styles.bubbleAdmin : styles.bubbleCustomer}`}>
                <div className={styles.bubbleText}>{m.text}</div>
                <div className={styles.bubbleTime}>
                  {m.author_type === 'customer' ? '👤 לקוח · ' : '🔧 סדנא · '}
                  {new Date(m.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  {' '}
                  {new Date(m.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.msgInput}>
            <input className={styles.msgField} type="text"
              placeholder="כתבו תשובה ללקוח..." value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !sendingMsg && sendAdminMessage()} />
            <button className={styles.msgSend}
              onClick={sendAdminMessage} disabled={sendingMsg || !newMsg.trim()}>
              {sendingMsg ? '...' : 'שלח'}
            </button>
          </div>
        </div>

        {/* WhatsApp */}
        <button className={styles.waBtn} onClick={handleWhatsApp}>
          <WhatsAppIcon /> שלח עדכון בוואטסאפ
        </button>
        <button className={styles.copyBtn} onClick={handleCopyMsg}>
          📋 העתק הודעה
        </button>

        {/* Danger zone */}
        <div className={styles.dangerZone}>
          <button className={styles.deleteBtn} onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); }}>
            🗑 מחק תיקון לצמיתות
          </button>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className={styles.modalOverlay} onClick={() => !deleting && setShowDeleteModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalIcon}>⚠️</div>
              <h2 className={styles.modalTitle}>מחיקה לצמיתות</h2>
              <p className={styles.modalText}>
                פעולה זו תמחק את התיקון של <strong>{repair?.customer?.name}</strong> לחלוטין —
                כולל תמונות, הודעות ולוג סטטוסים. לא ניתן לשחזר.
              </p>
              <p className={styles.modalPrompt}>כתבו <strong>מחק</strong> לאישור:</p>
              <input
                className={styles.confirmInput}
                type="text"
                placeholder="מחק"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                autoFocus
                dir="rtl"
              />
              <div className={styles.modalActions}>
                <button
                  className={styles.confirmDeleteBtn}
                  onClick={handleDelete}
                  disabled={deleteConfirm !== 'מחק' || deleting}
                >
                  {deleting ? 'מוחק...' : 'מחק לצמיתות'}
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />
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
