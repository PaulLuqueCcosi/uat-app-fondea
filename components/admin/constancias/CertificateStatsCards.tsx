import { FileCheck, MailX, AlertTriangle } from 'lucide-react';
import type { CertificateStats } from '@/modules/admin/admin-constancias.types';

interface CertificateStatsCardsProps {
  stats: CertificateStats | null;
}

/**
 * Solo lo que importa para operar el día a día: cuántas se emitieron, cuántas
 * faltan enviar (acción pendiente), y cuántas tienen algún problema (emisión o envío
 * fallidos, agrupadas en una sola métrica). El detalle completo por estado está en
 * los filtros de la tabla — no hace falta repetirlo en tarjetas.
 */
export function CertificateStatsCards({ stats }: CertificateStatsCardsProps) {
  const issues = stats ? stats.failed + stats.deliveryFailed : null;

  const cards = [
    { label: 'Emitidas', value: stats?.issued ?? null, icon: FileCheck, color: 'text-green-700 bg-green-50 border-green-200' },
    { label: 'Por enviar', value: stats?.notSent ?? null, icon: MailX, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { label: 'Con problemas', value: issues, icon: AlertTriangle, color: 'text-red-700 bg-red-50 border-red-200' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 max-w-lg">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className={`rounded-lg border p-3 flex flex-col gap-1 ${color}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium opacity-80">{label}</span>
            <Icon className="h-3.5 w-3.5 opacity-70" />
          </div>
          <span className="text-xl font-bold tabular-nums">
            {value ?? '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
