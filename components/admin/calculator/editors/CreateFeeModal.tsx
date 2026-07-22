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
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-formatear código: mayúsculas, espacios→_, solo A-Z0-9_
  const handleCodeChange = (val: string) => {
    setCode(val.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, ''));
  };

  const handleSave = async () => {
    if (!code.trim()) { toast.error('El código es requerido'); return; }
    if (!label.trim()) { toast.error('El nombre es requerido'); return; }

    setSaving(true);
    try {
      const res = await fetch(CALCULATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), label: label.trim(), description: description.trim() || undefined }),
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
      setCode('');
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
            <Label className="text-xs">Código *</Label>
            <Input
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="Ej: LATE_FEE"
              className="h-8 text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground">Identificador interno. Solo mayúsculas, números y _</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Cargo por mora"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descripción pública</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Lo que el cliente verá en el detalle del préstamo"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Crear cargo
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
