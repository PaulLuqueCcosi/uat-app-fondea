'use server';

import { backendFetch } from '@/lib/backend-fetch';

export async function submitNpsAction(score: number) {
  const res = await backendFetch('/api/v1/nps', {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
  if (!res.ok) throw new Error('Error enviando NPS');
  return { success: true };
}
