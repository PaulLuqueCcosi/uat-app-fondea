'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Ban, RotateCcw, Loader2, AlertCircle, CheckCircle2, ImageIcon, Upload } from 'lucide-react';
import {
  getAllScoreRangesAction,
  createScoreRangeAction,
  updateScoreRangeAction,
  deactivateScoreRangeAction,
  activateScoreRangeAction,
  uploadScoreRangeImageAction,
} from '@/app/actions/admin-score-ranges.actions';
import type { AdminScoreRange, ScoreRangeMutationRequest } from '@/modules/admin/admin-score-ranges.service';

const MAX_IMAGE_SIZE_MB = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface RangeDraft {
  categoryName: string;
  minPoints: string;
  maxPoints: string; // '' = sin límite
  maxLoanAmount: string;
}

const EMPTY_DRAFT: RangeDraft = { categoryName: '', minPoints: '', maxPoints: '', maxLoanAmount: '' };

function formatRangeLabel(min: number, max: number | null): string {
  return `${min}–${max ?? '∞'} pts`;
}

function draftToRequest(draft: RangeDraft): ScoreRangeMutationRequest {
  return {
    categoryName: draft.categoryName.trim(),
    minPoints: Number(draft.minPoints),
    maxPoints: draft.maxPoints.trim() === '' ? null : Number(draft.maxPoints),
    maxLoanAmount: Number(draft.maxLoanAmount),
  };
}

export function PassportRangesPage() {
  const [isPending, startTransition] = useTransition();
  const [ranges, setRanges] = useState<AdminScoreRange[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RangeDraft>(EMPTY_DRAFT);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadRanges(); }, []);

  async function loadRanges() {
    const data = await getAllScoreRangesAction();
    setRanges(data.sort((a, b) => a.minPoints - b.minPoints));
  }

  function openCreate() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setEditingImageUrl(null);
    setMessage(null);
    setImageError(null);
    setDialogOpen(true);
  }

  function openEdit(range: AdminScoreRange) {
    setEditingId(range.id);
    setDraft({
      categoryName: range.categoryName,
      minPoints: String(range.minPoints),
      maxPoints: range.maxPoints === null ? '' : String(range.maxPoints),
      maxLoanAmount: String(range.maxLoanAmount),
    });
    setEditingImageUrl(range.imageUrl);
    setMessage(null);
    setImageError(null);
    setDialogOpen(true);
  }

  async function handleImageSelected(file: File) {
    setImageError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Solo se aceptan JPEG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setImageError(`El archivo excede el máximo de ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }
    if (!editingId) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadScoreRangeImageAction(editingId, formData);
    setIsUploadingImage(false);

    if (result.ok) {
      setEditingImageUrl(result.imageUrl);
      await loadRanges();
    } else {
      setImageError(result.error);
    }
  }

  function handleSave() {
    setMessage(null);
    const request = draftToRequest(draft);

    startTransition(async () => {
      const result = editingId
        ? await updateScoreRangeAction(editingId, request)
        : await createScoreRangeAction(request);

      if (result.ok) {
        setDialogOpen(false);
        await loadRanges();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    });
  }

  function handleDeactivate(id: string) {
    startTransition(async () => {
      const result = await deactivateScoreRangeAction(id);
      if (result.ok) {
        await loadRanges();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    });
  }

  function handleActivate(id: string) {
    startTransition(async () => {
      const result = await activateScoreRangeAction(id);
      if (result.ok) {
        await loadRanges();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    });
  }

  if (ranges === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message?.type === 'error' && !dialogOpen && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{message.text}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Rangos del pasaporte</CardTitle>
              <CardDescription>
                Categoría, puntos requeridos y límite máximo de préstamo. Los rangos activos no pueden superponerse.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1.5" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> Agregar rango
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Imagen</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Categoría</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Rango de puntos</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Máx. préstamo</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ranges.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      Sin rangos configurados.
                    </td>
                  </tr>
                )}
                {ranges.map((range) => (
                  <tr key={range.id} className={`border-b last:border-0 ${!range.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5">
                      {range.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={range.imageUrl} alt={range.categoryName} className="w-9 h-9 rounded-md object-cover border" />
                      ) : (
                        <div className="w-9 h-9 rounded-md border border-dashed flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{range.categoryName}</td>
                    <td className="px-4 py-2.5 font-mono">{formatRangeLabel(range.minPoints, range.maxPoints)}</td>
                    <td className="px-4 py-2.5 font-mono">S/ {range.maxLoanAmount.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={range.isActive ? 'success' : 'secondary'} className="text-[10px]">
                        {range.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(range)} disabled={isPending}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {range.isActive ? (
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeactivate(range.id)} disabled={isPending}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0 text-success-600 hover:text-success-600"
                            onClick={() => handleActivate(range.id)} disabled={isPending}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setMessage(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar rango' : 'Nuevo rango'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {editingId && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Imagen</Label>
                <div className="flex items-center gap-3">
                  {editingImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editingImageUrl} alt="Imagen del rango" className="w-14 h-14 rounded-md object-cover border" />
                  ) : (
                    <div className="w-14 h-14 rounded-md border border-dashed flex items-center justify-center text-muted-foreground shrink-0">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={isUploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelected(file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs justify-center"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {editingImageUrl ? 'Reemplazar imagen' : 'Subir imagen'}
                  </Button>
                </div>
                {imageError && <p className="text-[10px] text-destructive">{imageError}</p>}
                <p className="text-[10px] text-muted-foreground">JPEG, PNG o WEBP — máx. {MAX_IMAGE_SIZE_MB}MB.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nombre de categoría</Label>
              <Input
                value={draft.categoryName}
                onChange={(e) => setDraft({ ...draft, categoryName: e.target.value })}
                placeholder="Ej: BRONCE"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Puntos desde</Label>
                <Input
                  type="number" min={0} value={draft.minPoints}
                  onChange={(e) => setDraft({ ...draft, minPoints: e.target.value })}
                  className="h-9 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Puntos hasta</Label>
                <Input
                  type="number" min={0} value={draft.maxPoints}
                  onChange={(e) => setDraft({ ...draft, maxPoints: e.target.value })}
                  placeholder="∞"
                  className="h-9 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Máximo de préstamo (S/)</Label>
              <Input
                type="number" min={0} step="0.01" value={draft.maxLoanAmount}
                onChange={(e) => setDraft({ ...draft, maxLoanAmount: e.target.value })}
                className="h-9 font-mono"
              />
            </div>

            {message?.type === 'error' && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{message.text}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setMessage(null); }}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !draft.categoryName || draft.minPoints === '' || draft.maxLoanAmount === ''}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
