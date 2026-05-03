import { handleSignIn } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { logtoConfig } from '@/app/logto';

/**
 * GET /api/logto/callback
 *
 * Logto redirige aquí después de que el usuario se autentica.
 * handleSignIn() intercambia el código por tokens y los guarda en cookies.
 * Luego redirige al dashboard (o a la URL guardada en cookie si existe).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  await handleSignIn(logtoConfig, searchParams);
  redirect('/dashboard');
}
