'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileData {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    picture: string | null;
    updatedAt: string | null;
  };
  claims: Record<string, any>;
}

export function ProfileClient() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Error al obtener el perfil');
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading && !data) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-fondea-text">Cargando datos desde API...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-error">
            <XCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button size="sm" onClick={fetchProfile}>
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2">
            Datos desde API Route
            <CheckCircle className="w-5 h-5 text-green-600" />
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchProfile}
            loading={loading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 p-4 bg-background/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-fondea-text w-32">Estado:</span>
            <span className={`text-sm font-medium ${data.isAuthenticated ? 'text-green-600' : 'text-error'}`}>
              {data.isAuthenticated ? 'Autenticado ✓' : 'No autenticado ✗'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-fondea-text w-32">ID:</span>
            <span className="text-sm text-dark font-mono">{data.user.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-fondea-text w-32">Nombre:</span>
            <span className="text-sm text-dark">{data.user.name}</span>
          </div>

          {data.user.email && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-fondea-text w-32">Email:</span>
              <span className="text-sm text-dark">{data.user.email}</span>
              {data.user.emailVerified && (
                <span className="text-xs text-green-600">✓</span>
              )}
            </div>
          )}

          {data.user.phone && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-fondea-text w-32">Teléfono:</span>
              <span className="text-sm text-dark">{data.user.phone}</span>
              {data.user.phoneVerified && (
                <span className="text-xs text-green-600">✓</span>
              )}
            </div>
          )}

          {data.user.updatedAt && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-fondea-text w-32">Actualizado:</span>
              <span className="text-sm text-dark">
                {new Date(data.user.updatedAt).toLocaleString('es-PE')}
              </span>
            </div>
          )}
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-fondea-text hover:text-dark font-medium">
            Ver todos los claims ({Object.keys(data.claims).length})
          </summary>
          <div className="mt-2 p-3 bg-dark/5 rounded overflow-x-auto">
            <pre className="text-xs font-mono">
              {JSON.stringify(data.claims, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </Card>
  );
}
