import { backendFetch } from '@/lib/backend-fetch';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; no: string }> }) {
  const { id, no } = await params;
  const res = await backendFetch(`/api/v1/admin/credits/${id}/installments/${no}/detail`, { context: 'DEBUG' });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
