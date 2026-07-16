'use client';

import { getDepartments, getProvinces, getDistricts } from 'ubigeo-fns';

interface GeoDataEntry {
  code: string;
  loanCount: number;
  percentage: number;
}

interface GeoDataTableProps {
  data: GeoDataEntry[];
  level: 'department' | 'province' | 'district';
  title: string;
}

// Colores para las barras de porcentaje según posición
function getBarColor(index: number): string {
  const colors = ['#005F7A', '#006E8F', '#0087AD', '#00A1CD', '#40C4E8', '#7DD8F0', '#B2ECF8'];
  return colors[Math.min(index, colors.length - 1)];
}

/**
 * Tabla visual con el listado de departamentos, provincias o distritos.
 * Resuelve nombres via ubigeo-fns. Incluye barra visual de porcentaje.
 */
export function GeoDataTable({ data, level, title }: GeoDataTableProps) {
  const levelLabel = level === 'department' ? 'departamentos' : level === 'province' ? 'provincias' : 'distritos';
  const columnLabel = level === 'department' ? 'Departamento' : level === 'province' ? 'Provincia' : 'Distrito';

  const resolvedData = data.map((entry) => {
    let name = entry.code;
    try {
      if (level === 'department') {
        const deps = getDepartments();
        name = deps.find((d) => d.code === entry.code)?.name ?? entry.code;
      } else if (level === 'province') {
        const regionCode = entry.code.substring(0, 2);
        const provs = getProvinces(regionCode);
        name = provs.find((p) => p.code === entry.code)?.name ?? entry.code;
      } else {
        const provCode = entry.code.substring(0, 4);
        const dists = getDistricts(provCode);
        name = dists.find((d) => d.code === entry.code)?.name ?? entry.code;
      }
    } catch {
      // fallback al código
    }
    return { ...entry, name };
  });

  const maxCount = resolvedData.length > 0 ? resolvedData[0].loanCount : 1;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {data.length} {levelLabel}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">Sin datos para este nivel</p>
        </div>
      ) : (
        <div className="max-h-[540px] overflow-y-auto divide-y">
          {resolvedData.map((entry, idx) => {
            const barWidth = maxCount > 0 ? (entry.loanCount / maxCount) * 100 : 0;
            return (
              <div
                key={entry.code}
                className="px-4 py-2.5 hover:bg-muted/20 transition-colors"
              >
                {/* Fila superior: posición + nombre + count */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[11px] font-bold text-muted-foreground w-5 shrink-0 text-right">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium truncate">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-sm font-semibold tabular-nums">
                      {entry.loanCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums w-12 text-right">
                      {entry.percentage}%
                    </span>
                  </div>
                </div>
                {/* Barra visual */}
                <div className="ml-7.5 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: getBarColor(idx),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
