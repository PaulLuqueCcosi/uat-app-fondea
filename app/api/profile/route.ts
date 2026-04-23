import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    isAuthenticated,
    claims,
    user: {
      id: claims?.sub || '',
      name: claims?.name || claims?.username || 'Usuario',
      email: claims?.email || '',
      phone: claims?.phone_number || '',
      emailVerified: claims?.email_verified || false,
      phoneVerified: claims?.phone_number_verified || false,
      picture: claims?.picture || null,
      updatedAt: claims?.updated_at ? new Date(Number(claims.updated_at) * 1000).toISOString() : null,
    },
  });
}
