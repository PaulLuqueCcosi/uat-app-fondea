import { BarChart } from 'lucide-react';
import { NpsReportClient } from '@/components/admin/nps/NpsReportClient';
import {
  DEFAULT_NPS_RANGES,
  formatRangesParam,
  getNpsDistribution,
  getNpsUserSurveys,
  findUserByDni,
  buildUserName,
} from '@/modules/admin';

interface Props {
  searchParams: Promise<{
    page?: string;
    size?: string;
    ranges?: string;
    dni?: string;
    minScore?: string;
    maxScore?: string;
    month?: string; // formato: YYYY-MM o vacío para "todos"
  }>;
}

/**
 * Calcula from/to ISO para un mes dado (YYYY-MM).
 * Si no hay mes → retorna undefined (todos los meses).
 */
function getMonthDateRange(month?: string): { from?: string; to?: string } {
  if (!month || month === 'all') return {};
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const m = Number(monthStr);
  if (isNaN(year) || isNaN(m) || m < 1 || m > 12) return {};

  const from = new Date(year, m - 1, 1);
  const to = new Date(year, m, 0, 23, 59, 59); // último día del mes
  return { from: from.toISOString(), to: to.toISOString() };
}

export default async function AdminNpsPage({ searchParams }: Props) {
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 20;
  const ranges = params.ranges || formatRangesParam(DEFAULT_NPS_RANGES);
  const minScore = params.minScore || '1';
  const maxScore = params.maxScore || '10';
  const dni = params.dni || '';
  const month = params.month || 'all';

  const { from, to } = getMonthDateRange(month);

  // Resolver DNI → UUID (solo si hay DNI)
  let userId: string | null = null;
  let userName: string | null = null;
  let documentNumber: string | null = null;

  if (dni.trim()) {
    const user = await findUserByDni(dni.trim());
    if (user) {
      userId = user.id;
      userName = buildUserName(user);
      documentNumber = user.documentNumber;
    }
  }

  // Cargar distribución y envíos en paralelo
  const parsedRanges = ranges
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const [min, max] = r.split('-').map((s) => Number(s.trim()));
      return { min, max };
    })
    .filter((r) => !isNaN(r.min) && !isNaN(r.max));

  const [distribution, surveys] = await Promise.all([
    getNpsDistribution(parsedRanges, from, to),
    userId
      ? getNpsUserSurveys(userId, page, pageSize, Number(minScore), Number(maxScore), from, to)
      : Promise.resolve({
          data: [],
          pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
          userId: null,
          userName: null,
          documentNumber: null,
        }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Reporte NPS</h1>
          <p className="text-sm text-muted-foreground">
            Distribución de satisfacción y envíos por usuario
          </p>
        </div>
      </div>

      <NpsReportClient
        distribution={distribution}
        surveys={surveys}
        userName={userName}
        documentNumber={documentNumber}
        currentDni={dni}
        currentMonth={month}
      />
    </div>
  );
}
