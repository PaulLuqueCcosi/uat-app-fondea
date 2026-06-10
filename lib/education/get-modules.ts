import { modules } from './modules';
import type { EducationModule } from './types';

/**
 * Simula latencia de red para desarrollo.
 * En producción esto se elimina — el fetch real tendrá su propia latencia.
 */
const SIMULATED_DELAY_MS = 10;

async function simulateNetwork<T>(data: T): Promise<T> {
  if (process.env.NODE_ENV === 'development') {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
  }
  return data;
}

/**
 * Obtiene todos los módulos de educación financiera.
 *
 * HOY: retorna el array estático con delay simulado.
 * MAÑANA: reemplazar por fetch a CMS (Supabase, Strapi, etc.)
 *
 * El consumidor no sabe ni le importa de dónde viene la data.
 */
export async function getModules(): Promise<EducationModule[]> {
  const data = modules.sort((a, b) => a.order - b.order);
  return simulateNetwork(data);
}

/**
 * Obtiene un módulo por su ID (slug).
 */
export async function getModuleById(id: string): Promise<EducationModule | null> {
  const found = modules.find((m) => m.id === id) ?? null;
  return simulateNetwork(found);
}

/**
 * Retorna los IDs de todos los módulos (para generateStaticParams).
 * No necesita delay — solo se usa en build time.
 */
export async function getAllModuleIds(): Promise<string[]> {
  return modules.map((m) => m.id);
}
