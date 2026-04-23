import { handleSignIn } from '@logto/next/server-actions';
import { NextRequest, NextResponse } from 'next/server';
import { logtoConfig } from '../logto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  console.log('[CALLBACK] Processing OAuth callback...');
  console.log('[CALLBACK] Search params:', Object.fromEntries(searchParams.entries()));

  try {
    await handleSignIn(logtoConfig, searchParams);
    console.log('[CALLBACK] handleSignIn successful, redirecting to /dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('[CALLBACK] Error during handleSignIn:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
