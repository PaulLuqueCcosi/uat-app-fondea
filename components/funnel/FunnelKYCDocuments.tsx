'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadDocument } from '@/app/actions/loan.actions';

export function FunnelKYCDocuments() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);

  const handleFileSelect = (side: 'front' | 'back', file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setError('');

    // Create preview
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

  const handleUpload = async (side: 'front' | 'back') => {
    const file = side === 'front' ? frontFile : backFile;
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const result = await uploadDocument(file, side);
      if (result.success) {
        if (side === 'front') {
          setFrontUploaded(true);
        } else {
          setBackUploaded(true);
        }
      }
    } catch (err) {
      console.error(`Error uploading ${side}:`, err);
      setError(`Error al subir la imagen del ${side === 'front' ? 'frente' : 'reverso'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!frontUploaded || !backUploaded) {
      setError('Debes subir ambas imágenes del DNI');
      return;
    }
    router.push('/funnel/kyc-selfie');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">
          Verifica tu Identidad
        </h1>
        <p className="text-fondea-text">
          Necesitamos fotos de tu DNI para verificar tu identidad.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Instructions */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h3 className="font-semibold text-dark mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Consejos para una buena foto
          </h3>
          <ul className="text-sm text-dark space-y-1 ml-7 list-disc">
            <li>Asegúrate de que el DNI esté completo en la imagen</li>
            <li>Evita reflejos y sombras</li>
            <li>La imagen debe estar enfocada y legible</li>
            <li>No uses fotos editadas o con filtros</li>
          </ul>
        </div>

        {/* Front side */}
        <div>
          <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Frente del DNI
          </h3>

          {!frontPreview ? (
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect('front', e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="border-2 border-dashed border-border hover:border-primary rounded-lg p-8 text-center cursor-pointer transition-colors">
                <Upload className="w-12 h-12 text-fondea-text mx-auto mb-3" />
                <p className="text-sm font-medium text-dark mb-1">
                  Click para seleccionar imagen
                </p>
                <p className="text-xs text-fondea-text">
                  JPG, PNG hasta 5MB
                </p>
              </div>
            </label>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={frontPreview}
                  alt="Frente DNI"
                  className="w-full h-48 object-contain bg-background rounded-lg"
                />
                {frontUploaded && (
                  <div className="absolute top-2 right-2 bg-secondary text-dark rounded-full p-1">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect('front', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="w-full">
                    <Button variant="ghost" className="w-full">
                      Cambiar imagen
                    </Button>
                  </div>
                </label>
                {!frontUploaded && (
                  <Button
                    onClick={() => handleUpload('front')}
                    loading={loading}
                    className="flex-1"
                  >
                    Subir frente
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Back side */}
        <div>
          <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Reverso del DNI
          </h3>

          {!backPreview ? (
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect('back', e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="border-2 border-dashed border-border hover:border-primary rounded-lg p-8 text-center cursor-pointer transition-colors">
                <Upload className="w-12 h-12 text-fondea-text mx-auto mb-3" />
                <p className="text-sm font-medium text-dark mb-1">
                  Click para seleccionar imagen
                </p>
                <p className="text-xs text-fondea-text">
                  JPG, PNG hasta 5MB
                </p>
              </div>
            </label>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={backPreview}
                  alt="Reverso DNI"
                  className="w-full h-48 object-contain bg-background rounded-lg"
                />
                {backUploaded && (
                  <div className="absolute top-2 right-2 bg-secondary text-dark rounded-full p-1">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect('back', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="w-full">
                    <Button variant="ghost" className="w-full">
                      Cambiar imagen
                    </Button>
                  </div>
                </label>
                {!backUploaded && (
                  <Button
                    onClick={() => handleUpload('back')}
                    loading={loading}
                    className="flex-1"
                  >
                    Subir reverso
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <Button
          onClick={handleContinue}
          disabled={!frontUploaded || !backUploaded}
          className="w-full"
          size="lg"
        >
          Continuar con verificación facial →
        </Button>
      </Card>
    </div>
  );
}
