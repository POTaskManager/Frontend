import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/pricing',
  '/legal/privacy',
  '/login',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/assets',
  '/public'
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin')) {
    if (token.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (pathname.startsWith('/projects')) {
    const allowed = ['admin', 'manager', 'member'];
    if (!allowed.includes(String(token.role))) return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (pathname.startsWith('/dashboard')) {
    // any authenticated user
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|assets|public).*)']
};


