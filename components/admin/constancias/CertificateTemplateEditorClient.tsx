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
  History,
} from 'lucide-react';
import {
  createCertificateTemplateVersionAction,
  activateCertificateTemplateAction,
  previewCertificateTemplateAction,
} from '@/app/actions/constancias.actions';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';
import { JoditEditor, type JoditEditorRef } from '@/components/admin/contracts/JoditEditor';
import type { CertificateTemplateVersion, CertificateVariable } from '@/modules/admin/admin-constancias.types';

const TEMPLATE_CODE = 'payoff-certificate';

interface CertificateTemplateEditorClientProps {
  versions: CertificateTemplateVersion[];
  variables: CertificateVariable[];
}

export function CertificateTemplateEditorClient({ versions, variables }: CertificateTemplateEditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeVersion = versions.find((v) => v.active) ?? versions[0] ?? null;
  const isNewTemplate = !activeVersion;

  const [editMode, setEditMode] = useState(isNewTemplate);
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState(activeVersion?.htmlContent ?? '');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<JoditEditorRef>(null);

  const initialHtml = activeVersion?.htmlContent ?? '';
  const hasChanges = htmlContent !== initialHtml;

  useEffect(() => {
    if (fullscreen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [fullscreen]);

  // ── Preview (renderiza contra el backend real, con validación incluida) ──

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    const html = await previewCertificateTemplateAction({ htmlContent });
    setLoadingPreview(false);
    if (html === null) {
      toast.error('El HTML no es válido — revisa que no uses variables o etiquetas no permitidas.');
      return;
    }
    setPreviewHtml(html);
  }, [htmlContent]);

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
    const result = await createCertificateTemplateVersionAction({
      code: TEMPLATE_CODE,
      name: 'Constancia de No Adeudo',
      htmlContent,
    });

    if (!result) {
      setSaving(false);
      toast.error('No se pudo guardar la plantilla. Revisa que las variables usadas existan en el catálogo.');
      return;
    }

    await activateCertificateTemplateAction(result.id);
    setSaving(false);
    toast.success(isNewTemplate ? 'Plantilla creada y activada' : `v${result.version} guardada y activada`);
    setFullscreen(false);
    setEditMode(false);
    startTransition(() => router.refresh());
  }, [htmlContent, isNewTemplate, router]);

  const rawPreviewHtml = useMemo(() => {
    const content = editMode ? htmlContent : initialHtml;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="padding:20px;font-family:serif;">${content}</body></html>`;
  }, [htmlContent, initialHtml, editMode]);

  // ═══════════════════════════════════════════════════════════════════════
  // MODO VISTA
  // ═══════════════════════════════════════════════════════════════════════

  if (!editMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Plantilla activa — v{activeVersion?.version}
            </span>
            <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Activa</Badge>
          </div>
          <Button size="sm" className="h-8 gap-2" onClick={() => setEditMode(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Editar plantilla
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden bg-white">
          <iframe
            srcDoc={rawPreviewHtml}
            title="Vista previa de la constancia"
            className="w-full border-0"
            style={{ height: '700px' }}
            sandbox="allow-same-origin"
          />
        </div>

        {versions.length > 1 && (
          <VersionHistory versions={versions} />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EDITOR
  // ═══════════════════════════════════════════════════════════════════════

  const editorContent = (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {isNewTemplate ? (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
              Sin plantilla — crea la primera
            </Badge>
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
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleTogglePreview} disabled={loadingPreview}>
            {loadingPreview ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : showPreview ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {showPreview ? 'Ocultar' : 'Preview'}
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setFullscreen(!fullscreen)}>
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

      <div className={`grid gap-4 flex-1 min-h-0 ${fullscreen ? 'grid-cols-[1fr_240px]' : 'grid-cols-1 lg:grid-cols-[1fr_260px]'}`}>
        <div className="space-y-4 overflow-y-auto">
          <JoditEditor
            ref={editorRef}
            value={htmlContent}
            onChange={setHtmlContent}
            height={fullscreen ? 'calc(100vh - 150px)' : 700}
          />

          {showPreview && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Vista previa (renderizada con datos de ejemplo, vía backend)
              </Label>
              <div className="border rounded-lg overflow-hidden bg-white">
                {previewHtml ? (
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

        {/* Sidebar — variables permitidas */}
        <div className="space-y-3 overflow-y-auto">
          <div className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Variable className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-medium">Insertar variable</h3>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Solo estos keys están permitidos. Click para insertar en el cursor:
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
                  <span className="font-medium text-foreground">{v.label}</span>
                  <span className="block font-mono text-[9px] text-muted-foreground mt-0.5">{v.usage}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmAction
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title={isNewTemplate ? '¿Crear plantilla?' : '¿Guardar cambios?'}
        description={
          isNewTemplate
            ? 'Se creará la primera versión de la plantilla de Constancia de No Adeudo y se activará automáticamente.'
            : 'Se creará una nueva versión y se activará automáticamente. La versión anterior queda registrada en el historial.'
        }
        confirmLabel={isNewTemplate ? 'Crear' : 'Guardar'}
        onConfirm={handleSave}
      />
    </div>
  );

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

// ── Historial de versiones ───────────────────────────────────────────────────

function VersionHistory({ versions }: { versions: CertificateTemplateVersion[] }) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-medium">Historial de versiones</h3>
      </div>
      <div className="space-y-1">
        {versions.map((v) => (
          <div key={v.id} className="flex items-center justify-between text-xs py-1 border-b last:border-b-0">
            <span className="text-muted-foreground">
              v{v.version} — {new Date(v.createdAt).toLocaleDateString('es-PE')} — {v.createdBy}
            </span>
            {v.active && <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Activa</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}
