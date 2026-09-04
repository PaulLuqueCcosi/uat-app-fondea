'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleAccessRateKpiCard } from './ModuleAccessRateKpiCard';
import { EducationMoraCorrelationKpiCard } from './EducationMoraCorrelationKpiCard';

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Últimos 12 meses (incluye el actual), para el selector. */
function buildMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

export function EducationAnalyticsDashboard() {
  const [month, setMonth] = useState(currentYearMonth());
  const monthOptions = buildMonthOptions();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Select value={month} onValueChange={(v) => v && setMonth(v)}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleAccessRateKpiCard month={month} />
        <EducationMoraCorrelationKpiCard month={month} />
      </div>
    </div>
  );
}
