'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, ArrowRight, BookOpen, Settings, User, Bell,
  ChevronRight, ClipboardList, FileText, Plus, CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIntencionStore } from '@/lib/stores/intencion-store';
import { PuntajeCard } from './PuntajeCard';
import { CreditScoreCard } from './CreditScoreCard';
import type { IntencionConfig } from '@/lib/types';

interface Article {
  title: string;
  description: string;
}

const articles: Article[] = [
  { title: '¿Qué es el score crediticio?', description: 'Aprende cómo se calcula y cómo mejorarlo para acceder a mejores tasas.' },
  { title: 'Cómo usar un préstamo personal', description: 'Consejos para usar el crédito de forma responsable y sin endeudarte.' },
  { title: 'Diferencia entre TEA y TCEA', description: 'Entiende las tasas que aplican a tu préstamo antes de firmar.' },
];

const progress = 20;

interface DashboardHomeClientProps {
  userName: string;
  activeIntencion: IntencionConfig | null;
  children: React.ReactNode; // Para Expediente y Solicitudes (Server Components)
}

export function DashboardHomeClient({ userName, activeIntencion: initialIntencion, children }: DashboardHomeClientProps) {
  const router = useRouter();
  const [showDrawer, setShowDrawer] = useState(false);

  // Usar el store — inicializar con la prop del server si el store aún no tiene datos
  const storeIntencion = useIntencionStore((s) => s.intencion);
  const intencionStatus = useIntencionStore((s) => s.status);
  const setIntencion = useIntencionStore((s) => s.setIntencion);
  const fetchIntencion = useIntencionStore((s) => s.fetch);

  // Si el server ya trajo datos y el store está vacío, inicializar el store
  useEffect(() => {
    if (initialIntencion && !storeIntencion) {
      setIntencion(initialIntencion);
    } else if (intencionStatus === 'idle') {
      fetchIntencion();
    }
  }, [initialIntencion, storeIntencion, intencionStatus, setIntencion, fetchIntencion]);

  // Usar el store como fuente de verdad (se actualiza cuando la calculadora crea/edita)
  const activeIntencion = storeIntencion ?? initialIntencion;

  return (
    <>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-500 mb-1">Hola, {userName}</h1>
            <p className="text-sm sm:text-base text-fondea-text">
              {activeIntencion
                ? 'Tienes una solicitud en curso. Continúa donde lo dejaste.'
                : 'Completa tu expediente para solicitar tu primer préstamo'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeIntencion && (
              <button
                onClick={() => router.push('/solicitar/start')}
                className="flex items-center justify-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                Continuar solicitud
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard/calculadora')}
              className={cn(
                'flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap text-sm',
                activeIntencion
                  ? 'border border-primary/30 text-primary hover:bg-primary/5'
                  : 'bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl',
              )}
            >
              <Plus className="w-4 h-4" />
              {activeIntencion ? 'Nuevo préstamo' : 'Pedir préstamo'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-base">Tu Expediente Digital</CardTitle>
                <CardDescription className="text-xs">
                  Completa tu perfil para solicitar préstamos
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold text-primary">{progress}%</span>
              <span className="text-xs text-muted-foreground">completado</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pb-4">
            <div className="relative">
              <div className="h-3 overflow-hidden rounded-full bg-border/50 shadow-inner">
                <div
                  className="h-full rounded-full bg-linear-to-r from-primary to-secondary shadow-sm transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-border" />
                  <span className="font-medium text-foreground">0 completadas</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">5 pendientes</span>
              </div>

              {progress < 100 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowDrawer(true)}
                  className="h-auto p-0 text-xs font-semibold"
                >
                  Ver detalles
                  <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Left column */}
          <div className="lg:col-span-3 flex flex-col gap-4 md:gap-6">
            {/* Expediente y Solicitudes (Server Components con Suspense) */}
            {children}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
            {/* Solicitar Préstamo */}
            <Card>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  activeIntencion ? 'bg-primary' : 'bg-border'
                )}>
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-dark">
                  {activeIntencion ? 'Tu Préstamo' : 'Solicitar Préstamo'}
                </h2>
              </div>
              <div className="px-5 py-5 flex flex-col gap-3">
                {activeIntencion ? (
                  <>
                    {/* Resumen de la intención activa */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-fondea-text">Monto</span>
                      <span className="font-semibold text-dark">
                        {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(activeIntencion.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-fondea-text">Plazo</span>
                      <span className="font-semibold text-dark">{activeIntencion.termDays} días</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-fondea-text">Cuotas</span>
                      <span className="font-semibold text-dark">{activeIntencion.installmentCount}</span>
                    </div>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => router.push('/solicitar/start')}
                      className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      Continuar solicitud
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/calculadora')}
                      className="w-full flex items-center justify-between text-sm text-primary font-medium border border-border rounded-lg px-4 py-2.5 hover:bg-primary-50 transition-colors"
                    >
                      <span>Nuevo préstamo</span>
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-fondea-text">
                      Configura el monto y plazo de tu préstamo para comenzar.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard/calculadora')}
                      className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Pedir préstamo
                    </button>
                  </>
                )}
              </div>
            </Card>

            {/* Score Card */}
            <PuntajeCard />

            {/* Credit Score Card */}
            <CreditScoreCard />

            {/* Educación Financiera */}
            <Card>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-dark">Aprende sobre finanzas</h2>
              </div>
              <div className="divide-y divide-border">
                {articles.map((article) => (
                  <div key={article.title} className="px-5 py-3 flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-dark">{article.title}</p>
                    <p className="text-xs text-fondea-text leading-relaxed">{article.description}</p>
                    <button className="text-xs text-primary font-medium hover:underline self-start mt-1">
                      Leer →
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Configuración rápida */}
            <Card>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-dark">Configuración rápida</h2>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: 'Mi Perfil', icon: User, path: '/dashboard/profile' },
                  { label: 'Seguridad', icon: Settings, path: '/dashboard/settings' },
                  { label: 'Notificaciones', icon: Bell, path: '/dashboard/settings' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => router.push(item.path)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-background transition-colors"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-dark">
                        <Icon className="w-4 h-4 text-fondea-text" />
                        {item.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-fondea-text" />
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDrawer(false)} />
          <div className="relative bg-white w-full sm:w-96 md:w-80 h-full shadow-xl p-5 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-dark text-lg">Qué falta para solicitar</h3>
              <button onClick={() => setShowDrawer(false)}>
                <X className="w-5 h-5 text-fondea-text" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Datos básicos', done: true, path: undefined },
                { label: 'KYC', done: false, path: '/dashboard/section/kyc' },
                { label: 'Perfil laboral', done: false, path: '/dashboard/section/labor' },
                { label: 'Perfil económico', done: false, path: '/dashboard/section/economic' },
                { label: 'Referencias', done: true, path: undefined },
                { label: 'Info adicional', done: false, path: '/dashboard/section/additional' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={item.done ? 'text-success-600' : 'text-warning-700'}>
                      {item.done ? '✓' : '⏳'}
                    </span>
                    <span className="text-sm text-dark">{item.label}</span>
                  </div>
                  {!item.done && item.path && (
                    <button
                      onClick={() => { setShowDrawer(false); router.push(item.path); }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Completar <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
