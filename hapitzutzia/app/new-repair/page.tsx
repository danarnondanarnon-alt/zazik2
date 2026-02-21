'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import { validateIsraeliPhone, normalizeIsraeliPhone } from '@/lib/utils';
import { uploadRepairMedia, validateFiles } from '@/lib/media';
import { BOARD_TYPE_LABELS, BoardType, UrgencyLevel, DeliveryLocation } from '@/lib/types';
import styles from './page.module.css';

const BOARD_TYPES = Object.entries(BOARD_TYPE_LABELS) as [BoardType, string][];

export default function NewRepairPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [boardType, setBoardType] = useState<BoardType | ''>('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');
  const [delivery, setDelivery] = useState<DeliveryLocation>('pardess_hanna');
  const [deliveryOther, setDeliveryOther] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const total = [...images, ...files].slice(0, 10);
    setImages(total);
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const total = [...videos, ...files].slice(0, 2);
    setVideos(total);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('נא להזין שם');
    if (!validateIsraeliPhone(phone)) return setError('מספר טלפון לא תקין');
    if (!boardType) return setError('נא לבחור סוג גלשן');
    if (!description.trim()) return setError('נא לתאר את התיקון');

    const mediaErr = validateFiles(images, videos);
    if (mediaErr) return setError(mediaErr);

    setLoading(true);
    try {
      // Create repair
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

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? 'שגיאה בשמירה');
      }

      const { repair } = await res.json();

      // Upload media
      if (images.length + videos.length > 0) {
        const uploaded = await uploadRepairMedia(repair.id, images, videos, 'customer');
        if (uploaded.length > 0) {
          await fetch(`/api/repairs/${repair.id}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaItems: uploaded }),
          });
        }
      }

      // Save session
      sessionStorage.setItem('customer_name', name.trim());
      sessionStorage.setItem('customer_phone', normalizeIsraeliPhone(phone));

      router.push(`/repair/${repair.id}?new=1`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppHeader title="בקשת תיקון חדשה" backHref="/customer/login" />
      <main className={styles.main}>
        <form onSubmit={handleSubmit}>

          <label className={styles.label}>שם מלא</label>
          <input className={styles.input} type="text" placeholder="ישראל ישראלי"
            value={name} onChange={e => setName(e.target.value)} />

          <label className={styles.label}>טלפון</label>
          <input className={styles.input} type="tel" placeholder="050-0000000"
            dir="ltr" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} />

          <label className={styles.label}>סוג גלשן</label>
          <select className={styles.input} value={boardType}
            onChange={e => setBoardType(e.target.value as BoardType)}>
            <option value="">בחרו סוג גלשן...</option>
            {BOARD_TYPES.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <label className={styles.label}>תיאור התיקון</label>
          <textarea className={styles.textarea} placeholder="תארו את הנזק..."
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

          <label className={styles.label}>תמונות (עד 10)</label>
          <button type="button" className={styles.uploadBtn}
            onClick={() => imgRef.current?.click()}>
            📸 {images.length > 0 ? `${images.length} תמונות נבחרו` : 'הוסיפו תמונות'}
          </button>
          <input ref={imgRef} type="file" accept="image/*" multiple hidden
            onChange={handleImageChange} />

          <label className={styles.label}>סרטונים קצרים (עד 2)</label>
          <button type="button" className={styles.uploadBtn}
            onClick={() => vidRef.current?.click()}>
            🎥 {videos.length > 0 ? `${videos.length} סרטונים נבחרו` : 'הוסיפו סרטונים'}
          </button>
          <input ref={vidRef} type="file" accept="video/*" multiple hidden
            onChange={handleVideoChange} />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'שולח...' : 'שלח בקשת תיקון →'}
          </button>
        </form>
        <div style={{ height: 32 }} />
      </main>
    </>
  );
}
