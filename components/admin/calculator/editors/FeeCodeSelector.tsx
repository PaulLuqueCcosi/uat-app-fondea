'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { CreateFeeModal } from './CreateFeeModal';

export interface FeeCatalogItem {
  id: string;
  code: string;
  label: string;
  description: string | null;
}

interface Props {
  value: string;
  onChange: (code: string, label: string) => void;
  catalog: FeeCatalogItem[];
  onCatalogUpdate: (item: FeeCatalogItem) => void;
  disabled?: boolean;
  /** El catálogo todavía se está trayendo del backend — deshabilita y avisa en vez de mostrar un select vacío. */
  loading?: boolean;
}

/** Build display text: "Label (description)" or just "Label" */
function displayText(item: FeeCatalogItem): string {
  return item.description ? `${item.label} (${item.description})` : item.label;
}

/**
 * Selector de cargo del catálogo usando Select de shadcn + botón crear nuevo.
 */
export function FeeCodeSelector({ value, onChange, catalog, onCatalogUpdate, disabled, loading }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleChange = (code: string) => {
    const item = catalog.find((c) => c.code === code);
    onChange(code, item?.label ?? code);
  };

  const handleCreated = (item: FeeCatalogItem) => {
    onCatalogUpdate(item);
    onChange(item.code, item.label);
    setShowCreateModal(false);
  };

  return (
    <>
      <div className="flex items-center gap-1 flex-1">
        <Select value={value || undefined} onValueChange={(v) => v && handleChange(v)}>
          <SelectTrigger className="h-7 text-[11px] flex-1" disabled={disabled || loading}>
            {loading ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Cargando cargos...
              </span>
            ) : (
              <SelectValue placeholder="Seleccionar cargo..." />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Catálogo de cargos</SelectLabel>
              {catalog.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {displayText(item)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {!disabled && !loading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-7 w-7 p-0 shrink-0"
            title="Crear nuevo cargo al catálogo"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      <CreateFeeModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={handleCreated}
      />
    </>
  );
}
