/**
 * Renderiza texto plano con soporte simple para saltos de línea (`\n`) y viñetas
 * (líneas que empiezan con `- `). Usado por los contenidos de ayuda centralizados
 * (metric-info.ts, credits-help-content.ts) para no repetir la misma lógica de
 * parseo en cada popup/modal de ayuda del admin.
 */
export function FormattedBlock({ text, muted = false }: { text: string; muted?: boolean }) {
  const color = muted ? 'text-muted-foreground' : 'text-foreground/90';
  const lines = text.split('\n');

  return (
    <div className={`flex flex-col gap-1 text-xs leading-relaxed ${color}`}>
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="text-muted-foreground">•</span>
              <span>{trimmed.slice(2)}</span>
            </div>
          );
        }
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
