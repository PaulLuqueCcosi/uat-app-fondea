import * as LucideIcons from 'lucide-react';

/** Colores e iconos que se pueden asignar a un rango (modo simple) o a un tramo (por conceptos). */
export const COLOR_PRESETS = [
  { name: 'green', value: '#10b981', label: 'Verde' },
  { name: 'yellow', value: '#f59e0b', label: 'Amarillo' },
  { name: 'orange', value: '#f97316', label: 'Naranja' },
  { name: 'red', value: '#ef4444', label: 'Rojo' },
  { name: 'blue', value: '#3b82f6', label: 'Azul' },
  { name: 'purple', value: '#8b5cf6', label: 'Morado' },
  { name: 'gray', value: '#6b7280', label: 'Gris' },
  { name: 'teal', value: '#14b8a6', label: 'Turquesa' },
];

export const ICON_OPTIONS = [
  { value: 'check-circle', label: 'Check' },
  { value: 'alert-triangle', label: 'Alerta' },
  { value: 'shield-alert', label: 'Escudo' },
  { value: 'ban', label: 'Prohibido' },
  { value: 'clock', label: 'Reloj' },
  { value: 'calendar-x', label: 'Calendario' },
  { value: 'trending-up', label: 'Subida' },
  { value: 'flame', label: 'Fuego' },
  { value: 'zap', label: 'Rayo' },
  { value: 'circle-alert', label: 'Círculo' },
  { value: 'skull', label: 'Peligro' },
  { value: 'coins', label: 'Monedas' },
  { value: 'piggy-bank', label: 'Alcancía' },
  { value: 'thumbs-up', label: 'Pulgar' },
  { value: 'star', label: 'Estrella' },
  { value: 'trophy', label: 'Trofeo' },
];

/** Convierte nombre kebab-case (ej: "alert-triangle") al componente Lucide. */
export function getLucideIcon(name: string): React.ComponentType<{ className?: string }> | null {
  // Lucide exporta con PascalCase: "alert-triangle" → "AlertTriangle"
  const pascalCase = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase] ?? null;
}

/** Texto del rango de días: "Día 1 al 3", "Día 5", "Día 11 en adelante". */
export function formatDayRange(from: number, to: number | null): string {
  if (to === null) return `Día ${from} en adelante`;
  if (from === to) return `Día ${from}`;
  return `Día ${from} al ${to}`;
}
