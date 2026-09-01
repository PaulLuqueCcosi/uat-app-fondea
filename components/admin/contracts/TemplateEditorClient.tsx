'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Save, Eye, Loader2, Variable, Pencil, X, Maximize2, Minimize2, AlertTriangle, FileText,
} from 'lucide-react';
import {
  createTemplateVersionAction,
  activateTemplateAction,
  previewContractTemplateAction,
} from '@/app/actions/contracts.actions';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';
import { LexicalEditor, type LexicalEditorRef } from '../shared/editor/LexicalEditor';
import { cleanLexicalHtml } from '../shared/editor/html-cleaner';
import type { ContractVariable } from '@/modules/admin/admin-contracts.service';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import '../shared/editor/document-page.css';

interface TemplateEditorClientProps {
  documentTypeId: string;
  documentTypeCode: string;
  templateCode: string;
  documentTypeName: string;
  initialHtml: string;
  initialCss: string;
  currentVersion: number;
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
  const [saving, setSaving] = useState(false);

  // Preview del PDF (modal)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewProblems, setPreviewProblems] = useState<{ code: string; message: string; detail?: string }[] | undefined>(undefined);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Errores de guardar (mismo detalle que el preview: qué variable/etiqueta falló)
  const [saveProblems, setSaveProblems] = useState<{ code: string; message: string; detail?: string }[] | undefined>(undefined);

  const editorRef = useRef<LexicalEditorRef>(null);

  const hasChanges = htmlContent !== initialHtml;
  const isNewTemplate = currentVersion === 0;

  useEffect(() => {
    if (isNewTemplate) setEditMode(true);
  }, [isNewTemplate]);

