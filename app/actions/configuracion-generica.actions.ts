'use server';

import { backendFetch } from '@/lib/backend-fetch';

export interface AmountBucketConfig {
  min: number;
  max: number | null;
  label: string;
}

export async function getConfigAction<T>(key: string): Promise<T | null> {
  const res = await backendFetch(`/api/v1/admin/generic-config/${key}`, {
    context: 'ADMIN_CONFIG_GET',
    method: 'GET',
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error obteniendo configuración ${key}: ${error}`);
  }

  const body = await res.json();
  try {
    return JSON.parse(body.value) as T;
  } catch {
    return body.value as T;
  }
}

export async function saveConfigAction<T>(key: string, value: T): Promise<void> {
  const res = await backendFetch(`/api/v1/admin/generic-config/${key}`, {
    context: 'ADMIN_CONFIG_SAVE',
    method: 'PUT',
    body: JSON.stringify({ value: JSON.stringify(value) }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error guardando configuración ${key}: ${error}`);
  }
}

export async function deleteConfigAction(key: string): Promise<void> {
  const res = await backendFetch(`/api/v1/admin/generic-config/${key}`, {
    context: 'ADMIN_CONFIG_DELETE',
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error eliminando configuración ${key}: ${error}`);
  }
}

const DEFAULT_AMOUNT_BUCKETS: AmountBucketConfig[] = [
  { min: 100, max: 150, label: 'S/100-150' },
  { min: 150, max: 200, label: 'S/150-200' },
  { min: 200, max: 250, label: 'S/200-250' },
  { min: 250, max: 300, label: 'S/250-300' },
  { min: 300, max: 400, label: 'S/300-400' },
  { min: 400, max: 500, label: 'S/400-500' },
  { min: 500, max: null, label: 'S/500+' },
];

export async function getAmountBucketsConfigAction(): Promise<AmountBucketConfig[]> {
  const config = await getConfigAction<AmountBucketConfig[]>('portfolio_amount_buckets');
  return config ?? DEFAULT_AMOUNT_BUCKETS;
}

export async function saveAmountBucketsConfigAction(buckets: AmountBucketConfig[]): Promise<void> {
  await saveConfigAction('portfolio_amount_buckets', buckets);
}

