'use client';

import { useCallback, useEffect, useState } from 'react';
import { QueryBuilder, formatQuery, type Field, type RuleGroupType } from 'react-querybuilder';
import { parseJsonLogic } from '@react-querybuilder/core/parseJsonLogic';
import type { FieldGroup } from '@/modules/admin/admin-evaluation-rules.service';
import 'react-querybuilder/dist/query-builder.css';

interface RuleQueryBuilderProps {
  /** JsonLogic actual de la regla */
  logic: any;
  /** Callback cuando cambia la lógica */
  onChange: (newLogic: any) => void;
  /** Campos disponibles del backend */
  fieldGroups: FieldGroup[];
  /** Modo solo lectura */
  readOnly?: boolean;
}

/**
 * Editor visual de reglas JsonLogic usando react-querybuilder.
 * Convierte JsonLogic → UI visual (selects) → JsonLogic.
 *
 * Si no puede parsear la regla (ej: operador "if"), muestra fallback JSON.
 */
export function RuleQueryBuilder({ logic, onChange, fieldGroups, readOnly = false }: RuleQueryBuilderProps) {
  const [query, setQuery] = useState<RuleGroupType | null>(null);
  const [parseError, setParseError] = useState(false);
  const [jsonFallback, setJsonFallback] = useState('');

  // Convertir fields del backend al formato que espera react-querybuilder
  const fields: Field[] = fieldGroups.flatMap(group =>
    group.fields.map(f => ({
      name: f.name,
      label: `${group.label} → ${f.label}`,
      inputType: f.type === 'number' ? 'number' : f.type === 'boolean' ? 'text' : 'text',
      valueEditorType: f.type === 'boolean' ? 'select' as const : f.type === 'select' ? 'select' as const : undefined,
      values: f.type === 'boolean'
        ? [{ name: 'true', label: 'Sí (true)' }, { name: 'false', label: 'No (false)' }]
        : f.options
          ? f.options.map(o => ({ name: o, label: o }))
          : undefined,
    }))
  );

  // Intentar parsear la JsonLogic al montar o cuando cambie
  useEffect(() => {
    try {
      if (!logic || (typeof logic === 'object' && Object.keys(logic).length === 0)) {
        // Regla vacía — empezar con grupo vacío
        setQuery({ combinator: 'and', rules: [] });
        setParseError(false);
        return;
      }

      const parsed = parseJsonLogic(logic);
      if (parsed && 'rules' in parsed) {
        setQuery(parsed as RuleGroupType);
        setParseError(false);
      } else {
        throw new Error('No se pudo parsear');
      }
    } catch {
      // JsonLogic no parseable (ej: operador "if") — fallback a JSON
      setParseError(true);
      setJsonFallback(JSON.stringify(logic, null, 2));
    }
  }, []);

  const handleQueryChange = useCallback((newQuery: RuleGroupType) => {
    setQuery(newQuery);
    // Exportar como JsonLogic
    const exported = formatQuery(newQuery, 'jsonlogic');
    onChange(exported);
  }, [onChange]);

  const handleJsonChange = useCallback((json: string) => {
    setJsonFallback(json);
    try {
      const parsed = JSON.parse(json);
      onChange(parsed);
    } catch {
      // JSON inválido — no propagar
    }
  }, [onChange]);

  // Fallback: editor JSON para reglas que no se pueden parsear visualmente
  if (parseError) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          <span>⚠️ Regla compleja — usar editor JSON</span>
        </div>
        <textarea
          className="w-full rounded-md border bg-muted p-3 font-mono text-[11px] leading-tight resize-y min-h-[80px]"
          value={jsonFallback}
          onChange={(e) => handleJsonChange(e.target.value)}
          readOnly={readOnly}
          rows={4}
        />
      </div>
    );
  }

  if (!query) return null;

  return (
    <div className="rqb-wrapper">
      <QueryBuilder
        fields={fields}
        query={query}
        onQueryChange={handleQueryChange}
        disabled={readOnly}
        combinators={[
          { name: 'and', label: 'Y (todas deben cumplirse)' },
          { name: 'or', label: 'O (al menos una)' },
        ]}
        operators={[
          { name: '=', label: 'igual a' },
          { name: '!=', label: 'diferente de' },
          { name: '<', label: 'menor que' },
          { name: '<=', label: 'menor o igual que' },
          { name: '>', label: 'mayor que' },
          { name: '>=', label: 'mayor o igual que' },
          { name: 'in', label: 'está en' },
          { name: 'notIn', label: 'no está en' },
        ]}
        translations={{
          addRule: { label: '+ Condición' },
          addGroup: { label: '+ Grupo' },
          removeRule: { label: '✕' },
          removeGroup: { label: '✕' },
        }}
        controlClassnames={{
          queryBuilder: 'text-xs',
          ruleGroup: 'border rounded-md p-2 bg-muted/30',
          rule: 'bg-background rounded border px-2 py-1.5',
        }}
      />
    </div>
  );
}
