/**
 * Tipos para el módulo de Educación Financiera.
 *
 * Esta interface es el CONTRATO entre la data estática (hoy)
 * y el CMS (mañana). Cuando migres a CMS, solo cambias
 * `get-modules.ts` — los tipos no se tocan.
 */

export type Mascot = 'buho' | 'ardilla';

export interface ExternalLink {
  institution: string;   // "SBS", "BCP", "Khan Academy"
  label: string;         // "ABC del BCP"
  url: string;           // URL completa
}

export interface EducationModule {
  id: string;
  order: number;
  title: string;
  mascot: Mascot;
  description: string;
  thumbnail: string;
  // Capa 1: Video
  videoUrl: string | null;
  videoDuration: string | null;  // "0:45"
  videoTitle: string | null;
  // Capa 2: Contenido escrito (blog + viñetas)
  /** Párrafos de texto libre tipo blog — contexto narrativo del tema */
  bodyParagraphs: string[];
  /** Puntos clave / viñetas destacadas */
  summaryPoints: string[];
  downloadUrl: string | null;
  downloadLabel: string | null;
  // Capa 3: Enlaces externos
  externalLinks: ExternalLink[];
}
