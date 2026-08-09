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

/** Si el usuario ya respondió NPS alguna vez — para decidir si mostrarle el popup. */
export async function getNpsEligibilityAction(): Promise<{ hasResponded: boolean }> {
  const res = await backendFetch('/api/v1/nps/eligibility', {
    context: 'NPS_ELIGIBILITY',
  });

  if (!res.ok) {
    console.error(`[NPS_ELIGIBILITY] Error ${res.status}`);
    // Ante duda, no mostrar el popup — mejor no molestar que re-preguntar de más.
    return { hasResponded: true };
  }

  const body = await res.json();
  return { hasResponded: body.has_responded ?? true };
}
