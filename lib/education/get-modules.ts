import { modules } from './modules';
import type { EducationModule } from './types';

/**
 * Obtiene todos los módulos de educación financiera.
 *
 * HOY: retorna el array estático de `modules.ts`.
 * MAÑANA: reemplazar por fetch a CMS (Supabase, Strapi, etc.)
 */
export async function getModules(): Promise<EducationModule[]> {
  return modules.sort((a, b) => a.order - b.order);
}

/**
 * Obtiene un módulo por su ID (slug).
 */
export async function getModuleById(id: string): Promise<EducationModule | null> {
  return modules.find((m) => m.id === id) ?? null;
}

/**
 * Retorna los IDs de todos los módulos (para generateStaticParams).
 */
export async function getAllModuleIds(): Promise<string[]> {
  return modules.map((m) => m.id);
}
