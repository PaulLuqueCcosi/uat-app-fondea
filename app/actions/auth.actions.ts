'use server';

import { getLogtoContext } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { logtoConfig } from '../logto';

export async function getUser() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return null;
  }

  return {
    id: claims.sub || '',
    name: claims.name || claims.username || 'Usuario',
    email: claims.email || '',
    phone: claims.phone_number || '',
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  return isAuthenticated;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect('/');
  }
  return user;
}
