'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, Hash, ToggleLeft, List, Check } from 'lucide-react';
import type { AvailableField, ScorecardMetadata } from '@/modules/admin/scoring';

const CATEGORY_LABELS: Record<string, string> = {
  PERFIL_ECONOMICO: 'Perfil Económico',
  LABORAL: 'Laboral',
  PATRIMONIAL: 'Patrimonial',
  COHERENCIA: 'Coherencia',
  HISTORIAL: 'Historial Crediticio',
  BURO: 'Buró Externo',
  PLATAFORMA: 'Plataforma',
};

const CATEGORY_ICONS: Record<string, string> = {
  PERFIL_ECONOMICO: '💰',
  LABORAL: '💼',
  PATRIMONIAL: '🏠',
  COHERENCIA: '🔗',
  HISTORIAL: '📊',
  BURO: '🏦',
  PLATAFORMA: '⭐',
};

const DATA_TYPE_ICON = {
  NUMBER: Hash,
  BOOLEAN: ToggleLeft,
  ENUM: List,
};

const DATA_TYPE_LABEL: Record<string, string> = {
  NUMBER: 'Numérico',
  BOOLEAN: 'Sí / No',
  ENUM: 'Opciones',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (field: AvailableField) => void;
  metadata: ScorecardMetadata;
  currentFieldCode?: string;
}

export function FieldSelectorModal({ open, onClose, onSelect, metadata, currentFieldCode }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fields = metadata.availableFields.filter(f => {
    const matchesSearch = !search || 
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(metadata.availableFields.map(f => f.category))];

  const fieldsByCategory = fields.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, AvailableField[]>);

  const handleSelect = (field: AvailableField) => {
    onSelect(field);
    onClose();
    setSearch('');
    setSelectedCategory(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full max-w-3xl max-h-[85vh] flex flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Seleccionar variable a evaluar</DialogTitle>
          <DialogDescription>
            Elige qué dato del usuario quieres evaluar en esta regla
          </DialogDescription>
        </DialogHeader>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar variable..."
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Filtros por categoría */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedCategory(null)}
          >
            Todas
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            >
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat] || cat}
            </Button>
          ))}
        </div>

        {/* Lista de campos */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {Object.entries(fieldsByCategory).map(([category, categoryFields]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
                {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category] || category}
              </p>
              <div className="space-y-1">
                {categoryFields.map(field => {
                  const Icon = DATA_TYPE_ICON[field.dataType] || Hash;
                  const isSelected = field.code === currentFieldCode;

                  return (
                    <button
                      key={field.code}
                      onClick={() => handleSelect(field)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all hover:border-primary/50 hover:bg-primary/5 ${
                        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{field.name}</span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                              {DATA_TYPE_LABEL[field.dataType]}
                            </Badge>
                            {field.unit && (
                              <span className="text-[10px] text-muted-foreground">({field.unit})</span>
                            )}
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{field.description}</p>
                          {field.dataType === 'ENUM' && field.enumValues && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Opciones: {field.enumValues.map(e => e.label).join(', ')}
                            </p>
                          )}
                          {field.dataType === 'NUMBER' && field.minValue != null && field.maxValue != null && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Rango: {field.minValue} — {field.maxValue} {field.unit || ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No se encontraron variables con ese filtro
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
