# 🏄 הפיצוציה – סדנת תיקון גלשנים

Production-ready Next.js + Supabase web app for surfboard repair shop management.  
Mobile-first · RTL Hebrew · PWA installable · Admin + Customer flows.

---

## 📁 Project Structure

```
hapitzutzia/
├── app/
│   ├── layout.tsx                  # Root layout (RTL, PWA meta)
│   ├── page.tsx                    # Landing page
│   ├── customer/
│   │   ├── login/page.tsx          # Customer login (name + phone)
│   │   └── dashboard/page.tsx      # Customer repair history
│   ├── new-repair/page.tsx         # New repair submission form
│   ├── repair/[id]/page.tsx        # Public repair detail (tracking)
│   ├── admin/
│   │   ├── page.tsx                # Admin login
│   │   ├── dashboard/page.tsx      # Admin dashboard + search + filter
│   │   ├── repairs/[id]/page.tsx   # Admin repair edit
│   │   ├── analytics/page.tsx      # Analytics (month/half/year)
│   │   └── settings/page.tsx       # Global settings (payment link)
│   └── api/
│       ├── admin-login/route.ts
│       ├── repairs/route.ts         # GET list + POST create
│       ├── repairs/[id]/
│       │   ├── route.ts             # GET single repair
│       │   ├── status/route.ts      # PATCH status
│       │   ├── price/route.ts       # PATCH price
│       │   └── media/route.ts       # POST/DELETE media
│       ├── analytics/route.ts
│       └── settings/route.ts
├── components/
│   └── ui/
│       ├── AppHeader.tsx
│       ├── StatusBadge.tsx
│       ├── RepairCard.tsx
│       └── MediaGallery.tsx
├── lib/
│   ├── types.ts                    # All TypeScript types + label maps
│   ├── supabase.ts                 # Browser client
│   ├── supabase-server.ts          # Server + service-role clients
│   ├── media.ts                    # Upload + compression utilities
│   ├── utils.ts                    # WhatsApp, phone validation
│   └── admin-auth.ts               # Session-based admin auth
├── styles/globals.css
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker
│   ├── register-sw.js
│   ├── icon-192.png                # ← YOU MUST ADD THIS
│   └── icon-512.png                # ← YOU MUST ADD THIS
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 🚀 Setup Guide

### Step 1 – Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name it `hapitzutzia`, choose a region (recommend `eu-central-1`)
3. Save your database password

**Run the migration:**
1. In Supabase Dashboard → **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Paste entire file → **Run**

**Storage bucket** (already included in migration SQL, but verify):
- Dashboard → Storage → you should see `repair-media` bucket (public)

### Step 2 – Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Get from Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # Keep secret! Never expose to client

# Admin password – change this!
ADMIN_PASSWORD=ZAZIKZAZIK

# Your payment link (Paybox, Bit, etc.)
NEXT_PUBLIC_PAYMENT_LINK=https://paybox.co.il/your-workshop

# Workshop info for WhatsApp messages
NEXT_PUBLIC_WORKSHOP_NAME=הפיצוציה
NEXT_PUBLIC_WORKSHOP_PHONE=972501234567  # No dashes, starts with 972
```

### Step 3 – PWA Icons

Add two icons to `/public/`:
- `icon-192.png` (192×192px)
- `icon-512.png` (512×512px)

Use your logo with a dark (#0d0d0d) background. You can generate them at [realfavicongenerator.net](https://realfavicongenerator.net).

### Step 4 – Local Development

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

---

## 🌐 Deploy to Vercel

### Option A – Vercel CLI (fastest)

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option B – GitHub + Vercel Dashboard

1. Push project to GitHub:
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USER/hapitzutzia.git
git push -u origin main
```

2. [vercel.com/new](https://vercel.com/new) → Import your repo

3. Add all environment variables in Vercel → Settings → Environment Variables

4. Deploy → Done! 🎉

**Custom domain:** Vercel Dashboard → Settings → Domains → Add `hapitzutzia.co.il` (or similar)

---

## 📱 Install as PWA (Phone Home Screen)

**iOS (Safari):**
1. Open the website in Safari
2. Tap Share button (bottom bar)
3. "Add to Home Screen"

**Android (Chrome):**
1. Open website in Chrome
2. Tap ⋮ menu → "Add to Home screen"

Or Chrome will prompt automatically after first visit.

---

## 🗄️ Database Schema Reference

| Table | Description |
|-------|-------------|
| `customers` | name + phone (unique) |
| `repairs` | All repair data, status, price, timestamps |
| `repair_media` | Images/videos linked to repairs |
| `repair_status_log` | Full audit trail of status changes |
| `settings` | Key-value global settings (payment_link) |

**Status flow:** `waiting → working → ready → archived`

**Auto-timestamps:**
- `started_at` — set once when first moved to `working`
- `ready_at` — set once when moved to `ready`
- `archived_at` — set when archived

---

## 🔒 Security Notes

- Admin auth uses a single env-var password verified server-side (`/api/admin-login`)
- Session stored in `sessionStorage` (clears on browser close)
- Customer access: lookup by phone only — no passwords, no OTP
- Supabase service-role key is **never** exposed to the browser
- RLS enabled on all tables
- Media uploads go directly from browser to Supabase Storage
- No customer can modify a repair after submission

---

## 🧩 Feature Checklist

- [x] Customer login by phone
- [x] New repair form with media upload + compression
- [x] Repair status tracking page
- [x] WhatsApp message builder + copy to clipboard
- [x] Payment link display
- [x] Admin login (password-protected)
- [x] Admin dashboard with stats
- [x] Search by name/phone
- [x] Filter by status/date/price/board type
- [x] Aging indicator (>14 days in working)
- [x] Status change with auto-timestamps
- [x] Status audit log
- [x] Price management
- [x] Admin media upload (during repair)
- [x] Analytics (month/half/year)
- [x] Settings page (payment link)
- [x] PWA manifest + service worker
- [x] Full RTL layout
- [x] Mobile-first design
- [x] Image compression (client-side)
- [x] Video upload support

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Deployment | Vercel |
| Styling | CSS Modules + CSS Variables |
| Image compression | browser-image-compression |
| Date formatting | date-fns |
| Language | TypeScript |

---

## 📞 Support

Built for הפיצוציה – סדנת גלשנים, פרדס חנה.
