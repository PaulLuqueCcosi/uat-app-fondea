'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchAddressAction, getAddressDetailAction, type AddressSuggestion, type AddressDetail } from '@/app/actions/additional-address.actions';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelected?: (detail: AddressDetail) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function GoogleAddressAutocomplete({
  value,
  onChange,
  onAddressSelected,
  placeholder = 'Av. Javier Prado 1234, San Isidro',
  className,
  error,
}: GoogleAddressAutocompleteProps) {
  const [query, setQuery]               = useState(value);
  const [suggestions, setSuggestions]   = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen]             = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [isSelected, setIsSelected]     = useState(!!value);
  const [activeIndex, setActiveIndex]   = useState(-1);

  const inputRef      = useRef<HTMLInputElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza si el valor externo cambia (ej: reset del form)
  useEffect(() => {
    if (!value) {
      setQuery('');
      setIsSelected(false);
      setSuggestions([]);
    }
  }, [value]);

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda con debounce
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsSelected(false);
    onChange(''); // limpia el valor del form hasta que se seleccione

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchAddressAction(val);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  }, [onChange]);

  // Selección de una sugerencia
  const handleSelect = useCallback(async (suggestion: AddressSuggestion) => {
    setQuery(suggestion.description);
    onChange(suggestion.description);
    setIsSelected(true);
    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);

    // Obtener detalle completo y notificar al padre
    if (onAddressSelected) {
      const detail = await getAddressDetailAction(suggestion.place_id);
      if (detail) onAddressSelected(detail);
    }
  }, [onChange, onAddressSelected]);

  // Limpiar selección
  const handleClear = useCallback(() => {
    setQuery('');
    onChange('');
    setIsSelected(false);
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Navegación con teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) handleSelect(suggestions[activeIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }, [isOpen, suggestions, activeIndex, handleSelect]);

  // Resalta la parte del texto que coincide con la búsqueda
  function highlightMatch(text: string, query: string) {
    if (!query.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part)
            ? <span key={i} className="font-semibold text-foreground">{part}</span>
            : <span key={i}>{part}</span>
        )}
      </>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Input */}
      <div className={cn(
        'flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        error && 'border-destructive focus-within:ring-destructive',
        isSelected && 'border-primary/60',
      )}>
        {isLoading
          ? <Loader2 className="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />
          : <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          <ul role="listbox" className="py-1">
            {suggestions.map((s, i) => (
              <li
                key={s.place_id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault(); // evita que el input pierda foco antes del click
                  handleSelect(s);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors text-sm',
                  i === activeIndex ? 'bg-accent' : 'hover:bg-accent/50',
                )}
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-foreground">
                    {highlightMatch(s.main_text, query)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {s.secondary_text}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {/* Badge de "Powered by Google" — requerido por los ToS de Google */}
          <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-t bg-muted/30">
            <span className="text-[10px] text-muted-foreground">powered by</span>
            <span className="text-[10px] font-medium text-muted-foreground">Google</span>
          </div>
        </div>
      )}

      {/* Estado: dirección seleccionada */}
      {isSelected && (
        <p className="mt-1.5 text-xs text-primary flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Dirección confirmada
        </p>
      )}
    </div>
  );
}
