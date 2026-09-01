'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Download, Mail, RotateCcw, Loader2, AlertTriangle, Info, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  markCertificateDeliveredAction,
  reissueCertificateAction,
} from '@/app/actions/constancias.actions';
import {
  CERTIFICATE_STATUS_LABELS,
  DELIVERY_STATUS_LABELS,
  type CertificateDeliveryStatus,
  type CertificateStatus,
  type PayoffCertificate,
} from '@/modules/admin/admin-constancias.types';

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<CertificateStatus, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary',
  ISSUED: 'default',
  FAILED: 'destructive',
};

const DELIVERY_VARIANT: Record<CertificateDeliveryStatus, 'default' | 'secondary' | 'destructive'> = {
  NOT_SENT: 'secondary',
  SENT: 'default',
  DELIVERY_FAILED: 'destructive',
};

/** Texto del trigger del filtro — el componente Select de base-ui no resuelve la label solo. */
const STATUS_FILTER_LABELS: Record<string, string> = {
  all: 'Todos los estados',
  ISSUED: 'Emitidas',
  PENDING: 'Pendientes',
  FAILED: 'Fallidas',
};

const DELIVERY_FILTER_LABELS: Record<string, string> = {
  all: 'Todos los envíos',
  NOT_SENT: 'No enviadas',
  SENT: 'Enviadas',
  DELIVERY_FAILED: 'Envío fallido',
};

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortId(id: string) {
  return id.slice(-8);
}

// ── Props ───────────────────────────────────────────────────────────────────

interface CertificatesTableProps {
  data: PayoffCertificate[];
  currentStatus: string;
  currentDeliveryStatus: string;
  page: number;
  totalPages: number;
  totalItems: number;
}

// ── Component ───────────────────────────────────────────────────────────────

