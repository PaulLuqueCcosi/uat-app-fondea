'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { submitNpsAction, getNpsEligibilityAction } from '@/app/actions/nps.actions';
import { X } from 'lucide-react';

export function NpsSurveyPrompt() {
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Siempre se consulta al backend — es la única fuente de verdad. Un admin
    // puede pedirle a un usuario que ya respondió que vuelva a hacerlo, así
    // que cachear "ya respondió" localmente (ej. localStorage) rompería ese
    // flujo: el popup nunca reaparecería en el mismo navegador.
    getNpsEligibilityAction().then(({ hasResponded }) => {
      if (!cancelled && !hasResponded) {
        setVisible(true);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (score: number) => {
    setLoading(true);
    setError(null);
    try {
      await submitNpsAction(score);
      setSubmitted(true);
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
              <div className="grid grid-cols-10 gap-1 mt-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                  <Button
                    key={score}
                    variant="outline"
                    size="sm"
                    className="h-7 w-full min-w-0 p-0 text-[11px] font-medium"
                    disabled={loading}
                    onClick={() => handleSubmit(score)}
                  >
                    {score}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-0.5">
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
