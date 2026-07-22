'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface Props {
  values: number[];
  onChange: (values: number[]) => void;
  suggestions?: number[];
  placeholder?: string;
  formatLabel?: (value: number) => string;
  readonly?: boolean;
}

/**
 * TagNumberInput — Input de tags numéricos creatable.
 *
 * - Muestra los valores seleccionados como chips removibles
 * - Sugiere opciones predefinidas (click para agregar)
 * - El usuario puede escribir un número nuevo y presionar Enter para crearlo
 * - Los valores se mantienen ordenados de menor a mayor
 */
export function TagNumberInput({
  values,
  onChange,
  suggestions = [],
  placeholder = 'Escribe un valor y presiona Enter',
  formatLabel = (v) => String(v),
  readonly = false,
}: Props) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addValue = (num: number) => {
    if (values.includes(num)) return;
    onChange([...values, num].sort((a, b) => a - b));
    setInputValue('');
  };

  const removeValue = (num: number) => {
    if (values.length <= 1) return; // al menos 1
    onChange(values.filter((v) => v !== num));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const num = Number(inputValue.trim());
      if (!isNaN(num) && num > 0) addValue(num);
    }
    if (e.key === 'Backspace' && inputValue === '' && values.length > 1) {
      // Borrar el último chip
      onChange(values.slice(0, -1));
    }
  };

  // Sugerencias que aún no están seleccionadas
  const availableSuggestions = suggestions.filter((s) => !values.includes(s));

  if (readonly) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="font-mono text-xs">
            {formatLabel(v)}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selected chips + input */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[36px] rounded-lg border px-2 py-1.5 bg-background focus-within:ring-2 focus-within:ring-primary/30 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((v) => (
          <Badge key={v} variant="default" className="font-mono text-xs gap-1 pr-1">
            {formatLabel(v)}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeValue(v); }}
              className="ml-0.5 rounded-full hover:bg-primary-foreground/20 p-0.5"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ''}
          className="h-6 flex-1 min-w-[80px] border-0 shadow-none p-0 text-xs font-mono focus-visible:ring-0"
        />
      </div>

      {/* Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {availableSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addValue(s)}
              className="px-2 py-0.5 rounded text-[11px] font-mono text-muted-foreground border border-dashed border-border hover:border-primary/50 hover:text-foreground transition-colors"
            >
              + {formatLabel(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
