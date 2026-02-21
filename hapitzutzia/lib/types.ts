// ============================================================
// הפיצוציה – TypeScript Types
// ============================================================

export type BoardType =
  | 'short'
  | 'long'
  | 'windsurf'
  | 'wing'
  | 'sup'
  | 'kayak'
  | 'catamaran'
  | 'foil'
  | 'other';

export type UrgencyLevel = 'urgent' | 'normal';

export type DeliveryLocation = 'pardess_hanna' | 'shdot_yam' | 'other';

export type RepairStatus = 'waiting' | 'working' | 'ready' | 'archived';

export type MediaType = 'image' | 'video';

export type MediaUploadedBy = 'customer' | 'admin';

// ── DB Row Types ──────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface Repair {
  id: string;
  customer_id: string;
  board_type: BoardType;
  description: string;
  urgency: UrgencyLevel;
  delivery_location: DeliveryLocation;
  delivery_other?: string;
  status: RepairStatus;
  price?: number;
  created_at: string;
  started_at?: string;
  ready_at?: string;
  archived_at?: string;
  updated_at: string;
  // Joined
  customer?: Customer;
  media?: RepairMedia[];
}

export interface RepairMedia {
  id: string;
  repair_id: string;
  storage_path: string;
  public_url: string;
  media_type: MediaType;
  uploaded_by: MediaUploadedBy;
  file_size?: number;
  created_at: string;
}

export interface RepairStatusLog {
  id: string;
  repair_id: string;
  old_status?: RepairStatus;
  new_status: RepairStatus;
  changed_at: string;
  note?: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// ── Form Types ─────────────────────────────────────────────

export interface NewRepairForm {
  name: string;
  phone: string;
  board_type: BoardType | '';
  description: string;
  urgency: UrgencyLevel;
  delivery_location: DeliveryLocation;
  delivery_other: string;
  images: File[];
  videos: File[];
}

// ── UI / Display helpers ───────────────────────────────────

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  short: 'גלשן גלים שורט',
  long: 'גלשן גלים לונג',
  windsurf: 'גלשן רוח',
  wing: 'גלשן ווינג',
  sup: 'גלשן סאפ',
  kayak: 'קייאק',
  catamaran: 'קאטרמן',
  foil: 'פויל',
  other: 'אחר',
};

export const STATUS_LABELS: Record<RepairStatus, string> = {
  waiting: 'ממתין לאישור',
  working: 'בעבודה',
  ready: 'מוכן לאיסוף',
  archived: 'ארכיון',
};

export const DELIVERY_LABELS: Record<DeliveryLocation, string> = {
  pardess_hanna: 'סדנא בפרדס חנה',
  shdot_yam: 'חוף שדות ים',
  other: 'אחר',
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  urgent: 'דחוף',
  normal: 'לא דחוף',
};
