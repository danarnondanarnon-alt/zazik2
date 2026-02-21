'use client';
import { useState } from 'react';
import Image from 'next/image';
import { RepairMedia } from '@/lib/types';
import styles from './MediaGallery.module.css';

interface Props {
  media: RepairMedia[];
}

export default function MediaGallery({ media }: Props) {
  const [selected, setSelected] = useState<RepairMedia | null>(null);

  if (media.length === 0)
    return <p className={styles.empty}>אין תמונות עדיין</p>;

  return (
    <>
      <div className={styles.grid}>
        {media.map((m) => (
          <button
            key={m.id}
            className={styles.thumb}
            onClick={() => setSelected(m)}
          >
            {m.media_type === 'image' ? (
              <Image
                src={m.public_url}
                alt=""
                fill
                style={{ objectFit: 'cover' }}
                sizes="33vw"
              />
            ) : (
              <div className={styles.videoThumb}>
                <span>▶</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {selected.media_type === 'image' ? (
              <img src={selected.public_url} alt="" className={styles.fullImg} />
            ) : (
              <video src={selected.public_url} controls className={styles.fullImg} />
            )}
            <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
          </div>
        </div>
      )}
    </>
  );
}
