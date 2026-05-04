'use client';

interface Props {
  value: number; // 0 a 1
  ranges: Array<{ code: string; label: string; color: string }>;
}

export default function CreditBar({ value, ranges }: Props) {
  const pct = Math.min(Math.max(value, 0), 1) * 100;

  const gradientStops = ranges
    .map((range, i) => `${range.color} ${(i / Math.max(ranges.length - 1, 1)) * 100}%`)
    .join(', ');

  return (
    <div className="w-full">
      {/* Barra de colores */}
      <div className="relative h-3 sm:h-4 rounded-full overflow-visible mb-1">
        {/* Track con degradado */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: `linear-gradient(to right, ${gradientStops})` }}
        />
        {/* Indicador */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-white/80 shadow-md transition-all duration-300 ease-out"
          style={{
            left: `calc(${pct}% - 7px)`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between px-1">
        {ranges.map((range) => (
          <span
            key={range.code}
            className="text-[8px] sm:text-[9px] font-medium"
            style={{ color: range.color }}
          >
            {range.label}
          </span>
        ))}
      </div>
    </div>
  );
}
