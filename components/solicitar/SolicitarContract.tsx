'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Check, AlertCircle, PenLine, Loader2, Maximize2, X } from 'lucide-react';
import { signContractAction } from '@/app/actions/application.actions';
import {
  getContractInfoAction,
  getContractHtmlAction,
  getContractPdfUrlAction,
  type ContractInfo,
} from '@/app/actions/contract.actions';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';

interface FunnelContractProps {
  applicationId?: string;
}

// ── Visor de contrato aislado (iframe) ──────────────────────────────────────

function ContractViewer({ html, height = '500px' }: { html: string; height?: string }) {
  return (
    <iframe
      srcDoc={html}
      sandbox="allow-same-origin"
      title="Contrato de préstamo"
      style={{ border: 'none', width: '100%', height }}
    />
  );
}

// ── Modal fullscreen para el contrato ───────────────────────────────────────

function ContractFullscreenModal({
  html,
  onClose,
}: {
  html: string;
  onClose: () => void;
}) {
  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-9999 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-neutral-50 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Contrato de Mutuo Dinerario</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
          <span className="ml-1 hidden sm:inline">Cerrar</span>
        </Button>
      </div>

      {/* Iframe fullscreen */}
      <div className="flex-1 overflow-auto">
        <iframe
          srcDoc={html}
          sandbox="allow-same-origin"
          className="w-full h-full"
          title="Contrato de préstamo — pantalla completa"
          style={{ border: 'none', minHeight: '100%' }}
        />
      </div>
    </div>,
    document.body,
  );
}

// ── Componente principal ────────────────────────────────────────────────────

