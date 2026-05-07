interface Props {
  value: number; // 0-1
  ranges: Array<{ code: string; label: string; color: string }>;
}

// Colores de las 5 secciones del gauge (de izquierda a derecha)
const SECTION_COLORS = [
  "#DC2626", // rojo
  "#F97316", // naranja
  "#EAB308", // amarillo
  "#A3E635", // lima
  "#22C55E", // verde
];

export default function CreditGauge({ value, ranges }: Props) {
  const cx = 100;
  const cy = 95;
  const r = 65;
  const sw = 36; // más grueso para que destaque

  // Aguja
  const pivotX = cx;
  const pivotY = cy - 6;
  const angle = -180 + value * 180;
  const rad = (angle * Math.PI) / 180;
  const needleLen = 32;
  const nx = pivotX + needleLen * Math.cos(rad);
  const ny = pivotY + needleLen * Math.sin(rad);
  const perpRad = rad + Math.PI / 2;
  const baseWidth = 4;
  const bx1 = pivotX + baseWidth * Math.cos(perpRad);
  const by1 = pivotY + baseWidth * Math.sin(perpRad);
  const bx2 = pivotX - baseWidth * Math.cos(perpRad);
  const by2 = pivotY - baseWidth * Math.sin(perpRad);

  // Secciones: 5 arcos con gap fino
  const totalSections = SECTION_COLORS.length;
  const gapDeg = 1.2;
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

  // Labels
  const labelR = r;
  const labelAngles = [-165, -90, -15];
  const labelTexts = [
    ranges[0]?.label ?? "Bajo",
    ranges[1]?.label ?? "Medio",
    ranges[2]?.label ?? "Alto",
  ];

  return (
    <svg viewBox="5 5 190 105" width="100%" aria-hidden="true" style={{ display: "block", maxWidth: "100%", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }} preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* Gradientes para cada sección */}
        {sections.map((sec, i) => (
          <linearGradient key={`grad-${i}`} id={`gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={sec.color} stopOpacity="1" />
            <stop offset="100%" stopColor={sec.color} stopOpacity="0.7" />
          </linearGradient>
        ))}
        {/* Filtro de sombra interna para profundidad */}
        <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
          <feFlood floodColor="#000000" floodOpacity="0.3" result="color" />
          <feComposite in="color" in2="offsetBlur" operator="in" result="shadow" />
          <feComposite in="shadow" in2="SourceAlpha" operator="in" result="innerShadow" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="innerShadow" />
          </feMerge>
        </filter>
      </defs>

      {/* Secciones de color con sombra externa */}
      {sections.map((sec, i) => (
        <g key={i}>
          {/* Capa de sombra */}
          <path
            d={arcPath(cx, cy, r, sec.startAngle, sec.endAngle)}
            fill="none"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={sw}
            strokeLinecap="butt"
            transform="translate(0, 3)"
          />
          {/* Capa principal con gradiente */}
          <path
            d={arcPath(cx, cy, r, sec.startAngle, sec.endAngle)}
            fill="none"
            stroke={`url(#gradient-${i})`}
            strokeWidth={sw}
            strokeLinecap="butt"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
          />
        </g>
      ))}

      {/* Labels */}
      {labelAngles.map((deg, i) => {
        const labelRad = (deg * Math.PI) / 180;
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
            fontSize="9"
            fontWeight="700"
          >
            {labelTexts[i]}
          </text>
        );
      })}

      {/* Aguja */}
      <polygon
        points={`${nx},${ny} ${bx1},${by1} ${bx2},${by2}`}
        fill="var(--lc-text, #2D373D)"
      />
      <circle cx={pivotX} cy={pivotY} r={6} fill="var(--lc-text, #2D373D)" />
      <circle cx={pivotX} cy={pivotY} r={3} fill="white" />
    </svg>
  );
}

// Helpers
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
