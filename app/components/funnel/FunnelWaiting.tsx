'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/Card';
import { Clock, FileCheck } from 'lucide-react';
import { evaluateApplication } from '@/app/actions/loan.actions';

export function FunnelWaiting() {
  const router = useRouter();
  const [evaluating, setEvaluating] = useState(true);

  useEffect(() => {
    const evaluate = async () => {
      try {
        const result = await evaluateApplication();

        // Simulate evaluation time
        await new Promise(resolve => setTimeout(resolve, 3000));

        setEvaluating(false);

        // Redirect based on result
        setTimeout(() => {
          if (result.result === 'approved') {
            router.push('/funnel/approved');
          } else if (result.result === 'more_info') {
            router.push('/funnel/more-info');
          } else {
            router.push('/funnel/rejected');
          }
        }, 500);
      } catch (error) {
        console.error('Error evaluating application:', error);
        // On error, default to approved for demo
        setTimeout(() => router.push('/funnel/approved'), 3500);
      }
    };

    evaluate();
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-12 text-center">
        {/* Animated spinner */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FileCheck className="w-10 h-10 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-3">
          Evaluando tu Solicitud
        </h1>

        <p className="text-lg text-fondea-text mb-6">
          Estamos analizando tu información. Esto tomará solo unos momentos...
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 inline-block">
          <div className="flex items-center gap-3 text-sm text-dark">
            <Clock className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium">Tiempo estimado: 2-5 minutos</p>
              <p className="text-fondea-text">Por favor, no cierres esta página</p>
            </div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="mt-8 space-y-3">
          {[
            { label: 'Verificando identidad', done: true },
            { label: 'Analizando perfil crediticio', done: evaluating },
            { label: 'Calculando capacidad de pago', done: false },
          ].map((step, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-center gap-2 text-sm transition-opacity ${
                step.done ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  step.done ? 'bg-primary text-white' : 'bg-border'
                }`}
              >
                {step.done && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-dark">{step.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
