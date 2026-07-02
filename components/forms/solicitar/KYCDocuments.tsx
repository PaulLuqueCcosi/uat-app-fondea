'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, Camera, Trash2, Loader2, ShieldCheck, XCircle, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { uploadDocumentAction, deleteDocumentAction, verifyDocumentAction } from '@/app/actions/document.actions';
import type { DocumentType, DocumentsVerificationStatus, DocumentItemStatus } from '@/lib/types/document';
import { FormHeader } from '@/components/ui/form-header';
import { Separator } from '@/components/ui/separator';
import { CameraModal } from '../../solicitar/CameraModal';
import { getCurrentStep } from '@/lib/funnel-steps';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  description: string;
}

function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-1">
      <h2 className="font-semibold text-primary">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

/** Badge visual del estado de verificación de un lado del DNI */
function VerificationStatusBadge({ item }: { item: DocumentItemStatus | undefined }) {
  if (!item) return null;

  switch (item.status) {
    case 'VERIFIED':
      return (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success-50 border border-success-200">
          <ShieldCheck className="w-4 h-4 text-success-700 shrink-0" />
          <span className="text-sm font-medium text-success-900">Documento verificado</span>
        </div>
      );
    case 'REJECTED':
      return (
        <div className="p-3 rounded-lg bg-error-50 border border-error-200 space-y-1.5">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-error-600 shrink-0" />
            <span className="text-sm font-semibold text-error-900">Verificación rechazada</span>
          </div>
          {item.rejectionReason && (
            <p className="text-xs text-error-700 ml-6">{item.rejectionReason}</p>
          )}
          {!item.rejectionReason && (
            <p className="text-xs text-error-700 ml-6">
              El documento no pudo ser verificado. Asegúrate de que la foto sea clara, sin reflejos y muestre el DNI completo.
            </p>
          )}
          <p className="text-xs text-error-600 ml-6 font-medium">
            {item.remainingAttempts > 0
              ? `Puedes reintentar (${item.remainingAttempts} intento${item.remainingAttempts !== 1 ? 's' : ''} restante${item.remainingAttempts !== 1 ? 's' : ''})`
              : 'Sin intentos restantes — contacta a soporte'}
          </p>
        </div>
      );
    default:
      return null;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FunnelKYCDocumentsProps {
  applicationId?: string;
  initialFrontUrl?: string | null;
  initialBackUrl?: string | null;
  loading?: boolean;
  verification?: DocumentsVerificationStatus | null;
}

export function FunnelKYCDocuments({ applicationId, initialFrontUrl, initialBackUrl, loading: externalLoading, verification }: FunnelKYCDocumentsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentStep = getCurrentStep(pathname);
  const { setDocumentUrl, setDocumentsVerification } = useSolicitudStore();

  const isInSolicitudFlow = pathname.includes('/solicitudes/');
  const solicitudId = applicationId || (params.id as string | undefined);

  // State per side
  const [processing, setProcessing] = useState<'front' | 'back' | null>(null);
  const [verifyError, setVerifyError] = useState<{ side: 'front' | 'back'; message: string } | null>(null);
  const [confirmDeleteSide, setConfirmDeleteSide] = useState<'front' | 'back' | null>(null);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState<{ side: 'front' | 'back'; message: string } | null>(null);
  const [deleting, setDeleting] = useState<'front' | 'back' | null>(null);

  // Photo state
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>(initialFrontUrl ?? '');
  const [backPreview, setBackPreview] = useState<string>(initialBackUrl ?? '');
  const [frontUploaded, setFrontUploaded] = useState(!!initialFrontUrl);
  const [backUploaded, setBackUploaded] = useState(!!initialBackUrl);

  useEffect(() => {
    if (initialFrontUrl && !frontPreview) {
      setFrontPreview(initialFrontUrl);
      setFrontUploaded(true);
    }
  }, [initialFrontUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialBackUrl && !backPreview) {
      setBackPreview(initialBackUrl);
      setBackUploaded(true);
    }
  }, [initialBackUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Camera modal
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleFileSelect = (side: 'front' | 'back', file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (JPEG, PNG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB. Intenta con una de menor resolución.');
      return;
    }
    setError('');
    setVerifyError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (side === 'front') {
        setFrontFile(file);
        setFrontPreview(preview);
        setFrontUploaded(false);
      } else {
        setBackFile(file);
        setBackPreview(preview);
        setBackUploaded(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const openCameraModal = (side: 'front' | 'back') => {
    setCurrentSide(side);
    setCameraModalOpen(true);
  };

  const handleCameraCapture = (file: File) => {
    handleFileSelect(currentSide, file);
  };

  const handleUploadAndVerify = async (side: 'front' | 'back') => {
    const file = side === 'front' ? frontFile : backFile;
    if (!file || !solicitudId) return;

    setProcessing(side);
    setError('');
    setVerifyError(null);

    const docType: DocumentType = side === 'front' ? 'DNI_FRONT' : 'DNI_BACK';

    try {
      // 1. Upload
      const formData = new FormData();
      formData.append('file', file);
      const uploadResult = await uploadDocumentAction(solicitudId, docType, formData);
      if (!uploadResult.success) {
        setError(uploadResult.error || 'No se pudo subir la imagen. Verifica que sea un archivo válido.');
        setProcessing(null);
        return;
      }

      // 2. Verify
      const verifyResult = await verifyDocumentAction(solicitudId, docType);

      // 3. Update state
      if (side === 'front') setFrontUploaded(true);
      else setBackUploaded(true);

      if (verifyResult.success && verifyResult.documentsStatus) {
        setDocumentsVerification(verifyResult.documentsStatus);
        if (side === 'front') setDocumentUrl('dniFront', frontPreview);
        else setDocumentUrl('dniBack', backPreview);

        // Check if this side was rejected
        const itemStatus = side === 'front'
          ? verifyResult.documentsStatus.dniFront
          : verifyResult.documentsStatus.dniBack;

        if (itemStatus.status === 'REJECTED') {
          setVerifyError({
            side,
            message: itemStatus.rejectionReason || 'El documento no pasó la verificación automática.',
          });
        }
      } else {
        setVerifyError({
          side,
          message: verifyResult.error || 'No se pudo verificar el documento. Intenta con una foto más clara.',
        });
      }
    } catch (err) {
      console.error(`Error uploading/verifying ${side}:`, err);
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setProcessing(null);
    }
  };

  const handleRetryVerify = async (side: 'front' | 'back') => {
    const docType: DocumentType = side === 'front' ? 'DNI_FRONT' : 'DNI_BACK';
    if (!solicitudId) return;

    setProcessing(side);
    setVerifyError(null);
    setError('');

    try {
      const result = await verifyDocumentAction(solicitudId, docType);
      if (result.success && result.documentsStatus) {
        setDocumentsVerification(result.documentsStatus);

        const itemStatus = side === 'front'
          ? result.documentsStatus.dniFront
          : result.documentsStatus.dniBack;

        if (itemStatus.status === 'REJECTED') {
          setVerifyError({
            side,
            message: itemStatus.rejectionReason || 'El documento no pasó la verificación.',
          });
        }
      } else {
        setVerifyError({
          side,
          message: result.error || 'No se pudo verificar el documento.',
        });
      }
    } catch (err) {
      console.error(`Error verifying ${side}:`, err);
      setVerifyError({ side, message: 'Error de conexión al verificar.' });
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (side: 'front' | 'back') => {
    const docType: DocumentType = side === 'front' ? 'DNI_FRONT' : 'DNI_BACK';
    setDeleteError(null);
    setDeleting(side);

    const wasUploaded = side === 'front' ? frontUploaded : backUploaded;
    if (wasUploaded && solicitudId) {
      const result = await deleteDocumentAction(solicitudId, docType);
      if (!result.success) {
        setDeleteError({
          side,
          message: 'No se puede eliminar este documento porque la solicitud ya avanzó de etapa.',
        });
        setDeleting(null);
        return;
      }
    }

    if (side === 'front') {
      setFrontFile(null);
      setFrontPreview('');
      setFrontUploaded(false);
      setTimeout(() => setDocumentUrl('dniFront', null), 50);

      // Si eliminamos el frente, también eliminamos el reverso (depende del frente)
      if ((backUploaded || backPreview) && solicitudId) {
        await deleteDocumentAction(solicitudId, 'DNI_BACK').catch(() => {});
      }
      setBackFile(null);
      setBackPreview('');
      setBackUploaded(false);
      setTimeout(() => setDocumentUrl('dniBack', null), 50);
    } else {
      setBackFile(null);
      setBackPreview('');
      setBackUploaded(false);
      setTimeout(() => setDocumentUrl('dniBack', null), 50);
    }
    setError('');
    setVerifyError(null);
    setDeleting(null);
  };

  const handleContinue = async () => {
    const dniFrontVerified = frontUploaded && verification?.dniFront.status === 'VERIFIED';
    const dniBackVerified = backUploaded && verification?.dniBack.status === 'VERIFIED';

    if (dniFrontVerified && dniBackVerified) {
      if (isInSolicitudFlow && solicitudId) {
        router.push(`/solicitudes/${solicitudId}/kyc-selfie`);
      } else {
        router.push(currentStep?.nextPath || '/solicitar/kyc-selfie');
      }
    } else {
      setError('Debes verificar ambas fotos del DNI antes de continuar.');
    }
  };

  // ─── Render helper for each side ──────────────────────────────────────────

  function renderSide(side: 'front' | 'back') {
    const file = side === 'front' ? frontFile : backFile;
    const preview = side === 'front' ? frontPreview : backPreview;
    const uploaded = side === 'front' ? frontUploaded : backUploaded;
    const fileInputRef = side === 'front' ? frontFileInputRef : backFileInputRef;
    const itemVerification = side === 'front' ? verification?.dniFront : verification?.dniBack;
    const isProcessing = processing === side;
    const isDeleting = deleting === side;
    const sideLabel = side === 'front' ? 'Frente del DNI' : 'Reverso del DNI';
    const sideDesc = side === 'front' ? 'Cara principal con tu foto y datos' : 'Cara posterior con dirección y huella';

    // El reverso no puede verificarse si el frente no está VERIFIED
    const frontNotVerified = verification?.dniFront.status !== 'VERIFIED';
    const backBlockedByFront = side === 'back' && frontNotVerified;

    return (
      <div className="grid grid-cols-1 gap-4 md:gap-10 md:grid-cols-3">
        <SectionHeader title={sideLabel} description={sideDesc} />
        <div className="md:col-span-2 space-y-4">
          {/* Loading skeleton */}
          {externalLoading && !preview ? (
            <div className="h-48 rounded-lg bg-neutral-100 animate-pulse flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-neutral-300" />
            </div>
          ) : !preview ? (
            /* No photo yet — show capture/upload buttons */
            <div className="space-y-3">
              {backBlockedByFront ? (
                /* Back bloqueado — mostrar mensaje en vez de botones */
                <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50">
                  <ImageIcon className="w-6 h-6 text-neutral-400 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Verifica el frente del DNI primero para habilitar este paso.
                  </p>
                </div>
              ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:flex-1 h-10"
                  onClick={() => openCameraModal(side)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Tomar foto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={(e) => handleFileSelect(side, e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:flex-1 h-10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir desde galería
                </Button>
              </div>
              )}
              {/* Show rejection info if the doc was previously rejected */}
              {itemVerification && itemVerification.status === 'REJECTED' && (
                <VerificationStatusBadge item={itemVerification} />
              )}
            </div>
          ) : (
            /* Photo captured/loaded — show preview + actions */
            <div className="space-y-3">
              {/* Image preview */}
              <div className="relative bg-muted/30 rounded-lg overflow-hidden border border-border aspect-4/3 sm:aspect-16/10">
                <img
                  src={preview}
                  alt={sideLabel}
                  className="w-full h-full object-contain"
                />
                {/* Verified badge */}
                {uploaded && itemVerification?.status === 'VERIFIED' && !isProcessing && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/95 rounded-full p-1.5 sm:p-2 shadow-md border border-success-300">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success-600" />
                  </div>
                )}
                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                    <p className="text-white text-sm font-medium">Verificando autenticidad...</p>
                    <p className="text-white/70 text-xs">Esto puede tardar unos segundos</p>
                  </div>
                )}
              </div>

              {/* Verification status badge */}
              {!isProcessing && itemVerification && (
                <VerificationStatusBadge item={itemVerification} />
              )}

              {/* Action buttons — h-10 consistente para todos */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isProcessing ? (
                  <Button type="button" disabled className="w-full sm:flex-1 h-10">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analizando documento...
                  </Button>
                ) : isDeleting ? (
                  <Button type="button" variant="outline" disabled className="w-full sm:flex-1 h-10">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </Button>
                ) : uploaded && itemVerification?.status === 'VERIFIED' ? (
                  /* Verified — show delete option */
                  <>
                    <div className="w-full sm:flex-1 flex items-center gap-2 text-sm text-success-700 h-10 px-3">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span className="font-medium">Verificado correctamente</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmDeleteSide(side)}
                      className="w-full sm:w-auto h-10 text-muted-foreground"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cambiar foto
                    </Button>
                  </>
                ) : uploaded && itemVerification?.status === 'REJECTED' ? (
                  /* Rejected — show retry/delete */
                  <>
                    {itemVerification.remainingAttempts > 0 ? (
                      <Button
                        type="button"
                        onClick={() => handleDelete(side)}
                        variant="outline"
                        className="w-full sm:flex-1 h-10"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Tomar nueva foto
                      </Button>
                    ) : (
                      <Button type="button" disabled className="w-full sm:flex-1 h-10">
                        Sin intentos disponibles
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDelete(side)}
                      className="w-full sm:w-auto h-10 text-muted-foreground"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </>
                ) : uploaded ? (
                  /* Uploaded but not yet verified or other status — retry */
                  <>
                    <Button
                      type="button"
                      onClick={() => handleRetryVerify(side)}
                      disabled={backBlockedByFront}
                      className="w-full sm:flex-1 h-10"
                    >
                      {backBlockedByFront ? 'Verifica el frente primero' : 'Reintentar verificación'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDelete(side)}
                      className="w-full sm:w-auto h-10 text-muted-foreground"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </>
                ) : (
                  /* Not uploaded yet — send to verify */
                  <>
                    <Button
                      type="button"
                      onClick={() => handleUploadAndVerify(side)}
                      disabled={backBlockedByFront}
                      className="w-full sm:flex-1 h-10"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      {backBlockedByFront ? 'Verifica el frente primero' : 'Enviar para verificación'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDelete(side)}
                      className="w-full sm:w-auto h-10 text-muted-foreground"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Descartar
                    </Button>
                  </>
                )}
              </div>

              {/* Inline error for delete failures */}
              {deleteError?.side === side && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-warning-50 border border-warning-100 text-warning-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-xs">{deleteError.message}</p>
                </div>
              )}

              {/* Verify error (when not from status badge) */}
              {verifyError?.side === side && !isProcessing && itemVerification?.status !== 'REJECTED' && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 border border-error-100 text-error-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-xs">{verifyError.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="pb-4">
          <FormHeader
            icon={currentStep?.icon || FileText}
            title="Documentos de identidad"
            description="Sube fotos claras de tu DNI para verificar tu identidad"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <form className="w-full">
            {/* Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-10">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-primary" />
                Para una verificación exitosa
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>El DNI debe estar <strong>completo</strong> en la imagen (sin bordes cortados)</li>
                <li>Evita <strong>reflejos</strong> y sombras sobre el documento</li>
                <li>La imagen debe estar <strong>enfocada</strong> y legible</li>
                <li>Coloca el DNI sobre un fondo liso y de color contrastante</li>
              </ul>
            </div>

            {/* DNI Frente */}
            {renderSide('front')}

            <Separator className="my-10 bg-primary/20 h-px" />

            {/* DNI Reverso */}
            {verification?.dniFront.status !== 'VERIFIED' && (frontPreview || backPreview) && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Primero debes verificar el <strong>frente del DNI</strong>. Una vez verificado, podrás enviar el reverso.
                </p>
              </div>
            )}
            {renderSide('back')}

            {/* Global error */}
            {error && (
              <>
                <Separator className="my-10 bg-primary/20 h-px" />
                <div className="p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-error-900">{error}</p>
                    {error.includes('ambas fotos') && (
                      <p className="text-xs text-error-700 mt-1">
                        Cada foto debe tener el check verde de "Verificado" antes de continuar.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator className="my-10 bg-primary/20 h-px" />

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => router.back()}
                disabled={processing !== null || deleting !== null}
              >
                Atrás
              </Button>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={
                  verification?.dniFront.status !== 'VERIFIED' ||
                  verification?.dniBack.status !== 'VERIFIED' ||
                  processing !== null ||
                  deleting !== null
                }
                className="w-full sm:w-auto"
              >
                Continuar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Camera modal */}
      <CameraModal
        open={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        mode="document"
        title={currentSide === 'front' ? 'Frente del DNI' : 'Reverso del DNI'}
        description="Coloca el documento dentro del encuadre y asegúrate de que se lea claramente"
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDeleteSide} onOpenChange={(open) => !open && setConfirmDeleteSide(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cambiar este documento?</DialogTitle>
            <DialogDescription>
              Si eliminas este documento perderás la verificación actual y tendrás que subir una nueva foto y verificar de nuevo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteSide(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteSide) {
                  handleDelete(confirmDeleteSide);
                  setConfirmDeleteSide(null);
                }
              }}
            >
              Sí, cambiar foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
