import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";
import CreditGauge from "./CreditGauge";
import type { RangeInfo, ScoreData } from "../core/types";

export interface CreditProfileGaugeProps {
  /** Los 3 rangos de perfil crediticio (bajo, medio, alto) */
  ranges: RangeInfo[];
  /** Scores calculados por código de rango */
  scores: Record<string, ScoreData | undefined>;
  /** Código del perfil activo (ej: "bajo", "medio", "alto") */
  activeCode: string;
  /** Valor del gauge 0–1 */
  gaugeValue: number;
  /** Si está calculando (muestra skeletons) */
  calculating: boolean;
  /** Callback al seleccionar un perfil — recibe el índice del rango */
  onSelectProfile: (index: number) => void;
  /** Callback al clickear info de un perfil */
  onInfoClick?: (code: string) => void;
  /** Mostrar bordes de debug en las celdas de la grilla */
  debug?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Componente de perfiles crediticios con gauge central y pills de monto.
 *
 * Layout con CSS Grid 3 columnas × 2 filas:
 *
 *   [ vacío        ]  [ pill medio  ]  [ vacío       ]
 *   [ pill bajo    ]  [ gauge       ]  [ pill alto   ]
 *
 * Los pills laterales se alinean a la base del gauge.
 * El pill medio se centra horizontalmente arriba del gauge.
 */
export default function CreditProfileGauge({
  ranges,
  scores,
  activeCode,
  gaugeValue,
  calculating,
  onSelectProfile,
  onInfoClick,
  debug = false,
  className,
}: CreditProfileGaugeProps) {
  if (ranges.length < 3) return null;

  // Índices fijos: bajo=0, medio=1, alto=2
  const midIdx = 1;   // naranja — arriba centro
  const leftIdx = 0;  // rojo (bajo) — abajo izquierda
  const rightIdx = 2; // verde (alto) — abajo derecha

  const cellDebug = debug ? "outline outline-1 outline-dashed outline-red-400" : "";

  return (
    <div
      className={cn("w-full mx-auto max-w-[280px] sm:max-w-[310px] md:max-w-[340px]", className)}
    >
      <div
        className="grid w-full items-end justify-items-center"
        style={{
          gridTemplateColumns: "1fr auto 1fr",
          gridTemplateRows: "auto auto",
          columnGap: "6px",
          rowGap: "4px",
          justifyContent: "center",
        }}
      >
        {/* Fila 1, Col 2: Pill medio (naranja) — centrado arriba del gauge */}
        <div style={{ gridColumn: "2", gridRow: "1" }} className={cn("pb-1", cellDebug)}>
          <ProfilePill
            range={ranges[midIdx]}
            score={scores[ranges[midIdx].code.toLowerCase()]}
            isActive={ranges[midIdx].code.toLowerCase() === activeCode}
            calculating={calculating}
            onClick={() => onSelectProfile(midIdx)}
            onInfoClick={onInfoClick}
          />
        </div>

        {/* Fila 2, Col 1: Pill bajo (rojo) — alineado abajo */}
        <div style={{ gridColumn: "1", gridRow: "2" }} className={cn("self-end pb-1", cellDebug)}>
          <ProfilePill
            range={ranges[leftIdx]}
            score={scores[ranges[leftIdx].code.toLowerCase()]}
            isActive={ranges[leftIdx].code.toLowerCase() === activeCode}
            calculating={calculating}
            onClick={() => onSelectProfile(leftIdx)}
            onInfoClick={onInfoClick}
          />
        </div>

        {/* Fila 2, Col 2: Gauge central */}
        <div style={{ gridColumn: "2", gridRow: "2" }} className={cn("w-[120px] sm:w-[135px] md:w-[150px]", cellDebug)}>
          <CreditGauge value={gaugeValue} ranges={ranges} />
        </div>

        {/* Fila 2, Col 3: Pill alto (verde) — alineado abajo */}
        <div style={{ gridColumn: "3", gridRow: "2" }} className={cn("self-end pb-1", cellDebug)}>
          <ProfilePill
            range={ranges[rightIdx]}
            score={scores[ranges[rightIdx].code.toLowerCase()]}
            isActive={ranges[rightIdx].code.toLowerCase() === activeCode}
            calculating={calculating}
            onClick={() => onSelectProfile(rightIdx)}
            onInfoClick={onInfoClick}
          />
        </div>
      </div>
    </div>
  );
}

// ── Pill individual ───────────────────────────────────────────────────────────
interface ProfilePillProps {
  range: RangeInfo;
  score: ScoreData | undefined;
  isActive: boolean;
  calculating: boolean;
  onClick: () => void;
  onInfoClick?: (code: string) => void;
  className?: string;
}

function ProfilePill({
  range,
  score,
  isActive,
  calculating,
  onClick,
  onInfoClick,
  className,
}: ProfilePillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg border-2 transition-all duration-200",
        "px-2 py-0.5 sm:px-2.5 sm:py-1",
        isActive ? "opacity-100 shadow-md" : "opacity-60 hover:opacity-80",
        className
      )}
      style={{
        borderColor: range.color,
        backgroundColor: isActive ? `${range.color}15` : "transparent",
      }}
    >
      {calculating || !score ? (
        <Skeleton className="rounded h-4 w-14 sm:w-16" />
      ) : (
        <span
          className="font-extrabold tabular-nums whitespace-nowrap text-center leading-tight text-xs sm:text-sm"
          style={{ color: range.color }}
        >
          S/ {score.total.toFixed(2)}
        </span>
      )}
      {onInfoClick && (
        <span
          className="absolute -top-2 -right-2 opacity-100 transition-opacity cursor-pointer bg-white rounded-full p-0.5 shadow-sm"
          onClick={(e) => { e.stopPropagation(); onInfoClick(range.code.toLowerCase()); }}
        >
          <Info size={12} style={{ color: range.color }} />
        </span>
      )}
    </button>
  );
}
