// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const isProjectB = origin === 'https://example-project-b.com';
  const isPreflight = req.method === 'OPTIONS';

  // ปิดแคชทุกคำขอบนเส้นทาง /uploads/* กันรูปค้าง
  const headers = new Headers({
    'Cache-Control': 'no-store',
  });

  if (isProjectB) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set(
      'Access-Control-Allow-Headers',
      req.headers.get('access-control-request-headers') || 'Content-Type'
    );

    if (isPreflight) {
      // ตอบ preflight ที่นี่เลย
      return new NextResponse(null, { status: 204, headers });
    }

    const res = NextResponse.next();
    headers.forEach((v, k) => res.headers.set(k, v));
    return res;
  }

  // กรณี same-origin หรือไม่มี Origin → อนุญาต และใส่ no-store เท่านั้น (ไม่บล็อก)
  const res = NextResponse.next();
  headers.forEach((v, k) => res.headers.set(k, v));
  return res;
}

export const config = {
  // ครอบคลุมทุกไฟล์อัปโหลด รวมถึง /uploads/users/**
  matcher: ['/uploads/:path*'],
};