export function CertificatesTable({
  data,
  currentStatus,
  currentDeliveryStatus,
  page,
  totalPages,
  totalItems,
}: CertificatesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [rowLoading, setRowLoading] = useState<string | null>(null);
  const [reissueTarget, setReissueTarget] = useState<PayoffCertificate | null>(null);
  const [previewCert, setPreviewCert] = useState<PayoffCertificate | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => router.push(`/admin/constancias?${params.toString()}`));
    },
    [router],
  );

  const handleFilterChange = useCallback(
    (key: 'status' | 'deliveryStatus', value: string | null) => {
      if (!value) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') params.delete(key);
      else params.set(key, value);
      params.set('page', '1');
      updateUrl(params);
    },
    [searchParams, updateUrl],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      updateUrl(params);
    },
    [searchParams, updateUrl],
  );

  const handleRefresh = () => startTransition(() => router.refresh());

  // ── Acciones ────────────────────────────────────────────────────────────

  const handleDownload = async (id: string) => {
    setRowLoading(id);
    try {
      const res = await fetch(`/api/admin/constancias/${id}/pdf`);
      if (res.ok) {
        const { pdfUrl } = await res.json();
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('El PDF todavía no está disponible para esta constancia.');
      }
    } finally {
      setRowLoading(null);
    }
  };

  /** Abre el PDF en un modal (iframe) — misma URL prefirmada que "Descargar", sin salir de la página. */
  const handlePreview = async (cert: PayoffCertificate) => {
    setPreviewCert(cert);
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const res = await fetch(`/api/admin/constancias/${cert.id}/pdf`);
      if (res.ok) {
        const { pdfUrl } = await res.json();
        setPreviewUrl(pdfUrl);
      } else {
        toast.error('El PDF todavía no está disponible para esta constancia.');
        setPreviewCert(null);
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleMarkDelivered = async (id: string) => {
    setRowLoading(`deliver-${id}`);
    const result = await markCertificateDeliveredAction(id);
    setRowLoading(null);
    if (result) {
      toast.success('Constancia marcada como enviada.');
      handleRefresh();
    } else {
      toast.error('No se pudo actualizar el estado de envío.');
    }
  };

  const runReissue = async (creditId: string) => {
    setRowLoading(`reissue-${creditId}`);
    const result = await reissueCertificateAction(creditId);
    setRowLoading(null);
    if (result) {
      toast.success('Constancia regenerada correctamente.');
      handleRefresh();
    } else {
      toast.error('No se pudo regenerar la constancia. Verifica que el crédito esté liquidado.');
    }
  };

  /** Si ya se notificó al cliente, se pide confirmación antes de regenerar el documento. */
  const handleReissueClick = (cert: PayoffCertificate) => {
    if (cert.alreadySent) {
      setReissueTarget(cert);
      return;
    }
    runReissue(cert.creditId);
  };

  const confirmReissueAfterSent = () => {
    if (!reissueTarget) return;
    runReissue(reissueTarget.creditId);
    setReissueTarget(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Select value={currentStatus} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger className="h-9 w-44 text-sm">
              <SelectValue placeholder="Estado de emisión">
                {(value: string) => STATUS_FILTER_LABELS[value] ?? 'Estado de emisión'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="ISSUED">Emitidas</SelectItem>
              <SelectItem value="PENDING">Pendientes</SelectItem>
              <SelectItem value="FAILED">Fallidas</SelectItem>
            </SelectContent>
          </Select>
          <StatusInfoTooltip
            title="Estado de emisión — ¿existe el PDF?"
            items={[
              ['Pendiente', 'El registro se creó, el PDF todavía se está generando.'],
              ['Emitida', 'El PDF ya existe y se puede descargar.'],
              ['Fallida', 'El PDF no se pudo generar. Se reintenta solo o con "Recrear".'],
            ]}
          />
        </div>

        <div className="flex items-center gap-1">
          <Select value={currentDeliveryStatus} onValueChange={(v) => handleFilterChange('deliveryStatus', v)}>
            <SelectTrigger className="h-9 w-44 text-sm">
              <SelectValue placeholder="Estado de envío">
                {(value: string) => DELIVERY_FILTER_LABELS[value] ?? 'Estado de envío'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los envíos</SelectItem>
              <SelectItem value="NOT_SENT">No enviadas</SelectItem>
              <SelectItem value="SENT">Enviadas</SelectItem>
              <SelectItem value="DELIVERY_FAILED">Envío fallido</SelectItem>
            </SelectContent>
          </Select>
          <StatusInfoTooltip
            title="Estado de envío — ¿el cliente lo recibió?"
            items={[
              ['No enviada', 'La constancia existe pero todavía no se notificó al cliente.'],
              ['Enviada', 'Ya se le notificó el documento al cliente.'],
              ['Envío fallido', 'Se intentó notificar y falló (ej. correo inválido).'],
            ]}
          />
        </div>

        <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleRefresh} disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Actualizar
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs">Emitida</TableHead>
              <TableHead className="text-xs">Código</TableHead>
              <TableHead className="text-xs">Crédito</TableHead>
              <TableHead className="text-xs">Usuario</TableHead>
              <TableHead className="text-xs">
                <div className="flex items-center gap-1">
                  Estado
                  <StatusInfoTooltip
                    title="Estado de emisión — ¿existe el PDF?"
                    items={[
                      ['Pendiente', 'El registro se creó, el PDF todavía se está generando.'],
                      ['Emitida', 'El PDF ya existe y se puede descargar.'],
                      ['Fallida', 'El PDF no se pudo generar. Se reintenta solo o con "Recrear".'],
                    ]}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">
                <div className="flex items-center gap-1">
                  Envío
                  <StatusInfoTooltip
                    title="Estado de envío — ¿el cliente lo recibió?"
                    items={[
                      ['No enviada', 'La constancia existe pero todavía no se notificó al cliente.'],
                      ['Enviada', 'Ya se le notificó el documento al cliente.'],
                      ['Envío fallido', 'Se intentó notificar y falló (ej. correo inválido).'],
                    ]}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-sm">
                  No hay constancias que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
            {data.map((cert) => (
              <TableRow key={cert.id} className="hover:bg-muted/30">
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                  {formatDateTime(cert.issuedAt ?? cert.createdAt)}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    {cert.certificateCode}
                  </span>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/credits/${cert.creditId}`}
                    className="text-primary hover:underline font-mono text-xs"
                  >
                    #{shortId(cert.creditId)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/users/${cert.userId}`}
                    className="text-primary hover:underline font-mono text-xs"
                  >
                    #{shortId(cert.userId)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[cert.status]} className="text-[10px]">
                    {CERTIFICATE_STATUS_LABELS[cert.status]}
                  </Badge>
                  {cert.status === 'FAILED' && cert.failureReason && (
                    <p className="text-[10px] text-red-600 mt-0.5 max-w-48 truncate" title={cert.failureReason}>
                      {cert.failureReason}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={DELIVERY_VARIANT[cert.deliveryStatus]} className="text-[10px]">
                    {DELIVERY_STATUS_LABELS[cert.deliveryStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {/* Ver — abre el PDF en un modal (iframe), sin salir de la página */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={cert.downloadable ? 'Ver PDF' : 'Todavía no hay PDF generado'}
                      disabled={!cert.downloadable || previewLoading}
                      onClick={() => handlePreview(cert)}
                    >
                      {previewLoading && previewCert?.id === cert.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>

                    {/* Descargar — deshabilitado si todavía no hay PDF (PENDING/FAILED) */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={cert.downloadable ? 'Descargar PDF' : 'Todavía no hay PDF generado'}
                      disabled={!cert.downloadable || rowLoading === cert.id}
                      onClick={() => handleDownload(cert.id)}
                    >
                      {rowLoading === cert.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </Button>

                    {/* Enviar/Reenviar — siempre disponible, sin importar si ya se envió antes */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      title={cert.deliveryStatus === 'SENT' ? 'Reenviar de todos modos' : 'Marcar como enviada'}
                      disabled={!cert.downloadable || rowLoading === `deliver-${cert.id}`}
                      onClick={() => handleMarkDelivered(cert.id)}
                    >
                      {rowLoading === `deliver-${cert.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Mail className="h-3.5 w-3.5" />
                      )}
                      {cert.deliveryStatus === 'SENT' ? 'Reenviar' : 'Enviar'}
                    </Button>

                    {/* Recrear — regenera el mismo registro (PDF nuevo, mismo código). Si ya se
                        notificó al cliente, pide confirmación antes (ver modal más abajo). */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      title="Regenerar el documento de esta constancia"
                      disabled={rowLoading === `reissue-${cert.creditId}`}
                      onClick={() => handleReissueClick(cert)}
                    >
                      {rowLoading === `reissue-${cert.creditId}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Recrear
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación real — total de resultados y de páginas vienen del backend (Spring Page) */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {totalItems} resultado{totalItems !== 1 ? 's' : ''} — página {page} de {Math.max(totalPages, 1)}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={page <= 1 || isPending}
            onClick={() => handlePageChange(page - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={page >= totalPages || isPending}
            onClick={() => handlePageChange(page + 1)}
          >
            Siguiente
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Advertencia: recrear un documento ya notificado al cliente */}
      <AlertDialog open={!!reissueTarget} onOpenChange={(open) => { if (!open) setReissueTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              El cliente ya recibió este documento
            </AlertDialogTitle>
            <AlertDialogDescription>
              La constancia <strong>{reissueTarget?.certificateCode}</strong> ya fue notificada al
              cliente. Recrearla genera un documento nuevo (mismo código, contenido actualizado)
              pero <strong>no se reenvía automáticamente</strong> — si el cliente necesita la
              versión actualizada, deberás enviarla de nuevo manualmente después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReissueAfterSent}>
              Recrear de todos modos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vista previa del PDF — misma URL prefirmada que "Descargar", en un iframe */}
      <Dialog open={!!previewCert} onOpenChange={(open) => { if (!open) { setPreviewCert(null); setPreviewUrl(null); } }}>
        <DialogContent className="max-w-3xl sm:max-w-3xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b">
            <DialogTitle className="flex items-center justify-between gap-2 pr-6">
              <span className="font-mono text-sm">{previewCert?.certificateCode}</span>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir en pestaña nueva
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/30">
            {previewLoading && (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!previewLoading && previewUrl && (
              <iframe src={previewUrl} title="Vista previa de constancia" className="w-full h-full border-0" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Info de estados (filtros y columnas) ─────────────────────────────────────

/** Ícono "i" con popover — explica qué significa cada valor posible de un estado. */
function StatusInfoTooltip({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={title}
      >
        <Info className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <p className="text-xs font-medium text-foreground mb-2">{title}</p>
        <div className="space-y-2">
          {items.map(([label, description]) => (
            <div key={label} className="text-xs">
              <span className="font-medium text-foreground">{label}:</span>{' '}
              <span className="text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
