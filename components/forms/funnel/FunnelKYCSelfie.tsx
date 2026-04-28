'use client';

import { useState, useRef } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Trash2,
  User,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { verifyBiometric } from '@/app/actions/loan.actions';
import { FormHeader } from '@/components/ui/form-header';
import { Separator } from '@/components/ui/separator';
import { CameraModal } from '../../funnel/CameraModal';
import { getCurrentStep } from '@/lib/funnel-steps';

// ── Tipos MediaPipe ───────────────────────────────────────────────────────────
type FaceDetectorInstance = {
  detect: (canvas: HTMLCanvasElement) => { detections: { categories: { score: number }[] }[] };
  setOptions: (opts: { runningMode: string }) => Promise<void>;
};

// ── Umbrales de confianza ─────────────────────────────────────────────────────
// Ajusta estos valores para controlar la exigencia de la detección facial.
// THRESHOLD_GREEN  → mínimo para considerar el rostro válido (habilita continuar)
// THRESHOLD_ORANGE → mínimo para mostrar advertencia naranja (por debajo → rojo)
const THRESHOLD_GREEN  = 0.95;
const THRESHOLD_ORANGE = 0.61;

type FaceStatus = 'none' | 'red' | 'orange' | 'green';

function getStatus(score: number | null): FaceStatus {
  if (score === null) return 'none';
  if (score >= THRESHOLD_GREEN)  return 'green';
  if (score >= THRESHOLD_ORANGE) return 'orange';
  return 'red';
}

const STATUS_LABEL: Record<FaceStatus, string> = {
  none:   'No se detectó ningún rostro en la imagen',
  red:    'Rostro no detectado o muy poco visible',
  orange: 'Rostro detectado pero con baja confianza — intenta con mejor iluminación',
  green:  'Rostro verificado correctamente',
};

const STATUS_STYLE: Record<FaceStatus, string> = {
  none:   'bg-destructive/10 border-destructive/20 text-destructive',
  red:    'bg-destructive/10 border-destructive/20 text-destructive',
  orange: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
  green:  'bg-green-500/10 border-green-500/30 text-green-700',
};

// ── Carga dinámica de MediaPipe (singleton) ───────────────────────────────────
let detectorPromise: Promise<FaceDetectorInstance> | null = null;

async function loadFaceDetector(): Promise<FaceDetectorInstance> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const { FaceDetector, FilesetResolver } = await import(
        /* webpackIgnore: true */
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0' as string
      ) as { FaceDetector: any; FilesetResolver: any };

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      return await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
      }) as FaceDetectorInstance;
    })();
  }
  return detectorPromise;
}

// ── Analizar imagen con MediaPipe ─────────────────────────────────────────────
async function analyzeImageForFace(
  dataUrl: string
): Promise<{ status: FaceStatus; score: number | null }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve({ status: 'none', score: null }); return; }
        ctx.drawImage(img, 0, 0);

        const detector = await loadFaceDetector();
        // Asegurar modo IMAGE
        await detector.setOptions({ runningMode: 'IMAGE' });

        const results    = detector.detect(canvas);
        const detections = results.detections;

        if (!detections || detections.length === 0) {
          resolve({ status: 'none', score: null });
          return;
        }

        const best  = detections.reduce((a, b) =>
          b.categories[0].score > a.categories[0].score ? b : a
        );
        const score = best.categories[0].score;
        resolve({ status: getStatus(score), score });
      } catch (err) {
        console.error('MediaPipe error:', err);
        resolve({ status: 'none', score: null });
      }
    };
    img.onerror = () => resolve({ status: 'none', score: null });
    img.src = dataUrl;
  });
}

// ── Sub-componente ────────────────────────────────────────────────────────────
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