  useEffect(() => {
    document.body.style.overflow = fullscreen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [fullscreen]);

  // ── Preview del PDF (renderiza con datos de ejemplo vía backend, ya limpio) ──
  const openPreview = useCallback(async () => {
    setPreviewOpen(true);
    setLoadingPreview(true);
    setPreviewError(null);
    setPreviewProblems(undefined);
    setPreviewHtml(null);
    const cleaned = cleanLexicalHtml(htmlContent);
    const result = await previewContractTemplateAction({ htmlContent: cleaned, documentTypeCode });
    setLoadingPreview(false);
    if (!result.ok) {
      setPreviewError(result.error ?? 'No se pudo generar la vista previa.');
      setPreviewProblems(result.problems);
      return;
    }
    setPreviewHtml(result.html ?? '');
  }, [htmlContent, documentTypeCode]);

  // ── Guardar (limpia el HTML de Lexical antes de enviar) ──
  const handleSave = useCallback(async () => {
    const cleaned = cleanLexicalHtml(htmlContent);
    if (!cleaned.trim()) {
      toast.error('El contenido no puede estar vacío');
      return;
    }

    setSaving(true);
    setSaveProblems(undefined);
    const result = await createTemplateVersionAction({
      documentTypeId,
      code: templateCode,
      htmlContent: cleaned,
    });

    if (!result.ok || !result.version) {
      setSaving(false);
      setSaveProblems(result.problems);
      toast.error(result.error ?? 'No se pudo guardar la plantilla.');
      return;
    }

    await activateTemplateAction(result.version.id);
    setSaving(false);
    toast.success(isNewTemplate ? 'Plantilla creada y activada' : `v${result.version.version} guardada y activada`);
    setFullscreen(false);
    setEditMode(false);
    startTransition(() => router.refresh());
  }, [htmlContent, documentTypeId, templateCode, isNewTemplate, router]);

  // ══════════════════════════════════════════════════════════════════════════
  // MODO VISTA — el template renderizado como un documento (hoja tipo PDF)
  // ══════════════════════════════════════════════════════════════════════════

  if (!editMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Plantilla activa — v{currentVersion}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={openPreview}>
              <FileText className="h-3.5 w-3.5" />
              Ver cómo saldría el PDF
            </Button>
            <Button size="sm" className="h-8 gap-2" onClick={() => setEditMode(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Editar plantilla
            </Button>
          </div>
        </div>

        {/* Documento renderizado como una hoja A4 */}
        <div className="fondea-doc-viewport">
          <div
            className="fondea-doc-page"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        <PdfPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          loading={loadingPreview}
          error={previewError}
          problems={previewProblems}
          html={previewHtml}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODO EDICIÓN
  // ══════════════════════════════════════════════════════════════════════════

  const editorContent = (
    <div className="space-y-4 h-full flex flex-col">
      {/* Toolbar superior */}
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
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={openPreview}>
            <Eye className="h-3.5 w-3.5" />
            Ver PDF
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {fullscreen ? 'Salir' : 'Expandir'}
          </Button>
          <Button
            size="sm"
            className="h-8 gap-2"
            disabled={saving || isPending || (!isNewTemplate && !hasChanges)}
            onClick={() => setConfirmSaveOpen(true)}
          >
            <Save className="h-3.5 w-3.5" />
            {isNewTemplate ? 'Crear' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Grid: editor + sidebar de variables */}
      <div className={`grid gap-4 flex-1 min-h-0 ${fullscreen ? 'grid-cols-[1fr_240px]' : 'grid-cols-1 lg:grid-cols-[1fr_260px]'}`}>
        <div className="min-h-0 flex flex-col gap-3">
          {saveProblems && saveProblems.length > 0 && (
            <SaveProblemsAlert problems={saveProblems} />
          )}
          <LexicalEditor
            ref={editorRef}
            value={htmlContent}
            onChange={setHtmlContent}
            height={fullscreen ? 'calc(100vh - 160px)' : 720}
          />
        </div>

        {/* Sidebar — variables permitidas */}
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

      <ConfirmAction
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title={isNewTemplate ? '¿Crear plantilla?' : '¿Guardar cambios?'}
        description={
          isNewTemplate
            ? 'Se creará la primera versión de la plantilla y se activará automáticamente.'
            : 'Se creará una nueva versión y se activará automáticamente. La versión anterior queda en el historial.'
        }
        confirmLabel={isNewTemplate ? 'Crear' : 'Guardar'}
        onConfirm={handleSave}
      />

      <PdfPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        loading={loadingPreview}
        error={previewError}
        problems={previewProblems}
        html={previewHtml}
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

// ── Alerta de errores al guardar (qué variable/etiqueta no está permitida) ───

function SaveProblemsAlert({ problems }: { problems: { code: string; message: string; detail?: string }[] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1.5 shrink-0">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="text-xs font-medium text-amber-800">
          No se pudo guardar — corrige lo siguiente:
        </h3>
      </div>
      <ul className="text-xs text-amber-700 space-y-1 pl-6">
        {problems.map((p, i) => (
          <li key={i} className="list-disc">
            {p.message}
            {p.detail && <span className="font-mono text-[11px]"> ({p.detail})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Modal de preview del PDF ──────────────────────────────────────────────────

function PdfPreviewDialog({
  open, onOpenChange, loading, error, problems, html,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  error: string | null;
  problems?: { code: string; message: string; detail?: string }[];
  html: string | null;
}) {
  // El backend devuelve el HTML renderizado con datos de ejemplo; lo mostramos dentro de
  // una "hoja" para que se vea como el PDF real.
  const srcDoc = html
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{margin:0;background:#e2e5e9;padding:24px;}
        .page{width:794px;min-height:1123px;margin:0 auto;background:#fff;
          padding:76px;box-sizing:border-box;box-shadow:0 0 0 1px #d0d4da,0 2px 12px rgba(0,0,0,.12);
          font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;}
        table{width:100%;border-collapse:collapse;margin:1rem 0;}
        th,td{border:1px solid #ddd;padding:8px;text-align:left;}
        th{background:#f5f5f5;}
       </style></head><body><div class="page">${html}</div></body></html>`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            Vista previa del PDF — con datos de ejemplo
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-[#e2e5e9]">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && error && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-6 overflow-auto py-6">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <p className="text-sm font-medium text-amber-700 max-w-md">{error}</p>
              {problems && problems.length > 0 && (
                <ul className="text-left text-xs text-muted-foreground bg-white rounded-md border p-3 max-w-lg w-full space-y-1.5">
                  {problems.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-600">•</span>
                      <span>
                        {p.message}
                        {p.detail && <span className="font-mono text-[11px] text-error-600"> ({p.detail})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {!loading && !error && html && (
            <iframe
              srcDoc={srcDoc}
              title="Vista previa del PDF"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
