'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { UserProfile } from '@/modules/profile';
import { uploadAndSetAvatar } from '@/app/actions/profile.actions';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fullName = [profile.firstName, profile.secondName, profile.firstLastName, profile.secondLastName]
    .filter(Boolean)
    .join(' ') || 'Sin nombre';

  const initials = `${(profile.firstName || 'U')[0]}${(profile.firstLastName || '')[0] || ''}`;

  const reset = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) reset();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar 2MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const result = await uploadAndSetAvatar(formData);

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Error al subir la imagen');
      return;
    }

    setOpen(false);
    window.location.reload();
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative group cursor-pointer" onClick={() => setOpen(true)}>
            <Avatar className="w-20 h-20 border-4 border-primary/10">
              {profile.avatar && <AvatarImage src={profile.avatar} alt={fullName} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-foreground">{fullName}</p>
            {profile.createdAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long' })}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setOpen(true)}
          >
            <Camera className="w-3.5 h-3.5" />
            Cambiar foto
          </Button>
        </div>
      </CardContent>

      {/* Modal de cambiar foto */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cambiar foto de perfil</DialogTitle>
            <DialogDescription>
              Sube una imagen JPG, PNG o WebP (máximo 2MB).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {/* Preview */}
            <Avatar className="w-32 h-32 border-4 border-primary/10">
              {previewUrl
                ? <AvatarImage src={previewUrl} alt="Preview" />
                : profile.avatar
                  ? <AvatarImage src={profile.avatar} alt={fullName} />
                  : null
              }
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Drop zone / selector */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 p-4 transition-colors text-center"
            >
              <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">
                {selectedFile ? selectedFile.name : 'Seleccionar imagen'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(0)} KB`
                  : 'JPG, PNG o WebP · Máximo 2MB'
                }
              </p>
            </button>

            {error && <p className="text-xs text-error-600">{error}</p>}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              onClick={handleConfirm}
              disabled={loading || !selectedFile}
              className="gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Actualizar foto
            </Button>
          </DialogFooter>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
