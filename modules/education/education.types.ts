/**
 * Tipos del dominio Educación Financiera.
 *
 * Este es el CONTRATO entre la data (hoy estática, mañana CMS)
 * y los componentes. Si cambias la fuente de datos, estos tipos no se tocan.
 */

export type Mascot = 'buho' | 'ardilla';

export interface ExternalLink {
  institution: string;
  label: string;
  url: string;
}

export interface EducationModule {
  id: string;
  order: number;
  title: string;
  mascot: Mascot;
  description: string;
  thumbnail: string;
  videoUrl: string | null;
  videoDuration: string | null;
  videoTitle: string | null;
  bodyParagraphs: string[];
  summaryPoints: string[];
  downloadUrl: string | null;
  downloadLabel: string | null;
  externalLinks: ExternalLink[];
}

/** Subconjunto para listados (carruseles, grids) — menos payload */
export interface EducationModuleSummary {
  id: string;
  order: number;
  title: string;
  mascot: Mascot;
  description: string;
  thumbnail: string;
  videoDuration: string | null;
  videoUrl: string | null;
  downloadUrl: string | null;
  externalLinks: ExternalLink[];
}
