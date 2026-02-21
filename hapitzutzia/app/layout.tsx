import type { Metadata, Viewport } from 'next';
import { Rubik } from 'next/font/google';
import '../styles/globals.css';

const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-rubik',
});

export const metadata: Metadata = {
  title: 'הפיצוציה – סדנת תיקון גלשנים',
  description: 'שלחו גלשן, קבלו אותו חזרה חדש',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'הפיצוציה',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d0d0d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script src="/register-sw.js" defer />
      </head>
      <body className={rubik.className}>{children}</body>
    </html>
  );
}
