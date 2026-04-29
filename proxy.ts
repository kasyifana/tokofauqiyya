import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Protect admin routes (except login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // Only admin can access panel, products, transaction admin, history
    const adminOnlyPaths = ['/admin/panel', '/admin/products', '/admin/transaction-history'];
    const isAdminOnly = adminOnlyPaths.some((p) => pathname.startsWith(p)) || pathname === '/admin/transaction';
    
    if (isAdminOnly && (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/transaction-employee', req.url));
    }

    // Employee can only access transaction-employee
    if (pathname === '/admin/transaction-employee' && (session.user as { role?: string }).role !== 'employee' && (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // Already logged in → redirect away from login
  if (pathname === '/admin/login' && session) {
    const role = (session.user as { role?: string }).role;
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/panel', req.url));
    if (role === 'employee') return NextResponse.redirect(new URL('/admin/transaction-employee', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
