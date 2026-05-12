'use client';

import { useState, useRef } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, Camera, Trash2, RefreshCw } from 'lucide-react';
import { uploadDocumentAction } from '@/app/actions/document.actions';
import type { DocumentType } from '@/app/actions/document.actions';
import { FormHeader } from '@/components/ui/form-header';
import { Separator } from '@/components/ui/separator';
import { CameraModal } from '../../solicitar/CameraModal';
import { getCurrentStep } from '@/lib/funnel-steps';

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
}

export function FunnelKYCDocuments({ applicationId, initialFrontUrl, initialBackUrl }: FunnelKYCDocumentsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentStep = getCurrentStep(pathname);

  // Detectar si estamos en el flujo de solicitudes
  const isInSolicitudFlow = pathname.includes('/solicitudes/');
  const solicitudId = applicationId || (params.id as string | undefined);
  const [loading, setLoading] = useState<'front' | 'back' | null>(null);
  const [error, setError] = useState('');

  // Estado para las fotos — inicializar con datos del backend si existen
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>(initialFrontUrl ?? '');
  const [backPreview, setBackPreview] = useState<string>(initialBackUrl ?? '');
  const [frontUploaded, setFrontUploaded] = useState(!!initialFrontUrl);
  const [backUploaded, setBackUploaded] = useState(!!initialBackUrl);

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

  const handleUpload = async (side: 'front' | 'back') => {
    const file = side === 'front' ? frontFile : backFile;
    if (!file || !solicitudId) return;

    setLoading(side);
    setError('');

    try {
      const docType: DocumentType = side === 'front' ? 'DNI_FRONT' : 'DNI_BACK';
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadDocumentAction(solicitudId, docType, formData);
      if (result.success) {
        if (side === 'front') {
          setFrontUploaded(true);
        } else {
          setBackUploaded(true);
        }
      } else {
        setError(result.error || 'Error al subir la imagen. Por favor, intenta nuevamente.');
      }
    } catch (err) {
      console.error(`Error uploading ${side}:`, err);
      setError(`Error al subir la imagen del ${side === 'front' ? 'frente' : 'reverso'}`);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontFile(null);
      setFrontPreview('');
      setFrontUploaded(false);
    } else {
      setBackFile(null);
      setBackPreview('');
      setBackUploaded(false);
    }
    setError('');
  };

  const handleContinue = async () => {
    // Si ambas ya están subidas (del backend o de este session), solo navegar
    if (frontUploaded && backUploaded) {
      if (isInSolicitudFlow && solicitudId) {
        router.push(`/solicitudes/${solicitudId}/kyc-selfie`);
      } else {
        router.push(currentStep?.nextPath || '/solicitar/kyc-selfie');
      }
      return;
    }

    // Validar que ambas fotos estén seleccionadas si no están subidas
    if (!frontUploaded && !frontFile) {
      setError('Debes capturar o subir la imagen del frente del DNI');
      return;
    }
    if (!backUploaded && !backFile) {
      setError('Debes capturar o subir la imagen del reverso del DNI');
      return;
    }

    if (!solicitudId) {
      setError('No se encontró la solicitud activa.');
      return;
    }

    setError('');

    // Si no están subidas, subirlas automáticamente
    if (!frontUploaded) {
      setLoading('front');
      try {
        const formData = new FormData();
        formData.append('file', frontFile);
        const result = await uploadDocumentAction(solicitudId, 'DNI_FRONT', formData);
        if (!result.success) {
          setError(result.error || 'Error al subir la imagen del frente');
          setLoading(null);
          return;
        }
        setFrontUploaded(true);
      } catch (err) {
        console.error('Error uploading front:', err);
        setError('Error al subir la imagen del frente');
        setLoading(null);
        return;
      }
    }

    if (!backUploaded) {
      setLoading('back');
      try {
        const formData = new FormData();
        formData.append('file', backFile);
        const result = await uploadDocumentAction(solicitudId, 'DNI_BACK', formData);
        if (!result.success) {
          setError(result.error || 'Error al subir la imagen del reverso');
          setLoading(null);
          return;
        }
        setBackUploaded(true);
      } catch (err) {
        console.error('Error uploading back:', err);
        setError('Error al subir la imagen del reverso');
        setLoading(null);
        return;
      }
    }

    setLoading(null);

    // Redirigir según el flujo
    if (isInSolicitudFlow && solicitudId) {
      router.push(`/solicitudes/${solicitudId}/kyc-selfie`);
    } else {
      router.push(currentStep?.nextPath || '/solicitar/kyc-selfie');
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
                {!frontPreview && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
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
                      className="flex-1"
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
                      {frontUploaded && (
                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-2">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete('front')}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openCameraModal('front')}
                        className="w-full sm:w-auto"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Volver a tomar
                      </Button>
                      {!frontUploaded ? (
                        <Button
                          type="button"
                          onClick={() => handleUpload('front')}
                          disabled={loading === 'front'}
                          className="w-full sm:flex-1"
                        >
                          {loading === 'front' ? 'Subiendo...' : 'Subir frente'}
                        </Button>
                      ) : (
                        <div className="w-full sm:flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-center">Imagen subida correctamente</span>
                        </div>
                      )}
                    </div>
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
                {!backPreview && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
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
                      className="flex-1"
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
                      {backUploaded && (
                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-2">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete('back')}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openCameraModal('back')}
                        className="w-full sm:w-auto"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Volver a tomar
                      </Button>
                      {!backUploaded ? (
                        <Button
                          type="button"
                          onClick={() => handleUpload('back')}
                          disabled={loading === 'back'}
                          className="w-full sm:flex-1"
                        >
                          {loading === 'back' ? 'Subiendo...' : 'Subir reverso'}
                        </Button>
                      ) : (
                        <div className="w-full sm:flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-center">Imagen subida correctamente</span>
                        </div>
                      )}
                    </div>
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
              >
                Atrás
              </Button>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={(!frontFile && !frontUploaded) || (!backFile && !backUploaded) || loading !== null}
                className="w-full sm:w-auto"
              >
                {loading ? 'Subiendo...' : 'Continuar'}
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
    </>
  );
}
