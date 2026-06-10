/**
 * ScoreGauge — Gauge semicircular segmentado reutilizable.
 *
 * Muestra un semicírculo con 5 secciones de color (rojo → verde),
 * una aguja que indica la posición del score, y labels dentro de las secciones.
 *
 * Uso:
 * ```tsx
 * <ScoreGauge value={0.72} labels={['Bajo', 'Medio', 'Alto']} />
 * ```
 */

// Colores fijos para las secciones (de peor a mejor)
const SECTION_COLORS = [
  '#DC2626', // rojo
  '#F97316', // naranja
  '#EAB308', // amarillo
  '#A3E635', // lima
  '#22C55E', // verde
];

export interface ScoreGaugeProps {
  /** Valor normalizado 0-1 (posición de la aguja) */
  value: number;
  /** Labels a mostrar dentro del gauge (max 3, se distribuyen izq/centro/der) */
  labels?: string[];
  /** Clases adicionales para el contenedor */
  className?: string;
}

export function ScoreGauge({ value, labels = ['Bajo', 'Medio', 'Alto'], className }: ScoreGaugeProps) {
  const cx = 100;
  const cy = 95;
  const r = 65;
  const sw = 28;

  // Aguja
  const pivotX = cx;
  const pivotY = cy - 6;
  const angle = -180 + value * 180;
  const rad = (angle * Math.PI) / 180;
  const needleLen = 30;
  const nx = pivotX + needleLen * Math.cos(rad);
  const ny = pivotY + needleLen * Math.sin(rad);
  const perpRad = rad + Math.PI / 2;
  const baseWidth = 3.5;
  const bx1 = pivotX + baseWidth * Math.cos(perpRad);
  const by1 = pivotY + baseWidth * Math.sin(perpRad);
  const bx2 = pivotX - baseWidth * Math.cos(perpRad);
  const by2 = pivotY - baseWidth * Math.sin(perpRad);

  // Secciones
  const totalSections = SECTION_COLORS.length;
  const gapDeg = 1.5;
  const totalGap = gapDeg * (totalSections - 1);
  const availableDeg = 180 - totalGap;
  const sectionDeg = availableDeg / totalSections;

  const sections: Array<{ startAngle: number; endAngle: number; color: string }> = [];
  let currentAngle = -180;

  for (let i = 0; i < totalSections; i++) {
    sections.push({
      startAngle: currentAngle,
      endAngle: currentAngle + sectionDeg,
      color: SECTION_COLORS[i],
    });
    currentAngle += sectionDeg + gapDeg;
  }

  // Labels posicionados en el arco
  const labelR = r;
  const labelAngles = [-165, -90, -15];
  const labelTexts = labels.slice(0, 3);

  return (
    <svg
      viewBox="5 5 190 105"
      width="100%"
      aria-hidden="true"
      className={className}
      style={{ display: 'block', maxWidth: '100%' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Secciones de color */}
      {sections.map((sec, i) => (
        <path
          key={i}
          d={arcPath(cx, cy, r, sec.startAngle, sec.endAngle)}
          fill="none"
          stroke={sec.color}
          strokeWidth={sw}
          strokeLinecap="butt"
          opacity={0.85}
        />
      ))}

      {/* Labels */}
      {labelTexts.map((text, i) => {
        const labelRad = (labelAngles[i] * Math.PI) / 180;
        const lx = cx + labelR * Math.cos(labelRad);
        const ly = cy + labelR * Math.sin(labelRad);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="8"
            fontWeight="700"
          >
            {text}
          </text>
        );
      })}

      {/* Aguja */}
      <polygon
        points={`${nx},${ny} ${bx1},${by1} ${bx2},${by2}`}
        fill="#2D373D"
      />
      <circle cx={pivotX} cy={pivotY} r={5} fill="#2D373D" />
      <circle cx={pivotX} cy={pivotY} r={2.5} fill="white" />
    </svg>
  );
}

// ─── SVG Helpers ──────────────────────────────────────────────────────────────

function polarPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarPoint(cx, cy, r, startDeg);
  const end = polarPoint(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