export function FunnelContract({ applicationId }: FunnelContractProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    contractInfo: ctxContractInfo,
    contractHtml: ctxContractHtml,
    pdfUrl: ctxPdfUrl,
    contractReady,
    refreshContract,
  } = useSolicitudStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [fullName, setFullName] = useState('');

  // Estado del contrato — desde contexto si disponible
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(ctxContractInfo);
  const [contractHtml, setContractHtml] = useState<string | null>(ctxContractHtml);
  const [pdfUrl, setPdfUrl] = useState<string | null>(ctxPdfUrl);
  const [loadingContract, setLoadingContract] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const isInSolicitudFlow = pathname.includes('/solicitudes/');
  const solicitudId = applicationId;

  const isSigned = contractInfo?.status === 'SIGNED';
  const isExpired = contractInfo?.status === 'EXPIRED';

  // Sincronizar con contexto cuando los datos llegan
  useEffect(() => {
    if (ctxContractInfo) setContractInfo(ctxContractInfo);
    if (ctxContractHtml) setContractHtml(ctxContractHtml);
    if (ctxPdfUrl) setPdfUrl(ctxPdfUrl);
  }, [ctxContractInfo, ctxContractHtml, ctxPdfUrl]);

  // Cargar solo si estamos fuera del flujo de solicitudes (sin provider)
  useEffect(() => {
    if (isInSolicitudFlow || !solicitudId) return;

    async function loadContract() {
      setLoadingContract(true);
      try {
        const info = await getContractInfoAction(solicitudId!);
        if (!info) { setLoadingContract(false); return; }
        setContractInfo(info);

        const html = await getContractHtmlAction(info.contractId);
        setContractHtml(html);

        if (info.status === 'SIGNED') {
          const url = await getContractPdfUrlAction(info.contractId);
          setPdfUrl(url);
        }
      } catch (err) {
        console.error('Error cargando contrato:', err);
      } finally {
        setLoadingContract(false);
      }
    }

    loadContract();
  }, [solicitudId, isInSolicitudFlow]);

  const handleDownloadPdf = async () => {
    if (!contractInfo) return;

    setDownloadingPdf(true);
    try {
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
        return;
      }

      const url = await getContractPdfUrlAction(contractInfo.contractId);
      if (url) {
        setPdfUrl(url);
        window.open(url, '_blank');
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSubmit = async () => {
    if (!accepted) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    if (!fullName.trim()) {
      setError('Debes ingresar tu nombre completo para firmar');
      return;
    }

    if (fullName.trim().length < 5) {
      setError('El nombre debe tener al menos 5 caracteres');
      return;
    }

    if (!solicitudId) {
      setError('No se encontró la solicitud activa');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signContractAction(solicitudId, fullName);

      if (!result.success) {
        setError(result.error ?? 'Error al firmar el contrato');
        setLoading(false);
        return;
      }

      // Actualizar el estado del contrato en el store
      setTimeout(() => refreshContract(), 0);

      if (isInSolicitudFlow) {
        router.push(`/solicitudes/${solicitudId}/aprobada`);
      } else {
        router.push('/solicitar/contract-signed');
      }
    } catch (err) {
      console.error('Error signing contract:', err);
      setError('Error al firmar el contrato. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state — ya no bloquea toda la página ──
  // El skeleton se muestra inline en el área del contrato

  // ── No contract found (y no está cargando) ────────────────────────────────

  if (!contractInfo && contractReady && !loadingContract) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-warning-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-warning-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Contrato no disponible</h2>
            <p className="text-muted-foreground max-w-md">
              El contrato aún no ha sido generado para esta solicitud. Esto puede tardar unos momentos.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Expired state ──────────────────────────────────────────────────────────

  if (isExpired) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-warning-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-warning-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Contrato expirado</h2>
            <Button
              variant="outline"
              onClick={() => router.push(`/solicitudes/${solicitudId}`)}
            >
              Volver al resumen
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Signed state — solo mostrar contrato + descargar PDF ──────────────────

  if (isSigned) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">
            Contrato Firmado
          </h1>
          <p className="text-fondea-text">
            Tu contrato fue firmado exitosamente el{' '}
            {contractInfo.signedAt
              ? new Date(contractInfo.signedAt).toLocaleDateString('es-PE', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
              : '—'}
            .
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Contrato de Mutuo Dinerario
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullscreen(true)}
                  title="Ver en pantalla completa"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Descargar PDF
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden bg-white">
              {contractHtml ? (
                <ContractViewer html={contractHtml} />
              ) : (
                <div className="p-6 space-y-4 animate-pulse">
                  <div className="h-6 bg-neutral-100 rounded w-2/3 mx-auto" />
                  <div className="h-px bg-neutral-100 w-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-50 rounded w-full" />
                    <div className="h-4 bg-neutral-50 rounded w-5/6" />
                    <div className="h-4 bg-neutral-50 rounded w-4/6" />
                  </div>
                  <div className="h-5 bg-neutral-100 rounded w-1/2 mt-6" />
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-50 rounded w-full" />
                    <div className="h-4 bg-neutral-50 rounded w-3/4" />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Signed badge */}
          <div className="bg-success-50 border border-success-200 rounded-xl p-5">
            <div className="flex gap-3">
              <Check className="w-5 h-5 text-success-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-success-900">Contrato firmado correctamente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen modal */}
        {showFullscreen && contractHtml && (
          <ContractFullscreenModal
            html={contractHtml}
            onClose={() => setShowFullscreen(false)}
          />
        )}
      </div>
    );
  }

  // ── Normal state — mostrar contrato + formulario de firma ─────────────────

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">
          Contrato de Préstamo
        </h1>
        <p className="text-fondea-text">
          Revisa y firma tu contrato para finalizar el proceso.
        </p>
      </div>

      <div className="space-y-6">
        {/* Contract viewer */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Contrato de Mutuo Dinerario
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullscreen(true)}
                title="Ver en pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                PDF disponible al firmar
              </span>
            </div>
          </div>

          {/* Contract content — iframe aislado */}
          <div className="rounded-lg border border-border overflow-hidden bg-white">
            {contractHtml ? (
              <ContractViewer html={contractHtml} />
            ) : (loadingContract || !contractReady) ? (
              <div className="p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-neutral-100 rounded w-2/3 mx-auto" />
                <div className="h-px bg-neutral-100 w-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-50 rounded w-full" />
                  <div className="h-4 bg-neutral-50 rounded w-5/6" />
                  <div className="h-4 bg-neutral-50 rounded w-4/6" />
                </div>
                <div className="h-5 bg-neutral-100 rounded w-1/2 mt-6" />
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-50 rounded w-full" />
                  <div className="h-4 bg-neutral-50 rounded w-3/4" />
                  <div className="h-4 bg-neutral-50 rounded w-5/6" />
                  <div className="h-4 bg-neutral-50 rounded w-2/3" />
                </div>
                <div className="h-5 bg-neutral-100 rounded w-1/3 mt-6" />
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-50 rounded w-full" />
                  <div className="h-4 bg-neutral-50 rounded w-4/5" />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se pudo cargar el contenido del contrato.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Terms acceptance */}
        <Card className="p-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="w-5 h-5 border-2 border-border rounded checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
              />
              {accepted && (
                <Check className="w-3 h-3 text-white absolute top-1 left-1 pointer-events-none" />
              )}
            </div>
            <div className="text-sm">
              <p className="text-dark group-hover:text-primary transition-colors">
                He leído y acepto los <strong>términos y condiciones</strong> del contrato de
                préstamo, así como la <strong>política de privacidad</strong> y el{' '}
                <strong>cronograma de pagos</strong>.
              </p>
            </div>
          </label>
        </Card>

        {/* Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-dark">
              <p className="font-semibold mb-1">Antes de firmar, asegúrate de:</p>
              <ul className="space-y-1 list-disc ml-4 text-fondea-text">
                <li>Haber leído todo el contrato</li>
                <li>Entender las condiciones del préstamo</li>
                <li>Estar de acuerdo con el monto, plazo y cuota mensual</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Firma Digital */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PenLine className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-dark">Firma Digital</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-dark mb-2">
                Nombre completo
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ej: Juan Carlos Pérez García"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-fondea-text mt-2">
                Al escribir tu nombre completo, estás firmando digitalmente este contrato
              </p>
            </div>

            {fullName.trim() && (
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-xs text-fondea-text mb-2">Vista previa de tu firma:</p>
                <p className="text-2xl font-signature text-primary text-center py-3 italic">
                  {fullName}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-error/10 border border-error rounded-lg">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!accepted || !fullName.trim() || fullName.trim().length < 5 || loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Firmando...' : 'Firmar y finalizar →'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Fullscreen modal */}
      {showFullscreen && contractHtml && (
        <ContractFullscreenModal
          html={contractHtml}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </div>
  );
}
