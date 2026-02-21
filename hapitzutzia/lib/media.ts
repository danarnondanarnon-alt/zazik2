import imageCompression from 'browser-image-compression';
import { createClient } from './supabase';

const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 20;
const MAX_IMAGES = 10;
const MAX_VIDEOS = 2;

export function validateFiles(images: File[], videos: File[]): string | null {
  if (images.length > MAX_IMAGES)
    return `ניתן להעלות עד ${MAX_IMAGES} תמונות`;
  if (videos.length > MAX_VIDEOS)
    return `ניתן להעלות עד ${MAX_VIDEOS} סרטונים`;

  for (const img of images) {
    if (img.size > MAX_IMAGE_MB * 1024 * 1024)
      return `גודל תמונה מקסימלי ${MAX_IMAGE_MB}MB`;
  }
  for (const vid of videos) {
    if (vid.size > MAX_VIDEO_MB * 1024 * 1024)
      return `גודל סרטון מקסימלי ${MAX_VIDEO_MB}MB`;
  }
  return null;
}

async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
  } catch {
    return file; // fallback to original
  }
}

export async function uploadRepairMedia(
  repairId: string,
  images: File[],
  videos: File[],
  uploadedBy: 'customer' | 'admin'
): Promise<{ path: string; url: string; type: 'image' | 'video' }[]> {
  const supabase = createClient();
  const results: { path: string; url: string; type: 'image' | 'video' }[] = [];

  // Upload images (with compression)
  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    const compressed = await compressImage(file);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${repairId}/${uploadedBy}-img-${Date.now()}-${i}.${ext}`;

    const { error } = await supabase.storage
      .from('repair-media')
      .upload(path, compressed, { contentType: file.type, upsert: false });

    if (!error) {
      const { data } = supabase.storage.from('repair-media').getPublicUrl(path);
      results.push({ path, url: data.publicUrl, type: 'image' });
    }
  }

  // Upload videos (no compression)
  for (let i = 0; i < videos.length; i++) {
    const file = videos[i];
    const ext = file.name.split('.').pop() || 'mp4';
    const path = `${repairId}/${uploadedBy}-vid-${Date.now()}-${i}.${ext}`;

    const { error } = await supabase.storage
      .from('repair-media')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (!error) {
      const { data } = supabase.storage.from('repair-media').getPublicUrl(path);
      results.push({ path, url: data.publicUrl, type: 'video' });
    }
  }

  return results;
}
