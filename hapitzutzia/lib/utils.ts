import { Repair, STATUS_LABELS, BOARD_TYPE_LABELS, DELIVERY_LABELS } from './types';

export function buildWhatsAppMessage(repair: Repair, baseUrl: string): string {
  const workshopName = process.env.NEXT_PUBLIC_WORKSHOP_NAME || 'הפיצוציה';
  const trackingUrl = `${baseUrl}/repair/${repair.id}`;

  const lines = [
    `🏄 *${workshopName}*`,
    ``,
    `שלום ${repair.customer?.name || ''},`,
    `עדכון על הגלשן שלך:`,
    ``,
    `📋 *סטטוס:* ${STATUS_LABELS[repair.status]}`,
    `🤙 *סוג גלשן:* ${BOARD_TYPE_LABELS[repair.board_type]}`,
    repair.price ? `💰 *מחיר:* ₪${repair.price}` : '',
    `📍 *מסירה:* ${DELIVERY_LABELS[repair.delivery_location]}`,
    ``,
    `🔗 מעקב: ${trackingUrl}`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '972');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function normalizeIsraeliPhone(raw: string): string {
  // Accepts: 050-1234567, 0501234567, +972501234567
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) return `0${digits.slice(3)}`;
  return digits;
}

export function validateIsraeliPhone(phone: string): boolean {
  const normalized = normalizeIsraeliPhone(phone);
  return /^0(5[0-9]|7[2-9])\d{7}$/.test(normalized);
}

export function formatPhone(phone: string): string {
  const d = normalizeIsraeliPhone(phone);
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return phone;
}
