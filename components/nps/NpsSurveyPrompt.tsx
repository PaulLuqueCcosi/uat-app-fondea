'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { submitNpsAction } from '@/app/actions/nps.actions';
import { X } from 'lucide-react';

const STORAGE_KEY = 'fondea_nps_responded';

export function NpsSurveyPrompt() {
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const already = localStorage.getItem(STORAGE_KEY);
      if (!already) {
        setVisible(true);
      }
    } catch {
      // localStorage no disponible
    }
  }, []);

  const handleSubmit = async (score: number) => {
    setLoading(true);
    setError(null);
    try {
      await submitNpsAction(score);
      setSubmitted(true);
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // ignorar
      }
    } catch {
      setError('No se pudo enviar tu respuesta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            ¿Qué tan probable es que recomiendes FONDEA a un amigo?
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <p className="text-sm text-muted-foreground">¡Gracias por tu feedback!</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                  <Button
                    key={score}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    disabled={loading}
                    onClick={() => handleSubmit(score)}
                  >
                    {score}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1">
                <span>Nada probable</span>
                <span>Muy probable</span>
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
