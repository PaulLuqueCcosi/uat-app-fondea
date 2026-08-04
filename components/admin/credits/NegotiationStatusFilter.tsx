'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { NegotiationOfferStatus } from '@/modules/negotiation-offers';

type FilterValue = NegotiationOfferStatus | 'ALL';

const OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'SENT', label: 'Pendientes de firma' },
  { value: 'ACCEPTED', label: 'Aceptadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
  { value: 'EXPIRED', label: 'Expiradas' },
];

/**
 * Filtro de estado para el tab "Créditos de Negociación".
 * Usa su propio query param (nstatus) para no chocar con los filtros
 * de la tabla principal de créditos que vive en el otro tab.
 */
export function NegotiationStatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get('nstatus') as FilterValue) ?? 'ALL';

  function handleChange(value: FilterValue) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'negotiation');
    if (value === 'ALL') params.delete('nstatus');
    else params.set('nstatus', value);
    router.push(`/admin/credits?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            current === opt.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground hover:bg-muted'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
