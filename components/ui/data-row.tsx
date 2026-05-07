/**
 * DataRow — Muestra un par label/valor en la vista readonly de formularios.
 *
 * @example
 * <DataRow label="Banco" value="BCP" />
 * <DataRow label="Tiene deudas" value={true} />
 * <DataRow label="Monto" value={5000} prefix="S/" />
 * <DataRow label="DNI" value="12345678" mono />
 */

interface DataRowProps {
  label: string;
  value?: string | number | boolean | null;
  /** Prefijo antes del valor (ej: "S/") */
  prefix?: string;
  /** Usar font monospace para el valor (ej: DNI, CCI) */
  mono?: boolean;
}

export function DataRow({ label, value, prefix, mono }: DataRowProps) {
  let display: string;

  if (value === undefined || value === null || value === '') {
    display = '—';
  } else if (typeof value === 'boolean') {
    display = value ? 'Sí' : 'No';
  } else {
    display = prefix ? `${prefix} ${value}` : String(value);
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}>
        {display}
      </span>
    </div>
  );
}
