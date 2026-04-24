'use client';

import { useRef, useEffect, useState } from 'react';
import { X, RefreshCw, Camera, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  mode: 'document' | 'face';
  title: string;
  description: string;
  fullScreen?: boolean;
}

export function CameraModal({
  open,
  onClose,
  onCapture,
  mode,
  title,
  description,
  fullScreen = false,
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    mode === 'face' ? 'user' : 'environment'
  );
  const [error, setError] = useState('');
  const [detectionActive, setDetectionActive] = useState(false);
  const animationFrameRef = useRef<number>();

  // Iniciar cámara
  const startCamera = async (mode: 'user' | 'environment') => {
    try {
      // Detener stream anterior si existe
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      setFacingMode(mode);
      setError('');

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        // Iniciar detección después de que el video cargue
        videoRef.current.onloadedmetadata = () => {
          setDetectionActive(true);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  // Detección simple de bordes para DNI
  const detectDocument = () => {
    if (!videoRef.current || !overlayCanvasRef.current || !detectionActive) return;

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar tamaño del canvas al video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar guía rectangular para el DNI
    const docWidth = canvas.width * 0.8;
    const docHeight = docWidth * 0.63; // Proporción DNI
    const x = (canvas.width - docWidth) / 2;
    const y = (canvas.height - docHeight) / 2;

    // Sombra oscura alrededor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Recorte transparente para el DNI
    ctx.clearRect(x, y, docWidth, docHeight);

    // Borde de la guía
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, docWidth, docHeight);

    // Esquinas
    const cornerLength = 30;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 6;

    // Esquina superior izquierda
    ctx.beginPath();
    ctx.moveTo(x, y + cornerLength);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerLength, y);
    ctx.stroke();

    // Esquina superior derecha
    ctx.beginPath();
    ctx.moveTo(x + docWidth - cornerLength, y);
    ctx.lineTo(x + docWidth, y);
    ctx.lineTo(x + docWidth, y + cornerLength);
    ctx.stroke();

    // Esquina inferior izquierda
    ctx.beginPath();
    ctx.moveTo(x, y + docHeight - cornerLength);
    ctx.lineTo(x, y + docHeight);
    ctx.lineTo(x + cornerLength, y + docHeight);
    ctx.stroke();

    // Esquina inferior derecha
    ctx.beginPath();
    ctx.moveTo(x + docWidth - cornerLength, y + docHeight);
    ctx.lineTo(x + docWidth, y + docHeight);
    ctx.lineTo(x + docWidth, y + docHeight - cornerLength);
    ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(detectDocument);
  };

  // Detección de rostro (guía circular)
  const detectFace = () => {
    if (!videoRef.current || !overlayCanvasRef.current || !detectionActive) return;

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar tamaño del canvas
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sombra oscura alrededor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Círculo ovalado para el rostro
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radiusX = canvas.width * 0.35;
    const radiusY = canvas.height * 0.4;

    // Recorte transparente
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Borde del óvalo
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(detectFace);
  };

  // Iniciar detección según el modo
  useEffect(() => {
    if (open && detectionActive) {
      if (mode === 'document') {
        detectDocument();
      } else {
        detectFace();
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [open, detectionActive, mode]);

  // Iniciar cámara al abrir
  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    } else {
      // Detener stream al cerrar
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setDetectionActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [open]);

  const switchCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setDetectionActive(false);
    startCamera(newMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        onCapture(file);
        handleClose();
      },
      'image/jpeg',
      0.95
    );
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setDetectionActive(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        fullScreen={fullScreen}
        className={fullScreen
          ? "bg-black p-0"
          : "bg-black p-0 w-[95vw] h-[90vh] max-w-2xl rounded-2xl overflow-hidden"
        }
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className={`absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent ${fullScreen ? 'p-4' : 'p-3 rounded-t-2xl'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-base">{title}</h3>
                <p className="text-white/80 text-xs">{description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Video + Overlay */}
          <div className="relative flex-1 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Botón cambiar cámara */}
            {mode === 'document' && (
              <Button
                variant="secondary"
                size="icon"
                className={`absolute ${fullScreen ? 'top-20 right-4' : 'top-16 right-3'} z-10`}
                onClick={switchCamera}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Footer con botón capturar */}
          <div className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent ${fullScreen ? 'p-6' : 'p-4 rounded-b-2xl'}`}>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-white/80 text-xs mb-3">
                  {mode === 'document'
                    ? 'Alinea el DNI dentro del recuadro'
                    : 'Centra tu rostro en el óvalo'}
                </p>
                <Button
                  size="lg"
                  onClick={capturePhoto}
                  className={`bg-primary hover:bg-primary/90 text-white rounded-full p-0 ${fullScreen ? 'w-20 h-20' : 'w-16 h-16'}`}
                >
                  <Camera className={fullScreen ? 'w-8 h-8' : 'w-7 h-7'} />
                </Button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={`absolute ${fullScreen ? 'top-20' : 'top-16'} left-4 right-4 z-20 bg-destructive/90 text-destructive-foreground p-3 rounded-lg`}>
              <p className="text-xs">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
