'use client';

import { useState } from 'react';
import { useApiClient } from '@/lib/api-client';

/**
 * Ejemplo de cómo usar el cliente API con manejo automático de 401
 */
export default function ApiExample() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const apiClient = useApiClient();

  const testApiCall = async () => {
    setLoading(true);
    setResult('');

    try {
      // Ejemplo de llamada a tu backend Spring Boot
      const response = await apiClient.get('/api/mi-backend/datos-protegidos');
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Éxito: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Error HTTP: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      if (error.message === 'Session expired') {
        setResult('🔒 Sesión expirada - se mostró modal');
      } else {
        setResult(`❌ Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testUnauthorizedCall = async () => {
    setLoading(true);
    setResult('');

    try {
      // Simular llamada que devuelve 401
      const response = await fetch('/api/test/simulate-401', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token-invalido'
        }
      });

      if (response.status === 401) {
        // Esto debería mostrar el modal
        const apiClient = useApiClient();
        await apiClient.request('/api/test/simulate-401');
      }
    } catch (error: any) {
      setResult(`Resultado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-card rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Ejemplo de Cliente API</h3>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={testApiCall}
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? '🔄 Cargando...' : '📡 Llamada API Normal'}
          </button>
          <p className="text-sm text-muted-foreground mt-1">
            Hace una llamada normal a tu backend con token
          </p>
        </div>

        <div>
          <button
            onClick={testUnauthorizedCall}
            disabled={loading}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90 disabled:opacity-50"
          >
            {loading ? '🔄 Probando...' : '🚫 Simular 401 (Modal)'}
          </button>
          <p className="text-sm text-muted-foreground mt-1">
            Simula un 401 para mostrar el modal de sesión expirada
          </p>
        </div>
      </div>

      {result && (
        <div className="mt-4 p-3 bg-muted rounded text-sm">
          <strong>Resultado:</strong>
          <pre className="mt-1 whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      <div className="mt-6 text-sm text-muted-foreground">
        <h4 className="font-bold">¿Cómo usar en tu código?</h4>
        <pre className="mt-2 bg-muted p-3 rounded text-xs overflow-auto">
{`// En cualquier componente cliente
import { useApiClient } from '@/lib/api-client';

const apiClient = useApiClient();

// Llamadas automáticas con token
const response = await apiClient.get('/api/mi-backend/datos');
const response = await apiClient.post('/api/mi-backend/crear', { data });

// Si el backend devuelve 401, se muestra modal automáticamente`}
        </pre>
      </div>
    </div>
  );
}