// ── Componente principal ──────────────────────────────────────────────────────
export function FunnelKYCSelfie() {
  const router    = useRouter();
  const pathname  = usePathname();
  const params    = useParams();
  const currentStep = getCurrentStep(pathname);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const isInSolicitudFlow = pathname.includes('/solicitudes/');
  const solicitudId       = params.id as string | undefined;

  // Selfie
  const [selfieFile,    setSelfieFile]    = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [verified,      setVerified]      = useState(false);

  // Análisis de imagen subida
  const [analyzing,    setAnalyzing]    = useState(false);
  const [uploadStatus, setUploadStatus] = useState<FaceStatus | null>(null);
  const [uploadScore,  setUploadScore]  = useState<number | null>(null);

  // Modal
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Manejo de archivo subido ──────────────────────────────────────────────
  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setError('');
    setUploadStatus(null);
    setUploadScore(null);
    setVerified(false);

    // Leer como dataURL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const preview = e.target?.result as string;

      // Mostrar preview inmediatamente mientras se analiza
      setSelfieFile(file);
      setSelfiePreview(preview);

      // Analizar con MediaPipe
      setAnalyzing(true);
      const { status, score } = await analyzeImageForFace(preview);
      setAnalyzing(false);
      setUploadStatus(status);
      setUploadScore(score);

      // La foto queda visible siempre; si no es verde el formulario queda bloqueado
    };
    reader.readAsDataURL(file);
  };

  // ── Captura desde cámara (ya validada en CameraModal) ────────────────────
  const handleCameraCapture = (file: File) => {
    setError('');
    setUploadStatus(null);
    setUploadScore(null);
    setVerified(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setSelfieFile(file);
      setSelfiePreview(preview);
    };
    reader.readAsDataURL(file);
  };

  // ── Verificación biométrica (backend) ────────────────────────────────────
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
        setTimeout(() => {
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
    setUploadStatus(null);
    setUploadScore(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContinue = async () => {
    if (!selfieFile) {
      setError('Debes capturar o subir una selfie');
      return;
    }

    // Bloquear si la imagen subida no pasó la validación facial
    if (uploadStatus !== null && uploadStatus !== 'green') {
      setError('La imagen no es válida. Por favor sube una foto donde tu rostro sea claramente visible.');
      return;
    }

    if (!verified) {
      await handleVerify();
    } else {
      if (isInSolicitudFlow && solicitudId) {
        router.push(`/solicitudes/${solicitudId}/contrato`);
      } else {
        router.push(currentStep?.nextPath || '/funnel/contract');
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
              <SectionHeader title="Tu selfie" description="Foto de tu rostro" />

              <div className="md:col-span-2 space-y-6">
                {/* Botones de acción — siempre visibles */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCameraModalOpen(true)}
                    disabled={analyzing}
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
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {analyzing ? 'Analizando…' : 'Subir imagen'}
                  </Button>
                </div>

                {/* Preview — visible siempre que haya una imagen (válida o no) */}
                {selfiePreview && (
                  <div className="space-y-3">
                    {/* Imagen */}
                    <div
                      className={`relative bg-muted/30 rounded-lg overflow-hidden border-2 transition-colors ${
                        uploadStatus === 'green' || uploadStatus === null
                          ? 'border-border'
                          : uploadStatus === 'orange'
                          ? 'border-orange-400'
                          : 'border-destructive'
                      }`}
                    >
                      <img
                        src={selfiePreview}
                        alt="Tu selfie"
                        className="w-full h-64 object-cover rounded-lg"
                      />

                      {/* Overlay de análisis en curso */}
                      {analyzing && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 rounded-lg">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                          <p className="text-white text-sm font-medium">Analizando rostro…</p>
                        </div>
                      )}

                      {/* Overlay de verificado */}
                      {verified && !analyzing && (
                        <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <div className="bg-white rounded-full p-4 shadow-lg">
                            <CheckCircle className="w-12 h-12 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Badge de resultado del análisis */}
                    {!analyzing && uploadStatus && (
                      <div
                        className={`p-3 rounded-lg border flex items-start gap-2.5 ${STATUS_STYLE[uploadStatus]}`}
                      >
                        {uploadStatus === 'green' ? (
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        )}
                        <div className="text-sm">
                          <p className="font-semibold">
                            {uploadStatus === 'green'
                              ? 'Imagen válida'
                              : uploadStatus === 'orange'
                              ? 'Confianza insuficiente'
                              : 'No se detectó un rostro'}
                          </p>
                          <p className="opacity-90">{STATUS_LABEL[uploadStatus]}</p>
                          {uploadScore !== null && uploadStatus !== 'green' && (
                            <p className="mt-1 opacity-70 text-xs">
                              Confianza detectada: {Math.round(uploadScore * 100)}% — mínimo requerido: {Math.round(THRESHOLD_GREEN * 100)}%
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Acciones sobre la foto */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={loading || analyzing}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCameraModalOpen(true)}
                        disabled={loading || analyzing}
                        className="w-full sm:w-auto"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Volver a tomar
                      </Button>
                      {!verified && uploadStatus === 'green' && (
                        <Button
                          type="button"
                          onClick={handleVerify}
                          disabled={loading}
                          className="w-full sm:flex-1"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verificando…
                            </>
                          ) : (
                            'Verificar identidad'
                          )}
                        </Button>
                      )}
                      {verified && (
                        <div className="w-full sm:flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
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
                disabled={!selfieFile || loading || analyzing || (uploadStatus !== null && uploadStatus !== 'green')}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando…
                  </>
                ) : verified ? (
                  'Continuar'
                ) : (
                  'Verificar y continuar'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de cámara con detección en tiempo real */}
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
