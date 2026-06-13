/**
 * Data estática de los módulos de educación financiera.
 *
 * Cuando se conecte un CMS (Supabase, Strapi, Sanity, etc.),
 * este archivo se elimina y education.service.ts hará fetch en vez de leer de aquí.
 *
 * Re-exporta la data existente de lib/education/modules.ts para no duplicar.
 */

import { modules } from '@/lib/education/modules';
import type { EducationModule } from './education.types';

export const educationData: EducationModule[] = modules;
