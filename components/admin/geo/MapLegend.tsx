'use client';

interface MapLegendProps {
  maxValue: number;
}

/**
 * Leyenda del mapa con gradiente de color usando la paleta primaria.
 */
export function MapLegend({ maxValue }: MapLegendProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border rounded-lg bg-background">
      <span className="text-xs text-muted-foreground font-medium">Menor</span>
      <div
        className="flex-1 h-3 rounded-full"
        style={{
          background: 'linear-gradient(to right, hsl(193, 100%, 95%), hsl(193, 80%, 75%), hsl(193, 70%, 55%), hsl(193, 100%, 32%))',
        }}
      />
      <span className="text-xs text-muted-foreground font-medium">Mayor</span>
      <span className="text-xs text-muted-foreground ml-2">(máx: {maxValue})</span>
    </div>
  );
}
