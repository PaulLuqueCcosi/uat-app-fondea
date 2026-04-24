'use client';

import { useState, useRef } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, CheckCircle, AlertCircle, Trash2, User, RefreshCw } from 'lucide-react';
import { verifyBiometric } from '@/app/actions/loan.actions';
import { FormHeader } from '@/components/ui/form-header';
import { Separator } from '@/components/ui/separator';
import { CameraModal } from '../../funnel/CameraModal';
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

export function FunnelKYCSelfie() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentStep = getCurrentStep(pathname);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detectar si estamos en el flujo de solicitudes
  const isInSolicitudFlow = pathname.includes('/solicitudes/');
  const solicitudId = params.id as string | undefined;

  // Estado para la selfie
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [verified, setVerified] = useState(false);

  // Estado para el modal
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  // Referencias
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
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
      setSelfieFile(file);
      setSelfiePreview(preview);
      setVerified(false);
    };
    reader.readAsDataURL(file);
  };

  const openCameraModal = () => {
    setCameraModalOpen(true);
  };

  const handleCameraCapture = (file: File) => {
    handleFileSelect(file);
  };

  const handleVerify = async () => {
    if (!selfieFile || !selfiePreview) {
      setError('Debes capturar o subir una selfie primero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyBiometric(selfiePreview);
      if (result.success) {
        setVerified(true);
        // Wait a moment to show success, then continue
        setTimeout(() => {
          // Redirigir según el flujo
      if (isInSolicitudFlow && solicitudId) {
        router.push(`/solicitudes/${solicitudId}/contrato`);
      } else {
        router.push(currentStep?.nextPath || '/funnel/contract');
      }
        }, 1500);
      } else {
        setError(result.error || 'No pudimos verificar tu identidad. Intenta nuevamente.');
      }
    } catch (err) {
      console.error('Error verifying biometric:', err);
      setError('Error en la verificación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setSelfieFile(null);
    setSelfiePreview('');
    setVerified(false);
    setError('');
  };

  const handleContinue = async () => {
    if (!selfieFile) {
      setError('Debes capturar o subir una selfie');
      return;
    }

    // Verificar automáticamente si no está verificado
    if (!verified) {
      await handleVerify();
    } else {
      // Redirigir según el flujo
      if (isInSolicitudFlow && solicitudId) {
        router.push(`/solicitudes/${solicitudId}/contrato`);
      } else {
        router.push(currentStep?.nextPath || '/funnel/contract');
      }
    }
  };

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="pb-4">
          <FormHeader
            icon={currentStep?.icon || User}
            title="Verificación facial"
            description="Toma una selfie para verificar tu identidad"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <form className="w-full">
            {/* Consejos */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-10">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-primary" />
                Consejos para una buena selfie
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Asegúrate de estar en un lugar bien iluminado</li>
                <li>Mira directamente a la cámara</li>
                <li>Retira lentes, gorros o cualquier accesorio que cubra tu rostro</li>
                <li>Mantén un gesto neutral (sin sonreír exageradamente)</li>
                <li>Tu rostro debe ocupar la mayor parte del encuadre</li>
              </ul>
            </div>

            {/* Selfie */}
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <SectionHeader
                title="Tu selfie"
                description="Foto de tu rostro"
              />

              <div className="md:col-span-2 space-y-6">
                {!selfiePreview && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={openCameraModal}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capturar selfie
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Subir imagen
                    </Button>
                  </div>
                )}

                {selfiePreview && (
                  <div className="space-y-3">
                    <div className="relative bg-muted/30 rounded-lg overflow-hidden border border-border">
                      <img
                        src={selfiePreview}
                        alt="Tu selfie"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      {verified && (
                        <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <div className="bg-white rounded-full p-4 shadow-lg">
                            <CheckCircle className="w-12 h-12 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openCameraModal}
                        disabled={loading}
                        className="w-full sm:w-auto"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Volver a tomar
                      </Button>
                      {!verified ? (
                        <Button
                          type="button"
                          onClick={handleVerify}
                          disabled={loading}
                          className="w-full sm:flex-1"
                        >
                          {loading ? 'Verificando...' : 'Verificar identidad'}
                        </Button>
                      ) : (
                        <div className="w-full sm:flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-center">Identidad verificada correctamente</span>
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

            {/* Nota de seguridad */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border mb-10">
              <p className="text-xs text-muted-foreground text-center">
                🔒 Tu foto será encriptada y usada únicamente para verificación de identidad.
                No será compartida con terceros.
              </p>
            </div>

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
                disabled={!selfieFile || loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Verificando...' : verified ? 'Continuar' : 'Verificar y continuar'}
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
        mode="face"
        title="Toma tu selfie"
        description="Centra tu rostro en el óvalo"
      />
    </>
  );
}
