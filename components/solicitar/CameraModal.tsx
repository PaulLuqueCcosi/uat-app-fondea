'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Contenedor estable para el portal (evita conflictos con React DOM) ────────
function getPortalContainer(): HTMLElement {
  const id = 'camera-modal-portal';
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);
  }
  return container;
}

// ── Tipos MediaPipe (cargados dinámicamente) ──────────────────────────────────
type FaceDetectorInstance = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => { detections: Detection[] };
  detect: (canvas: HTMLCanvasElement) => { detections: Detection[] };
  setOptions: (opts: { runningMode: string }) => Promise<void>;
  close: () => void;
};

type Detection = {
  categories: { score: number }[];
  boundingBox?: { originX: number; originY: number; width: number; height: number };
};

// ── Umbrales de confianza ─────────────────────────────────────────────────────
const THRESHOLD_GREEN  = 0.90;
const THRESHOLD_ORANGE = 0.61;

type FaceStatus = 'none' | 'red' | 'orange' | 'green';

function getStatus(score: number | null): FaceStatus {
  if (score === null) return 'none';
  if (score >= THRESHOLD_GREEN)  return 'green';
  if (score >= THRESHOLD_ORANGE) return 'orange';
  return 'red';
}

const STATUS_CONFIG: Record<FaceStatus, { badgeClass: string; label: string; ovalColor: string }> = {
  none:   { badgeClass: 'bg-black/75',       label: 'Buscando rostro…',          ovalColor: 'rgba(255,255,255,0.4)' },
  red:    { badgeClass: 'bg-error-600/85',   label: 'Rostro no detectado',       ovalColor: 'var(--color-error-600)' },
  orange: { badgeClass: 'bg-warning-700/90', label: 'Acércate más a la cámara',  ovalColor: 'var(--color-warning-500)' },
  green:  { badgeClass: 'bg-success-700/90', label: '✓ Listo — puedes capturar', ovalColor: 'var(--color-success-600)' },
};

// ── Carga dinámica de MediaPipe ───────────────────────────────────────────────
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
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
      });
      return detector as FaceDetectorInstance;
    })();
  }
  return detectorPromise;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  mode: 'document' | 'face';
  title: string;
  description: string;
}

