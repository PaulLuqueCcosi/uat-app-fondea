'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export interface DiscountCatalogItem {
  id: string;
  code: string;
  label: string;
  description: string | null;
}

interface Props {
  value: string;
  onChange: (code: string, label: string) => void;
  catalog: DiscountCatalogItem[];
  onCatalogUpdate: (item: DiscountCatalogItem) => void;
  disabled?: boolean;
}

/** Build display text: "Label (description)" or just "Label" */
function displayText(item: DiscountCatalogItem): string {
  return item.description ? `${item.label} (${item.description})` : item.label;
}

export function DiscountCodeSelector({ value, onChange, catalog, onCatalogUpdate, disabled }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleChange = (code: string) => {
    const item = catalog.find((c) => c.code === code);
    onChange(code, item?.label ?? code);
  };

  const handleCreated = (item: DiscountCatalogItem) => {
    onCatalogUpdate(item);
    onChange(item.code, item.label);
    setShowCreateModal(false);
  };

  return (
    <>
      <div className="flex items-center gap-1 flex-1">
        <Select value={value || undefined} onValueChange={(v) => v && handleChange(v)}>
          <SelectTrigger className="h-6 text-[11px] flex-1" disabled={disabled}>
            <SelectValue placeholder="Seleccionar descuento..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Catálogo de descuentos</SelectLabel>
              {catalog.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {displayText(item)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {!disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-6 w-6 p-0 shrink-0"
            title="Crear nuevo descuento"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      <CreateDiscountModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={handleCreated}
      />
    </>
  );
}

// ── Create Discount Modal ─────────────────────────────────────────────────────

function CreateDiscountModal({ open, onOpenChange, onCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (item: DiscountCatalogItem) => void;
}) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const code = label.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

  const handleSave = async () => {
    if (!label.trim()) { toast.error('El nombre es requerido'); return; }
    if (!description.trim()) { toast.error('La descripción pública es requerida'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/discount-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, label: label.trim(), description: description.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? `Error ${res.status}`);
        setSaving(false);
        return;
      }

      const created = await res.json();
      toast.success(`Descuento "${created.label}" creado`);
      onCreated(created);
      setLabel('');
      setDescription('');
    } catch {
      toast.error('Error de conexión');
    }
    setSaving(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Crear nuevo descuento</AlertDialogTitle>
          <AlertDialogDescription>
            Este descuento quedará disponible en el catálogo para usar en cualquier regla de pricing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre del descuento *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
              placeholder="Ej: Descuento primer préstamo"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descripción pública *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Lo que el cliente verá en el detalle"
              className="h-8 text-sm"
            />
            <p className="text-[10px] text-muted-foreground">Texto visible para el usuario final</p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
          <Button size="sm" onClick={handleSave} disabled={saving || !label.trim() || !description.trim()}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Crear descuento
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
