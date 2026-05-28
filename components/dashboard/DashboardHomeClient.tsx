'use client';

import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

interface DashboardHomeClientProps {
  children: React.ReactNode; // Todos los Server Components aquí
}

export function DashboardHomeClient({ children }: DashboardHomeClientProps) {
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-8">
        {/* Todos los componentes vienen como children (Server Components con Suspense) */}
        {children}
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
                    <a
                      href={item.path}
                      onClick={() => setShowDrawer(false)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Completar <ArrowRight className="w-3 h-3" />
                    </a>
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
