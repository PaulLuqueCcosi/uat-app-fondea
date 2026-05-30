'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, Camera, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { uploadDocumentAction, deleteDocumentAction, verifyDocumentAction } from '@/app/actions/document.actions';
import type { DocumentType, DocumentsVerificationStatus } from '@/lib/types/document';
import { FormHeader } from '@/components/ui/form-header';
import { Separator } from '@/components/ui/separator';
import { CameraModal } from '../../solicitar/CameraModal';
import { getCurrentStep } from '@/lib/funnel-steps';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';

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

interface FunnelKYCDocumentsProps {
  /** ID de la solicitud — pasado desde el server component */
  applicationId?: string;
  /** URL de preview del DNI frente ya subido */
  initialFrontUrl?: string | null;
  /** URL de preview del DNI reverso ya subido */
  initialBackUrl?: string | null;
  /** Si los datos aún están cargando del store */
  loading?: boolean;
  /** Estado de verificación de documentos */
  verification?: DocumentsVerificationStatus | null;
}

export function FunnelKYCDocuments({ applicationId, initialFrontUrl, initialBackUrl, loading: externalLoading, verification }: FunnelKYCDocumentsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentStep = getCurrentStep(pathname);
  const { setDocumentUrl, setDocumentsVerification } = useSolicitudStore();

  // Detectar si estamos en el flujo de solicitudes
  const isInSolicitudFlow = pathname.includes('/solicitudes/');
  const solicitudId = applicationId || (params.id as string | undefined);
  const [processing, setProcessing] = useState<'front' | 'back' | null>(null);
  const [verifyError, setVerifyError] = useState<{ side: 'front' | 'back'; message: string } | null>(null);
  const [confirmDeleteSide, setConfirmDeleteSide] = useState<'front' | 'back' | null>(null);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState<{ side: 'front' | 'back'; message: string } | null>(null);
  const [deleting, setDeleting] = useState<'front' | 'back' | null>(null);

  // Estado para las fotos — inicializar con datos del backend si existen
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>(initialFrontUrl ?? '');
  const [backPreview, setBackPreview] = useState<string>(initialBackUrl ?? '');
  const [frontUploaded, setFrontUploaded] = useState(!!initialFrontUrl);
  const [backUploaded, setBackUploaded] = useState(!!initialBackUrl);

  // Sincronizar cuando las props cambian (datos llegan del store)
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

  // Estado para el modal
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');

  // Referencias
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (side: 'front' | 'back', file: File | null) => {
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setError('');

    // Crear preview
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
        setError(uploadResult.error || 'Error al subir la imagen. Intenta nuevamente.');
        setProcessing(null);
        return;
      }

      // Update local upload state
      if (side === 'front') {
        setFrontUploaded(true);
        setDocumentUrl('dniFront', frontPreview);
      } else {
        setBackUploaded(true);
        setDocumentUrl('dniBack', backPreview);
      }

      // 2. Verify
      const verifyResult = await verifyDocumentAction(solicitudId, docType);
      if (verifyResult.success && verifyResult.documentsStatus) {
        setDocumentsVerification(verifyResult.documentsStatus);
      } else {
        setVerifyError({
          side,
          message: verifyResult.error || 'No se pudo verificar el documento. Revisa la calidad de la imagen.',
        });
      }
    } catch (err) {
      console.error(`Error uploading/verifying ${side}:`, err);
      setError('Error al procesar el documento');
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
      } else {
        setVerifyError({
          side,
          message: result.error || 'No se pudo verificar el documento.',
        });
      }
    } catch (err) {
      console.error(`Error verifying ${side}:`, err);
      setVerifyError({
        side,
        message: 'Error al verificar el documento.',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (side: 'front' | 'back') => {
    const docType: DocumentType = side === 'front' ? 'DNI_FRONT' : 'DNI_BACK';
    setDeleteError(null);
    setDeleting(side);

    // Si ya estaba subido al backend, intentar eliminar
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

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="pb-4">
          <FormHeader
            icon={currentStep?.icon || FileText}
            title="Documentos de identidad"
            description="Sube fotos de tu DNI para verificar tu identidad"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <form className="w-full">
            {/* Consejos */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-10">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-primary" />
                Consejos para una buena foto
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Asegúrate de que el DNI esté completo en la imagen</li>
                <li>Evita reflejos y sombras</li>
                <li>La imagen debe estar enfocada y legible</li>
                <li>No uses fotos editadas o con filtros</li>
              </ul>
            </div>

            {/* Frente del DNI */}
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <SectionHeader
                title="Frente del DNI"
                description="Cara principal con tu foto"
              />

              <div className="md:col-span-2 space-y-6">
                {externalLoading && !frontPreview ? (
                  <div className="h-48 rounded-lg bg-neutral-100 animate-pulse flex items-center justify-center">
                    <p className="text-xs text-neutral-400">Obteniendo datos...</p>
                  </div>
                ) : !frontPreview && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:flex-1"
                      onClick={() => openCameraModal('front')}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capturar foto
                    </Button>

                    <input
                      ref={frontFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect('front', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:flex-1"
                      onClick={() => frontFileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Subir imagen
                    </Button>
                  </div>
                )}

                {frontPreview && (
                  <div className="space-y-3">
                    <div className="relative bg-muted/30 rounded-lg overflow-hidden border border-border">
                      <img
                        src={frontPreview}
                        alt="Frente DNI"
                        className="w-full h-64 object-contain"
                      />
                      {frontUploaded && verification?.dniFront.status === 'VERIFIED' && (
                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-2">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {frontUploaded && verification?.dniFront.status === 'VERIFIED' ? (
                        <>
                          <div className="w-full sm:flex-1 flex items-center gap-2 text-sm text-success-700">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>Verificado</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteSide('front')}
                            className="w-full sm:w-auto text-muted-foreground"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />Eliminar
                          </Button>
                        </>
                      ) : (
                        <>
                          {!frontUploaded ? (
                            <Button
                              type="button"
                              onClick={() => handleUploadAndVerify('front')}
                              disabled={processing === 'front'}
                              className="w-full sm:flex-1"
                            >
                              {processing === 'front' ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando…</>
                              ) : (
                                'Verificar'
                              )}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => handleRetryVerify('front')}
                              disabled={processing === 'front'}
                              className="w-full sm:flex-1"
                            >
                              {processing === 'front' ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando…</>
                              ) : (
                                'Reintentar'
                              )}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete('front')}
                            disabled={deleting === 'front' || processing === 'front'}
                            className="w-full sm:w-auto"
                          >
                            {deleting === 'front' ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Eliminando…</>
                            ) : (
                              <><Trash2 className="w-4 h-4 mr-2" />Eliminar</>
                            )}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Error inline al intentar eliminar */}
                    {deleteError?.side === 'front' && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning-50 border border-warning-100 text-warning-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="text-xs">{deleteError.message}</p>
                      </div>
                    )}

                    {/* Error de verificación */}
                    {verifyError?.side === 'front' && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 border border-error-100 text-error-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="text-xs">{verifyError.message}</p>
                      </div>
                    )}

                    {/* Intentos restantes */}
                    {verification?.dniFront && verification.dniFront.failedAttempts > 0 && verification.dniFront.status !== 'VERIFIED' && (
                      <p className="text-xs text-muted-foreground">
                        Intentos: {verification.dniFront.failedAttempts}/{verification.dniFront.maxAttempts} — Restantes: {verification.dniFront.remainingAttempts}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-10 bg-primary/20 h-px" />

            {/* Reverso del DNI */}
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <SectionHeader
                title="Reverso del DNI"
                description="Cara posterior con tus datos"
              />

              <div className="md:col-span-2 space-y-6">
                {externalLoading && !backPreview ? (
                  <div className="h-48 rounded-lg bg-neutral-100 animate-pulse flex items-center justify-center">
                    <p className="text-xs text-neutral-400">Obteniendo datos...</p>
                  </div>
                ) : !backPreview && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:flex-1"
                      onClick={() => openCameraModal('back')}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capturar foto
                    </Button>

                    <input
                      ref={backFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect('back', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:flex-1"
                      onClick={() => backFileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Subir imagen
                    </Button>
                  </div>
                )}

                {backPreview && (
                  <div className="space-y-3">
                    <div className="relative bg-muted/30 rounded-lg overflow-hidden border border-border">
                      <img
                        src={backPreview}
                        alt="Reverso DNI"
                        className="w-full h-64 object-contain"
                      />
                      {backUploaded && verification?.dniBack.status === 'VERIFIED' && (
                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-2">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {backUploaded && verification?.dniBack.status === 'VERIFIED' ? (
                        <>
                          <div className="w-full sm:flex-1 flex items-center gap-2 text-sm text-success-700">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>Verificado</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteSide('back')}
                            className="w-full sm:w-auto text-muted-foreground"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />Eliminar
                          </Button>
                        </>
                      ) : (
                        <>
                          {!backUploaded ? (
                            <Button
                              type="button"
                              onClick={() => handleUploadAndVerify('back')}
                              disabled={processing === 'back'}
                              className="w-full sm:flex-1"
                            >
                              {processing === 'back' ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando…</>
                              ) : (
                                'Verificar'
                              )}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => handleRetryVerify('back')}
                              disabled={processing === 'back'}
                              className="w-full sm:flex-1"
                            >
                              {processing === 'back' ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando…</>
                              ) : (
                                'Reintentar'
                              )}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete('back')}
                            disabled={deleting === 'back' || processing === 'back'}
                            className="w-full sm:w-auto"
                          >
                            {deleting === 'back' ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Eliminando…</>
                            ) : (
                              <><Trash2 className="w-4 h-4 mr-2" />Eliminar</>
                            )}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Error inline al intentar eliminar */}
                    {deleteError?.side === 'back' && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning-50 border border-warning-100 text-warning-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="text-xs">{deleteError.message}</p>
                      </div>
                    )}

                    {/* Error de verificación */}
                    {verifyError?.side === 'back' && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 border border-error-100 text-error-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="text-xs">{verifyError.message}</p>
                      </div>
                    )}

                    {/* Intentos restantes */}
                    {verification?.dniBack && verification.dniBack.failedAttempts > 0 && verification.dniBack.status !== 'VERIFIED' && (
                      <p className="text-xs text-muted-foreground">
                        Intentos: {verification.dniBack.failedAttempts}/{verification.dniBack.maxAttempts} — Restantes: {verification.dniBack.remainingAttempts}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <>
                <Separator className="my-10 bg-primary/20 h-px" />
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </>
            )}

            <Separator className="my-10 bg-primary/20 h-px" />

            {/* Botones de acción */}
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
                disabled={(!frontFile && !frontUploaded) || (!backFile && !backUploaded) || processing !== null || deleting !== null}
                className="w-full sm:w-auto"
              >
                {processing ? 'Procesando...' : 'Continuar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de cámara */}
      <CameraModal
        open={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        mode="document"
        title={currentSide === 'front' ? 'Frente del DNI' : 'Reverso del DNI'}
        description="Alinea el documento dentro del recuadro"
      />

      {/* Dialog de confirmación para eliminar documento verificado */}
      <Dialog open={!!confirmDeleteSide} onOpenChange={(open) => !open && setConfirmDeleteSide(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar documento verificado?</DialogTitle>
            <DialogDescription>
              Si eliminas este documento perderás la verificación y tendrás que volver a subir y verificar.
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
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
