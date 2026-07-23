'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import type { FeeCatalogItem } from './FeeCodeSelector';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (item: FeeCatalogItem) => void;
}

const CALCULATOR_URL = '/api/admin/fee-catalog';

/**
 * Modal para crear un nuevo cargo en el catálogo.
 */
export function CreateFeeModal({ open, onOpenChange, onCreated }: Props) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-generar código a partir del nombre
  const code = label.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

  const handleSave = async () => {
    if (!label.trim()) { toast.error('El nombre es requerido'); return; }
    if (!description.trim()) { toast.error('La descripción pública es requerida'); return; }

    setSaving(true);
    try {
      const res = await fetch(CALCULATOR_URL, {
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
      toast.success(`Cargo "${created.label}" creado`);
      onCreated(created);

      // Reset
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
          <AlertDialogTitle>Crear nuevo cargo</AlertDialogTitle>
          <AlertDialogDescription>
            Este cargo quedará disponible en el catálogo para usar en cualquier grupo de tarifas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre del cargo *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
              placeholder="Ej: Cargo por mora"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descripción pública *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Lo que el cliente verá en el detalle del préstamo"
              className="h-8 text-sm"
            />
            <p className="text-[10px] text-muted-foreground">Texto visible para el usuario final</p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
          <Button size="sm" onClick={handleSave} disabled={saving || !label.trim() || !description.trim()}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Crear cargo
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
