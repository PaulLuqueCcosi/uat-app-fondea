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
  /** Hacer el valor font-semibold */
  bold?: boolean;
  /** Hacer el valor text-destructive */
  alert?: boolean;
  /** Custom class override para el valor */
  valueClassName?: string;
  /** Cambiar layout a horizontal (flex justify-between) en vez de vertical */
  horizontal?: boolean;
}

export function DataRow({ label, value, prefix, mono, bold, alert, valueClassName, horizontal }: DataRowProps) {
  let display: string;

  if (value === undefined || value === null || value === '') {
    display = '—';
  } else if (typeof value === 'boolean') {
    display = value ? 'Sí' : 'No';
  } else {
    display = prefix ? `${prefix} ${value}` : String(value);
  }

  const baseValueClasses = `text-sm ${bold ? 'font-semibold' : 'font-medium'} ${mono ? 'font-mono' : ''} ${alert ? 'text-destructive' : 'text-foreground'}`;
  const finalValueClasses = valueClassName ? `${baseValueClasses} ${valueClassName}` : baseValueClasses;

  if (horizontal) {
    return (
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={finalValueClasses}>
          {display}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={finalValueClasses}>
        {display}
      </span>
    </div>
  );
}
