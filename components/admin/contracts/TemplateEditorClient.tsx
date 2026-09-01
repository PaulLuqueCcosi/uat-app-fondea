'use client';

import { useState, useMemo, useTransition, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Save,
  Eye,
  EyeOff,
  Loader2,
  Variable,
  Pencil,
  X,
  Maximize2,
  Minimize2,
  AlertTriangle,
} from 'lucide-react';
import {
  createTemplateVersionAction,
  activateTemplateAction,
  previewContractTemplateAction,
} from '@/app/actions/contracts.actions';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';
import { TiptapEditor, type TiptapEditorRef } from './TiptapEditor';
import type { ContractVariable } from '@/modules/admin/admin-contracts.service';

// ── Component ─────────────────────────────────────────────────────────────────

interface TemplateEditorClientProps {
  documentTypeId: string;
  documentTypeCode: string;
  templateCode: string;
  documentTypeName: string;
  initialHtml: string;
  initialCss: string;
  currentVersion: number;
  /** Catálogo cerrado de variables permitidas para este documento — viene del backend. */
  variables: ContractVariable[];
}

export function TemplateEditorClient({
  documentTypeId,
  documentTypeCode,
  templateCode,
  initialHtml,
  currentVersion,
  variables,
}: TemplateEditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editMode, setEditMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState(initialHtml);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<TiptapEditorRef>(null);

  const hasChanges = htmlContent !== initialHtml;
  const isNewTemplate = currentVersion === 0;

  useEffect(() => {
    if (isNewTemplate) setEditMode(true);
  }, [isNewTemplate]);

  // Bloquear scroll en fullscreen
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [fullscreen]);

  // ── Preview (renderiza contra el backend real, con la misma validación que guardar) ──

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    setPreviewError(null);
    const html = await previewContractTemplateAction({ htmlContent, documentTypeCode });
    setLoadingPreview(false);
    if (html === null) {
      setPreviewError('El HTML no es válido — revisa que solo uses variables de la lista disponible.');
      setPreviewHtml(null);
      return;
    }
    setPreviewHtml(html);
  }, [htmlContent, documentTypeCode]);

  const handleTogglePreview = () => {
    if (!showPreview) loadPreview();
    setShowPreview(!showPreview);
  };

  // ── Save ────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!htmlContent.trim()) {
      toast.error('El contenido HTML no puede estar vacío');
      return;
    }

    setSaving(true);
    const result = await createTemplateVersionAction({
      documentTypeId,
      code: templateCode,
      htmlContent,
    });

    if (!result) {
      setSaving(false);
      toast.error('No se pudo guardar la plantilla. Revisa que las variables usadas existan en el catálogo y apliquen a este tipo de documento.');
      return;
    }

    await activateTemplateAction(result.id);
    setSaving(false);
    toast.success(isNewTemplate ? 'Plantilla creada' : `v${result.version} guardada y activada`);
    setFullscreen(false);
    setEditMode(false);
    startTransition(() => router.refresh());
  }, [htmlContent, documentTypeId, templateCode, isNewTemplate, router]);

  // ── Preview crudo (solo para el modo vista, sin llamar al backend) ────────

  const rawPreviewHtml = useMemo(() => {
    const content = editMode ? htmlContent : initialHtml;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="padding:20px;font-family:sans-serif;">${content}</body></html>`;
  }, [htmlContent, initialHtml, editMode]);

  // ═══════════════════════════════════════════════════════════════════════════
  // MODO VISTA
  // ═══════════════════════════════════════════════════════════════════════════

  if (!editMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Plantilla activa — v{currentVersion}
          </span>
          <Button size="sm" className="h-8 gap-2" onClick={() => setEditMode(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Editar plantilla
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden bg-white">
          <iframe
            srcDoc={rawPreviewHtml}
            title="Vista previa del template"
            className="w-full border-0"
            style={{ height: '600px' }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENIDO DEL EDITOR (usado tanto en normal como fullscreen)
  // ═══════════════════════════════════════════════════════════════════════════

  const editorContent = (
    <div className="space-y-4 h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {isNewTemplate ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
              Sin plantilla — crea una
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-xs"
              onClick={() => { setHtmlContent(initialHtml); setEditMode(false); setFullscreen(false); setShowPreview(false); }}
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={handleTogglePreview}
            disabled={loadingPreview}
          >
            {loadingPreview ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : showPreview ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {showPreview ? 'Ocultar' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {fullscreen ? 'Salir' : 'Expandir'}
          </Button>
          <Button
            size="sm"
            className="h-8 gap-2"
            disabled={saving || isPending || !htmlContent.trim() || (!isNewTemplate && !hasChanges)}
            onClick={() => setConfirmSaveOpen(true)}
          >
            <Save className="h-3.5 w-3.5" />
            {isNewTemplate ? 'Crear' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className={`grid gap-4 flex-1 min-h-0 ${fullscreen ? 'grid-cols-[1fr_240px]' : 'grid-cols-1 lg:grid-cols-[1fr_260px]'}`}>
        <div className="space-y-4 overflow-y-auto">
          {/* Editor */}
          <TiptapEditor ref={editorRef} value={htmlContent} onChange={setHtmlContent} height={fullscreen ? 'calc(100vh - 220px)' : 700} />

          {/* Preview inline — renderizado real del backend, con validación */}
          {showPreview && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Vista previa (renderizada con datos de ejemplo, vía backend)
              </Label>
              <div className="border rounded-lg overflow-hidden bg-white">
                {previewError ? (
                  <div className="h-24 flex flex-col items-center justify-center gap-1.5 text-center px-4">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-xs text-amber-700">{previewError}</p>
                  </div>
                ) : previewHtml ? (
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="padding:20px;font-family:serif;">${previewHtml}</body></html>`}
                    title="Preview"
                    className="w-full border-0"
                    style={{ height: '450px' }}
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
                    {loadingPreview ? 'Generando vista previa...' : 'Sin datos de vista previa'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — variables permitidas para ESTE tipo de documento */}
        <div className="space-y-3 overflow-y-auto">
          <div className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Variable className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-medium">Insertar variable</h3>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Solo estos keys están permitidos para este documento. Click para insertar en el cursor:
            </p>
            <div className="flex flex-col gap-1.5">
              {variables.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className="text-left px-2 py-1.5 rounded-md text-[11px] border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  onClick={() => editorRef.current?.insertText(v.usage)}
                  title={v.description}
                >
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    {v.label}
                    {v.universal && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 leading-none">
                        universal
                      </Badge>
                    )}
                  </span>
                  <span className="block font-mono text-[9px] text-muted-foreground mt-0.5">{v.usage}</span>
                </button>
              ))}
              {variables.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">
                  No hay variables definidas para este tipo de documento todavía.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal confirmación */}
      <ConfirmAction
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title={isNewTemplate ? '¿Crear plantilla?' : '¿Guardar cambios?'}
        description={
          isNewTemplate
            ? 'Se creará la primera versión de la plantilla y se activará automáticamente.'
            : 'Se creará una nueva versión de la plantilla y se activará automáticamente. La versión anterior quedará registrada en el historial.'
        }
        confirmLabel={isNewTemplate ? 'Crear' : 'Guardar'}
        onConfirm={handleSave}
      />
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — Fullscreen usa portal, normal render inline
  // ═══════════════════════════════════════════════════════════════════════════

  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto p-4">
        {editorContent}
      </div>,
      document.body,
    );
  }

  return editorContent;
}