// ── Componente ────────────────────────────────────────────────────────────────
export function CameraModal({
  open,
  onClose,
  onCapture,
  mode,
  title,
  description,
}: CameraModalProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const overlayRef      = useRef<HTMLCanvasElement>(null);
  const animFrameRef    = useRef<number>(0);
  const lastTimeRef     = useRef<number>(-1);
  const detectorRef     = useRef<FaceDetectorInstance | null>(null);
  const runningModeRef  = useRef<'IMAGE' | 'VIDEO'>('IMAGE');
  const streamRef       = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    mode === 'face' ? 'user' : 'environment'
  );
  const [error, setError]           = useState('');
  const [videoReady, setVideoReady] = useState(false);
  const [faceScore, setFaceScore]   = useState<number | null>(null);
  const [mounted, setMounted]       = useState(false);

  const status = getStatus(faceScore);
  const cfg    = STATUS_CONFIG[status];
  const canCapture = mode === 'face' ? status === 'green' : true;

  // Necesario para createPortal en SSR
  useEffect(() => { setMounted(true); }, []);

  // ── Iniciar cámara ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = newStream;
      setFacingMode(facing);
      setError('');
      setVideoReady(false);
      setFaceScore(null);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => setVideoReady(true);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }, []);

  // ── Detener cámara ──────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setVideoReady(false);
    setFaceScore(null);
  }, []);

  // ── Dibujar overlay de documento ────────────────────────────────────────────
  const drawDocumentOverlay = useCallback((canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ── Dibujar overlay de rostro ───────────────────────────────────────────────
  const drawFaceOverlay = useCallback(
    (canvas: HTMLCanvasElement, video: HTMLVideoElement, _ovalColor: string) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    []
  );

  // ── Loop de detección en tiempo real ────────────────────────────────────────
  const detectionLoop = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = overlayRef.current;
    if (!video || !canvas || !videoReady) {
      animFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    if (mode === 'document') {
      drawDocumentOverlay(canvas, video);
      animFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    if (!detectorRef.current) {
      drawFaceOverlay(canvas, video, STATUS_CONFIG['none'].ovalColor);
      animFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    if (video.currentTime !== lastTimeRef.current && video.readyState >= 2) {
      lastTimeRef.current = video.currentTime;

      try {
        if (runningModeRef.current !== 'VIDEO') {
          runningModeRef.current = 'VIDEO';
          await detectorRef.current.setOptions({ runningMode: 'VIDEO' });
        }

        const results    = detectorRef.current.detectForVideo(video, performance.now());
        const detections = results.detections;

        if (!detections || detections.length === 0) {
          setFaceScore(null);
          drawFaceOverlay(canvas, video, STATUS_CONFIG['none'].ovalColor);
        } else {
          const best  = detections.reduce((a, b) =>
            b.categories[0].score > a.categories[0].score ? b : a
          );
          const score = best.categories[0].score;
          setFaceScore(score);
          drawFaceOverlay(canvas, video, STATUS_CONFIG[getStatus(score)].ovalColor);
        }
      } catch {
        drawFaceOverlay(canvas, video, STATUS_CONFIG['none'].ovalColor);
      }
    }

    animFrameRef.current = requestAnimationFrame(detectionLoop);
  }, [videoReady, mode, drawDocumentOverlay, drawFaceOverlay]);

  // ── Efectos ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'face') return;
    loadFaceDetector()
      .then((d) => { detectorRef.current = d; })
      .catch(console.error);
  }, [mode]);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
      // Bloquear scroll del body
      document.body.style.overflow = 'hidden';
    } else {
      stopCamera();
      document.body.style.overflow = '';
    }
    return () => {
      stopCamera();
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (videoReady && open) {
      cancelAnimationFrame(animFrameRef.current);
      detectionLoop();
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [videoReady, open, detectionLoop]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Capturar foto ───────────────────────────────────────────────────────────
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !canCapture) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        handleClose();
      },
      'image/jpeg',
      0.95
    );
  };

  const switchCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    cancelAnimationFrame(animFrameRef.current);
    startCamera(next);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // ── No renderizar si no está abierto o no está montado (SSR) ────────────────
  if (!open || !mounted) return null;

  // ── Render via Portal (contenedor estable, evita insertBefore error) ────────
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-9999 bg-black flex flex-col"
      style={{ width: '100vw', height: '100dvh' }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-linear-to-b from-black/80 to-transparent p-4 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base truncate">{title}</h3>
            <p className="text-white/80 text-xs truncate">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/20 h-10 w-10 shrink-0 ml-2"
            aria-label="Cerrar cámara"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Video + Overlay — ocupa todo el espacio */}
      <div className="relative flex-1 min-h-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={mode === 'face' ? { transform: 'scaleX(-1)' } : undefined}
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={mode === 'face' ? { transform: 'scaleX(-1)' } : undefined}
        />
        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Botón cambiar cámara (solo documentos) */}
        {mode === 'document' && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-20 right-4 z-10"
            onClick={switchCamera}
            aria-label="Cambiar cámara"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black/80 to-transparent p-6 pt-10">
        <div className="flex flex-col items-center gap-3">
          {/* Badge de estado (solo modo face) */}
          {mode === 'face' && (
            <div
              className={`px-4 py-1.5 rounded-full text-white text-xs font-semibold transition-all duration-300 ${cfg.badgeClass}`}
            >
              {cfg.label}
              {faceScore !== null && (
                <span className="ml-2 opacity-80">
                  {Math.round(faceScore * 100)}%
                </span>
              )}
            </div>
          )}

          {mode === 'document' && (
            <p className="text-white text-sm font-medium">Toma una foto clara de tu DNI</p>
          )}

          {/* Botón capturar */}
          <button
            type="button"
            onClick={capturePhoto}
            disabled={!canCapture}
            aria-label="Capturar foto"
            className={`rounded-full flex items-center justify-center transition-all duration-300 w-20 h-20 ${
              canCapture
                ? 'bg-white hover:bg-white/90 active:scale-95 shadow-lg'
                : 'bg-white/20 cursor-not-allowed'
            }`}
          >
            {/* Círculo interior estilo iOS/Android camera */}
            <span
              className={`rounded-full w-16 h-16 border-4 transition-colors ${
                canCapture
                  ? 'border-black/10 bg-white'
                  : 'border-white/20 bg-white/10'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-destructive/90 text-destructive-foreground p-3 rounded-lg">
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>,
    getPortalContainer()
  );
}
