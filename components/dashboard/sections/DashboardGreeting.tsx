'use client';

import { useState, useEffect } from 'react';

/**
 * DashboardGreeting — Saludo + subtítulo.
 * Le pasas nombre y mensaje. Muestra el saludo. Nada más.
 */

interface DashboardGreetingProps {
  name: string | null;
  subtitle: string | null;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Buenos días';
  if (hour >= 12 && hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export function DashboardGreeting({ name, subtitle }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState('Hola');

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  return (
    <div className="mb-1">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-500">
        {name ? `¡${greeting}, ${name}!` : `¡${greeting}!`}
      </h1>
      {subtitle && (
        <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
