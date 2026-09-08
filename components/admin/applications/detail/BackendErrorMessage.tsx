import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ParsedBackendError {
  detail?: string;
  decision?: string;
  errors?: { rule?: string; message: string; severity?: string }[];
}

/**
 * Varios campos de error del backend (evaluationError, creditCreationError)
 * llegan como string — a veces JSON serializado (con `detail`/`errors`, ej.
 * el resultado del motor de reglas), a veces un mensaje plano (ej.
 * `Exception.getMessage()`, que además puede traer el body crudo de una
 * respuesta HTTP si viene de un RestClientException). Se intenta parsear;
 * si falla, se muestra tal cual.
 */
function parseBackendError(raw: string): ParsedBackendError | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as ParsedEvaluationError;
    return null;
  } catch {
    return null;
  }
}

export function BackendErrorMessage({ raw }: { raw: string }) {
  const [showRaw, setShowRaw] = useState(false);
  const parsed = parseBackendError(raw);

  // No es JSON — probablemente un mensaje de error técnico plano.
  if (!parsed) {
    return <p className="text-sm text-red-600">{raw}</p>;
  }

  const errors = parsed.errors?.filter((e) => e.message) ?? [];

  return (
    <div className="space-y-2">
      {parsed.detail && (
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{parsed.detail}</p>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="space-y-1 pl-6 list-disc marker:text-red-400">
          {errors.map((err, idx) => (
            <li key={idx} className="text-xs text-red-600">
              {err.rule && <span className="font-mono text-[10px] text-red-500 mr-1">[{err.rule}]</span>}
              {err.message}
            </li>
          ))}
        </ul>
      )}

      <Collapsible open={showRaw} onOpenChange={setShowRaw}>
        <CollapsibleTrigger className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          {showRaw ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showRaw ? 'Ocultar' : 'Ver'} detalle técnico completo
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
