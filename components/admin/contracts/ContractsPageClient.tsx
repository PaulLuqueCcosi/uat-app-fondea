'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  FileCode2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { DocumentTypeRow } from '@/modules/admin/admin-contracts.service';
import {
  createDocumentTypeAction,
  updateDocumentTypeAction,
  setDocumentTypeActiveAction,
} from '@/app/actions/contracts.actions';

// ── Reference type labels ─────────────────────────────────────────────────────

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  LOAN_APPLICATION: 'Solicitud de Préstamo',
  NEGOTIATION_OFFER: 'Oferta de Negociación',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface ContractsPageClientProps {
  documentTypes: DocumentTypeRow[];
}

export function ContractsPageClient({ documentTypes }: ContractsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createRequiresSignature, setCreateRequiresSignature] = useState(true);
  const [createVisibleBeforeSignature, setCreateVisibleBeforeSignature] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<DocumentTypeRow | null>(null);
  const [editRequiresSignature, setEditRequiresSignature] = useState(false);
  const [editVisibleBeforeSignature, setEditVisibleBeforeSignature] = useState(false);

  // Toggle loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleRefresh = () => {
    startTransition(() => router.refresh());
  };

  // ── Create ──────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);

    const form = new FormData(e.currentTarget);
    const result = await createDocumentTypeAction({
      code: (form.get('code') as string).trim().toUpperCase(),
      name: (form.get('name') as string).trim(),
      description: (form.get('description') as string)?.trim() || undefined,
      referenceType: form.get('referenceType') as string,
      sortOrder: Number(form.get('sortOrder')) || 0,
      requiresSignature: createRequiresSignature,
      visibleBeforeSignature: createVisibleBeforeSignature,
    });

    setCreating(false);

    if (result) {
      toast.success('Tipo de documento creado correctamente');
      setCreateOpen(false);
      setCreateRequiresSignature(true);
      setCreateVisibleBeforeSignature(false);
      handleRefresh();
    } else {
      toast.error('No se pudo crear el tipo de documento. Verifica los datos e intenta de nuevo.');
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────

  const openEdit = (dt: DocumentTypeRow) => {
    setEditTarget(dt);
    setEditRequiresSignature(dt.requiresSignature);
    setEditVisibleBeforeSignature(dt.visibleBeforeSignature);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditing(true);

    const form = new FormData(e.currentTarget);
    const result = await updateDocumentTypeAction(editTarget.id, {
      name: (form.get('name') as string).trim(),
      description: (form.get('description') as string)?.trim() || undefined,
      requiresSignature: editRequiresSignature,
      visibleBeforeSignature: editVisibleBeforeSignature,
    });

    setEditing(false);

    if (result) {
      toast.success('Tipo de documento actualizado');
      setEditOpen(false);
      setEditTarget(null);
      handleRefresh();
    } else {
      toast.error('No se pudo actualizar. Intenta de nuevo.');
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────────

  const handleToggleActive = async (dt: DocumentTypeRow) => {
    setTogglingId(dt.id);
    const ok = await setDocumentTypeActiveAction(dt.id, !dt.active);
    setTogglingId(null);

    if (ok) {
      toast.success(dt.active ? 'Tipo desactivado' : 'Tipo activado');
      handleRefresh();
    } else {
      toast.error('No se pudo cambiar el estado. Intenta de nuevo.');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="h-9 gap-2"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
        <Button size="sm" className="h-9 gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Crear tipo de documento
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left p-3 font-medium text-muted-foreground">Code</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Tipo Referencia</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Firma</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Visible pre-firma</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentTypes.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No hay tipos de documento registrados. Crea el primero.
                  </td>
                </tr>
              )}
              {documentTypes.map((dt) => (
                <tr key={dt.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {dt.code}
                    </span>
                  </td>
                  <td className="p-3">
                    <div>
                      <span className="font-medium text-foreground">{dt.name}</span>
                      {dt.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-62.5">
                          {dt.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-xs text-muted-foreground">
                      {REFERENCE_TYPE_LABELS[dt.referenceType] ?? dt.referenceType}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {dt.requiresSignature ? (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Sí</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {dt.visibleBeforeSignature ? (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Sí</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {dt.active ? (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Activo</Badge>
                    ) : (
                      <Badge className="bg-gray-50 text-gray-500 border-gray-200 text-[10px]">Inactivo</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        title="Editar plantilla"
                        onClick={() => router.push(`/admin/contracts/${dt.id}`)}
                      >
                        <FileCode2 className="h-3.5 w-3.5" />
                        Plantilla
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Editar"
                        onClick={() => openEdit(dt)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={togglingId === dt.id}
                        onClick={() => handleToggleActive(dt)}
                      >
                        {togglingId === dt.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : dt.active ? (
                          'Desactivar'
                        ) : (
                          'Activar'
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear tipo de documento</DialogTitle>
            <DialogDescription>
              Define un nuevo tipo de documento contractual.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="create-code" className="text-xs">Código</Label>
                <Input
                  id="create-code"
                  name="code"
                  required
                  placeholder="PAGARE"
                  className="h-8 text-sm uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-sortOrder" className="text-xs">Orden</Label>
                <Input
                  id="create-sortOrder"
                  name="sortOrder"
                  type="number"
                  defaultValue={0}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-name" className="text-xs">Nombre</Label>
              <Input
                id="create-name"
                name="name"
                required
                placeholder="Pagaré de préstamo"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-description" className="text-xs">Descripción</Label>
              <Textarea
                id="create-description"
                name="description"
                placeholder="Descripción opcional..."
                rows={2}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-referenceType" className="text-xs">Tipo de referencia</Label>
              <NativeSelect
                id="create-referenceType"
                name="referenceType"
                required
                className="h-8"
              >
                <NativeSelectOption value="LOAN_APPLICATION">Solicitud de Préstamo</NativeSelectOption>
                <NativeSelectOption value="NEGOTIATION_OFFER">Oferta de Negociación</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-requiresSignature" className="text-xs">Requiere firma</Label>
              <Switch
                id="create-requiresSignature"
                checked={createRequiresSignature}
                onCheckedChange={setCreateRequiresSignature}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-visibleBeforeSignature" className="text-xs">Visible antes de firmar</Label>
              <Switch
                id="create-visibleBeforeSignature"
                checked={createVisibleBeforeSignature}
                onCheckedChange={setCreateVisibleBeforeSignature}
              />
            </div>
            <DialogFooter>
              <Button type="submit" size="sm" disabled={creating}>
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) { setEditOpen(false); setEditTarget(null); } else setEditOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar tipo de documento</DialogTitle>
            <DialogDescription>
              Modifica los campos editables. El código no se puede cambiar.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Código</Label>
                <Input
                  value={editTarget.code}
                  disabled
                  className="h-8 text-sm bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs">Nombre</Label>
                <Input
                  id="edit-name"
                  name="name"
                  required
                  defaultValue={editTarget.name}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="text-xs">Descripción</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editTarget.description ?? ''}
                  rows={2}
                  className="text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-requiresSignature" className="text-xs">Requiere firma</Label>
                <Switch
                  id="edit-requiresSignature"
                  checked={editRequiresSignature}
                  onCheckedChange={setEditRequiresSignature}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-visibleBeforeSignature" className="text-xs">Visible antes de firmar</Label>
                <Switch
                  id="edit-visibleBeforeSignature"
                  checked={editVisibleBeforeSignature}
                  onCheckedChange={setEditVisibleBeforeSignature}
                />
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" disabled={editing}>
                  {editing && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
