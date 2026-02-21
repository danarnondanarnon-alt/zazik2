import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d0d', color: '#f5f0e8',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Heebo, sans-serif', textAlign: 'center',
      padding: '40px 24px'
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏄</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#c94a1e' }}>
        404
      </h1>
      <p style={{ color: '#888', marginBottom: 40, fontSize: 16 }}>הדף לא נמצא</p>
      <Link href="/" style={{
        padding: '16px 32px', background: '#c94a1e', color: '#fff',
        borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: 'none'
      }}>
        חזרה לדף הבית
      </Link>
    </div>
  );
}
