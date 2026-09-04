/**
 * Mapper de Educación — transforma datos del backend al formato del frontend.
 *
 * Usado por education.service.ts, que llama a `pe.com.fondea.backend.education`
 * (módulo nuevo — el contenido hoy vive como una lista estática en el backend, no en BD, pero
 * el contrato/JSON no cambia si eso migra a una tabla más adelante).
 *
 * Regla: el mapper NUNCA lanza excepciones. Si un campo falta, usa valor default.
 */

import type { EducationModule, EducationModuleSummary, Mascot } from './education.types';

/**
 * CMS/Backend → EducationModule (formato frontend).
 * Adaptar cuando se conecte el CMS real.
 */
export function mapModuleFromBackend(raw: Record<string, unknown>): EducationModule {
  return {
    id: String(raw.id ?? ''),
    order: Number(raw.order ?? 0),
    title: String(raw.title ?? ''),
    mascot: normalizeMascot(raw.mascot),
    description: String(raw.description ?? ''),
    thumbnail: String(raw.thumbnail ?? ''),
    videoUrl: raw.video_url ? String(raw.video_url) : null,
    videoDuration: raw.video_duration ? String(raw.video_duration) : null,
    videoTitle: raw.video_title ? String(raw.video_title) : null,
    bodyParagraphs: Array.isArray(raw.body_paragraphs) ? raw.body_paragraphs.map(String) : [],
    summaryPoints: Array.isArray(raw.summary_points) ? raw.summary_points.map(String) : [],
    downloadUrl: raw.download_url ? String(raw.download_url) : null,
    downloadLabel: raw.download_label ? String(raw.download_label) : null,
    externalLinks: Array.isArray(raw.external_links)
      ? raw.external_links.map(mapExternalLink)
      : [],
  };
}

/**
 * EducationModule → EducationModuleSummary (menos payload para listados).
 */
export function mapModuleToSummary(mod: EducationModule): EducationModuleSummary {
  return {
    id: mod.id,
    order: mod.order,
    title: mod.title,
    mascot: mod.mascot,
    description: mod.description,
    thumbnail: mod.thumbnail,
    videoDuration: mod.videoDuration,
    videoUrl: mod.videoUrl,
    downloadUrl: mod.downloadUrl,
    externalLinks: mod.externalLinks,
  };
}

// ── Helpers internos ─────────────────────────────────────────────────────────

function normalizeMascot(value: unknown): Mascot {
  if (value === 'buho' || value === 'ardilla') return value;
  return 'buho'; // default seguro
}

function mapExternalLink(raw: unknown): { institution: string; label: string; url: string } {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    institution: String(obj.institution ?? ''),
    label: String(obj.label ?? ''),
    url: String(obj.url ?? ''),
  };
}
