'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { uploadRepairMedia, validateFiles } from '@/lib/media';
import { BOARD_TYPE_LABELS, BoardType, UrgencyLevel, DeliveryLocation } from '@/lib/types';
import { validateIsraeliPhone, normalizeIsraeliPhone } from '@/lib/utils';
import styles from './page.module.css';

const BOARD_TYPES = Object.entries(BOARD_TYPE_LABELS) as [BoardType, string][];

export default function AdminNewRepairPage() {
  const router = useRouter();

  const [phone, setPhone]           = useState('');
  const [name, setName]             = useState('');
  const [existingCustomer, setExistingCustomer] = useState<{ id: string; name: string } | null>(null);
  const [lookingUp, setLookingUp]   = useState(false);
  const [boardType, setBoardType]   = useState<BoardType | ''>('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency]       = useState<UrgencyLevel>('normal');
  const [delivery, setDelivery]     = useState<DeliveryLocation>('pardess_hanna');
  const [deliveryOther, setDeliveryOther] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const mediaRef                    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) router.replace('/admin');
  }, [router]);

  const lookupCustomer = useCallback(async (rawPhone: string) => {
    const normalized = normalizeIsraeliPhone(rawPhone);
    if (normalized.length < 9) { setExistingCustomer(null); return; }
    setLookingUp(true);
    const data = await fetch(`/api/customers?phone=${encodeURIComponent(normalized)}`).then(r => r.json());
    if (data && data.id) {
      setExistingCustomer(data);
      setName(data.name);
    } else {
      setExistingCustomer(null);
    }
    setLookingUp(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (phone) lookupCustomer(phone); }, 500);
    return () => clearTimeout(t);
  }, [phone, lookupCustomer]);

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    const images   = mediaFiles.filter(f => f.type.startsWith('image/'));
    const videos   = mediaFiles.filter(f => f.type.startsWith('video/'));
    const newImgs  = incoming.filter(f => f.type.startsWith('image/'));
    const newVids  = incoming.filter(f => f.type.startsWith('video/'));
    setMediaFiles([...images, ...newImgs].slice(0, 10).concat([...videos, ...newVids].slice(0, 2)));
    e.target.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateIsraeliPhone(phone)) return setError('מספר טלפון לא תקין');
    if (!name.trim())        return setError('נא להזין שם לקוח');
    if (!boardType)          return setError('נא לבחור סוג גלשן');
    if (!description.trim()) return setError('נא לתאר את התיקון');

    const images = mediaFiles.filter(f => f.type.startsWith('image/'));
    const videos = mediaFiles.filter(f => f.type.startsWith('video/'));
    const mediaErr = validateFiles(images, videos);
    if (mediaErr) return setError(mediaErr);

    setLoading(true);
    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: normalizeIsraeliPhone(phone),
          board_type: boardType,
          description: description.trim(),
          urgency,
          delivery_location: delivery,
          delivery_other: deliveryOther,
        }),
      });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg ?? 'שגיאה'); }
      const { repair } = await res.json();

      if (mediaFiles.length > 0) {
        const uploaded = await uploadRepairMedia(repair.id, images, videos, 'admin');
        if (uploaded.length > 0) {
          await fetch(`/api/repairs/${repair.id}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaItems: uploaded }),
          });
        }
      }

      router.push(`/admin/repairs/${repair.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
    } finally {
      setLoading(false);
    }
  }

  const imgCount = mediaFiles.filter(f => f.type.startsWith('image/')).length;
  const vidCount = mediaFiles.filter(f => f.type.startsWith('video/')).length;

  return (
    <>
      <AppHeader title="תיקון חדש" backHref="/admin/dashboard" />
      <main className={styles.main}>
        <form onSubmit={handleSubmit}>

          <label className={styles.label}>טלפון לקוח</label>
          <div className={styles.phoneRow}>
            <input
              className={styles.input}
              type="tel" placeholder="050-0000000" dir="ltr" inputMode="tel"
              value={phone} onChange={e => setPhone(e.target.value)}
            />
            {lookingUp && <span className={styles.lookupSpinner} />}
          </div>
          {existingCustomer && (
            <div className={styles.customerFound}>
              ✅ לקוח קיים: <strong>{existingCustomer.name}</strong>
            </div>
          )}
          {phone && !lookingUp && !existingCustomer && normalizeIsraeliPhone(phone).length >= 9 && (
            <div className={styles.customerNew}>➕ לקוח חדש יווצר</div>
          )}

          <label className={styles.label}>שם לקוח</label>
          <input className={styles.input} type="text" placeholder="ישראל ישראלי"
            value={name} onChange={e => setName(e.target.value)} />

          <label className={styles.label}>סוג גלשן</label>
          <select className={styles.input} value={boardType}
            onChange={e => setBoardType(e.target.value as BoardType)}>
            <option value="">בחרו סוג גלשן...</option>
            {BOARD_TYPES.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <label className={styles.label}>תיאור התיקון</label>
          <textarea className={styles.textarea} placeholder="תיאור הנזק..."
            value={description} onChange={e => setDescription(e.target.value)} />

          <label className={styles.label}>רמת דחיפות</label>
          <div className={styles.urgencyRow}>
            <button type="button"
              className={`${styles.urgencyBtn} ${urgency === 'urgent' ? styles.urgent : ''}`}
              onClick={() => setUrgency('urgent')}>🔴 דחוף</button>
            <button type="button"
              className={`${styles.urgencyBtn} ${urgency === 'normal' ? styles.normal : ''}`}
              onClick={() => setUrgency('normal')}>🟢 לא דחוף</button>
          </div>

          <label className={styles.label}>מיקום מסירה</label>
          <select className={styles.input} value={delivery}
            onChange={e => setDelivery(e.target.value as DeliveryLocation)}>
            <option value="pardess_hanna">סדנא בפרדס חנה</option>
            <option value="shdot_yam">חוף שדות ים</option>
            <option value="other">אחר</option>
          </select>
          {delivery === 'other' && (
            <input className={styles.input} type="text" placeholder="פרטי המיקום..."
              value={deliveryOther} onChange={e => setDeliveryOther(e.target.value)} />
          )}

          <label className={styles.label}>תמונות וסרטונים</label>
          <button type="button" className={styles.uploadBtn}
            onClick={() => mediaRef.current?.click()}>
            📎 {mediaFiles.length > 0
              ? [imgCount > 0 && `${imgCount} תמונות`, vidCount > 0 && `${vidCount} סרטונים`].filter(Boolean).join(' + ')
              : 'הוסיפו תמונות / סרטונים'}
          </button>
          <input ref={mediaRef} type="file" accept="image/*,video/*" multiple hidden
            onChange={handleMediaChange} />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'יוצר תיקון...' : 'צור תיקון →'}
          </button>
        </form>
        <div style={{ height: 32 }} />
      </main>
    </>
  );
}
