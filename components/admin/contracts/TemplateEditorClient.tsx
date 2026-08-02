'use client';

import { useState, useMemo, useTransition, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { createTemplateVersionAction, activateTemplateAction } from '@/app/actions/contracts.actions';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';
import { JoditEditor, type JoditEditorRef } from './JoditEditor';

// ── Variables del sistema (botones insertables) ───────────────────────────────

const SYSTEM_VARIABLES = [
  { label: 'Nombre completo', value: '{{userName}}' },
  { label: 'DNI', value: '{{userDni}}' },
  { label: 'Monto prestado', value: '{{currency principal}}' },
  { label: 'Plazo (días)', value: '{{termDays}}' },
  { label: 'N° cuotas', value: '{{installmentCount}}' },
  { label: 'Cuota mensual', value: '{{currency monthlyPayment}}' },
  { label: 'Total a pagar', value: '{{currency totalToPay}}' },
  { label: '1ra cuota (fecha)', value: '{{date firstDueDate}}' },
  { label: 'Fecha de firma', value: '{{date signatureDate}}' },
  { label: 'Cronograma de pagos', value: '{{cronograma schedule}}' },
  { label: 'Bloque de firma', value: '{{firma}}' },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface TemplateEditorClientProps {
  documentTypeId: string;
  templateCode: string;
  documentTypeName: string;
  initialHtml: string;
  initialCss: string;
  currentVersion: number;
}

export function TemplateEditorClient({
  documentTypeId,
  templateCode,
  documentTypeName,
  initialHtml,
  initialCss,
  currentVersion,
}: TemplateEditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editMode, setEditMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState(initialHtml);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<JoditEditorRef>(null);

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
      toast.error('No se pudo guardar la plantilla.');
      return;
    }

    await activateTemplateAction(result.id);
    setSaving(false);
    toast.success(isNewTemplate ? 'Plantilla creada' : `v${result.version} guardada y activada`);
    setFullscreen(false);
    setEditMode(false);
    startTransition(() => router.refresh());
  }, [htmlContent, documentTypeId, templateCode, isNewTemplate, router]);

  // ── Preview HTML ────────────────────────────────────────────────────────

  const previewHtml = useMemo(() => {
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
            srcDoc={previewHtml}
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
              onClick={() => { setHtmlContent(initialHtml); setEditMode(false); setFullscreen(false); }}
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
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
      <div className={`grid gap-4 flex-1 min-h-0 ${fullscreen ? 'grid-cols-[1fr_200px]' : 'grid-cols-1 lg:grid-cols-[1fr_220px]'}`}>
        <div className="space-y-4 overflow-y-auto">
          {/* Editor */}
          <JoditEditor ref={editorRef} value={htmlContent} onChange={setHtmlContent} height={fullscreen ? 'calc(100vh - 150px)' : 700} />

          {/* Preview inline */}
          {showPreview && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vista previa</Label>
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe srcDoc={previewHtml} title="Preview" className="w-full border-0" style={{ height: '400px' }} sandbox="allow-same-origin" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Botones de variables */}
        <div className="space-y-3 overflow-y-auto">
          <div className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Variable className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-medium">Insertar variable</h3>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Click para insertar en la posición del cursor:
            </p>
            <div className="flex flex-col gap-1.5">
              {SYSTEM_VARIABLES.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  className="text-left px-2 py-1.5 rounded-md text-[11px] border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  onClick={() => editorRef.current?.insertText(v.value)}
                >
                  <span className="font-medium text-foreground">{v.label}</span>
                  <span className="block font-mono text-[9px] text-muted-foreground mt-0.5">{v.value}</span>
                </button>
              ))}
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
