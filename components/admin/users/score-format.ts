/**
 * Formateo de fechas para las pantallas de score/buró.
 *
 * OJO: estas funciones deben llamarse SIEMPRE desde un Server Component
 * (page.tsx) y pasar el resultado como string a los Client Components —
 * nunca formatear dentro de un componente 'use client'. `toLocaleString`
 * usa el ICU del proceso donde corre, y el ICU de Node difiere del de
 * Chrome (espacios distintos en "a. m."/"p. m."), lo que genera un
 * hydration mismatch aunque el texto se vea idéntico a simple vista.
 * Mismo problema que ya documenta admin-user-puntaje/page.tsx.
 */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
