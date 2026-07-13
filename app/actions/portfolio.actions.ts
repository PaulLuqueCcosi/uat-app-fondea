'use server';

import { backendFetch } from '@/lib/backend-fetch';

export interface PortfolioConfigResponse {
  id: string;
  capitalBase: number;
  currency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getActivePortfolioConfigAction(): Promise<PortfolioConfigResponse | null> {
  const res = await backendFetch('/api/v1/admin/portfolio', {
    method: 'GET',
    context: 'PORTFOLIO',
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error obteniendo capital base: ${error}`);
  }
  return res.json();
}

export async function updateCapitalBaseAction(capitalBase: number) {
  const res = await backendFetch('/api/v1/admin/portfolio', {
    method: 'PUT',
    body: JSON.stringify({ capitalBase, currency: 'PEN' }),
    context: 'PORTFOLIO',
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error actualizando capital: ${error}`);
  }
  return res.json();
}
