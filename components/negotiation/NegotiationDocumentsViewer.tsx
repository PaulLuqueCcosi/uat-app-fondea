'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Maximize2, X, Download, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { NegotiationOfferDocument } from '@/modules/negotiation-offers';

// ── Visor de documento aislado (iframe imperativo para evitar React reconciliation issues) ──

function DocumentViewer({ html, height = '500px' }: { html: string; height?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !html) return;
    // Limpiar contenido previo
    containerRef.current.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-same-origin');
    iframe.title = 'Documento de negociación';
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = height;
    containerRef.current.appendChild(iframe);
    iframe.srcdoc = html;
  }, [html, height]);

  return <div ref={containerRef} />;
}

// ── Modal fullscreen ────────────────────────────────────────────────────────

function DocumentFullscreenModal({ html, title, onClose }: { html: string; title: string; onClose: () => void }) {
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    if (!iframeContainerRef.current || !html) return;
    iframeContainerRef.current.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-same-origin');
    iframe.title = title;
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.minHeight = '100%';
    iframeContainerRef.current.appendChild(iframe);
    iframe.srcdoc = html;
  }, [html, title]);

  return (
    <div className="fixed inset-0 z-9999 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-neutral-50 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
          <span className="ml-1 hidden sm:inline">Cerrar</span>
        </Button>
      </div>
      <div className="flex-1 overflow-auto" ref={iframeContainerRef} />
    </div>
  );
}

// ── Props ───────────────────────────────────────────────────────────────────

interface NegotiationDocumentsViewerProps {
  offerId: string;
  documents: NegotiationOfferDocument[];
  /** Si la oferta ya fue firmada (ACCEPTED) */
  isSigned: boolean;
}

// ── Componente principal ────────────────────────────────────────────────────

export function NegotiationDocumentsViewer({ offerId, documents, isSigned }: NegotiationDocumentsViewerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [htmlMap, setHtmlMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Documentos visibles según el estado
  const visibleDocs = isSigned
    ? documents
    : documents.filter(d => d.visibleBeforeSignature);

  const activeDoc = visibleDocs[activeTab] ?? null;
  const activeHtml = activeDoc ? htmlMap[activeDoc.contractId] ?? null : null;

  // Cargar HTML de los documentos visibles
  const loadHtmls = useCallback(async () => {
    if (visibleDocs.length === 0) return;
    setLoading(true);
    const newMap: Record<string, string> = {};
    for (const doc of visibleDocs) {
      try {
        const res = await fetch(`/api/negotiation-offers/${offerId}/documents/${doc.contractId}/html`, { cache: 'no-store' });
        if (res.ok) newMap[doc.contractId] = await res.text();
      } catch {
        // silently skip
      }
    }
    setHtmlMap(newMap);
    setLoading(false);
  }, [offerId, visibleDocs.length]);

  useEffect(() => {
    loadHtmls();
  }, [loadHtmls]);

  if (visibleDocs.length === 0) return null;

  // ── Estado firmado: mostrar con botón PDF ─────────────────────────────────

  if (isSigned) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border bg-success-50/30">
          <p className="text-sm font-medium text-success-900 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Documentos firmados
          </p>
        </div>
        <div className="p-4 space-y-3">
          {documents.map((doc) => (
            <div key={doc.contractId} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{doc.name}</span>
              </div>
              {doc.pdfUrl ? (
                <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    Descargar PDF
                  </Button>
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">PDF no disponible</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // ── Estado pre-firma: mostrar HTML inline ─────────────────────────────────

  return (
    <Card className="overflow-hidden">
      {/* Tabs si hay más de un documento */}
      {visibleDocs.length > 1 && (
        <div className="flex gap-1 border-b border-border px-4 pt-2">
          {visibleDocs.map((doc, i) => (
            <button
              key={doc.contractId}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {doc.name}
            </button>
          ))}
        </div>
      )}

      {/* Header del documento activo */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-primary" />
          {activeDoc?.name ?? 'Documento'}
        </h3>
        <div className="flex items-center gap-2">
          {activeHtml && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullscreen(true)}
              title="Ver en pantalla completa"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            PDF disponible al firmar
          </span>
        </div>
      </div>

      {/* Contenido — iframe */}
      <div className="bg-white">
        {activeHtml ? (
          <DocumentViewer html={activeHtml} />
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No se pudo cargar el documento.</p>
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {showFullscreen && activeHtml && activeDoc && (
        <DocumentFullscreenModal
          html={activeHtml}
          title={activeDoc.name}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </Card>
  );
}
