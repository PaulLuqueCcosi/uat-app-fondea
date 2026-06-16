/**
 * Tipos de paginación — compatibles con Spring Data (Java).
 *
 * Spring usa:
 * - Request: ?page=0&size=10&sort=createdAt,desc
 * - Response: { content: T[], totalElements, totalPages, number, size, first, last }
 *
 * Aquí mapeamos a nombres más claros para el frontend.
 */

// ── Request (lo que enviamos al backend) ──────────────────────────────────────

export interface PaginatedRequest {
  /** Página actual (0-based, como Spring Data) */
  page: number;
  /** Tamaño de página (default 10) */
  size: number;
  /** Campo de ordenamiento (ej: "createdAt") */
  sortBy?: string;
  /** Dirección de ordenamiento */
  sortDir?: 'asc' | 'desc';
  /** Búsqueda por texto (opcional) */
  search?: string;
}

// ── Response (lo que devuelve el backend, mapeado) ────────────────────────────

export interface PaginatedResponse<T> {
  /** Items de la página actual */
  items: T[];
  /** Total de registros en toda la colección */
  totalElements: number;
  /** Total de páginas */
  totalPages: number;
  /** Página actual (0-based) */
  page: number;
  /** Tamaño de página */
  size: number;
  /** ¿Es la primera página? */
  first: boolean;
  /** ¿Es la última página? */
  last: boolean;
}

// ── Mapper: Spring Page<T> → PaginatedResponse<T> ─────────────────────────────

/**
 * Convierte la respuesta de Spring Data Page<T> a nuestro tipo.
 *
 * Spring devuelve:
 * {
 *   content: [...],
 *   totalElements: 42,
 *   totalPages: 5,
 *   number: 0,        ← página actual (0-based)
 *   size: 10,
 *   first: true,
 *   last: false
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSpringPage<T>(raw: any, mapItem: (item: any) => T): PaginatedResponse<T> {
  return {
    items: (raw.content ?? []).map(mapItem),
    totalElements: raw.totalElements ?? raw.total_elements ?? 0,
    totalPages: raw.totalPages ?? raw.total_pages ?? 0,
    page: raw.number ?? raw.page ?? 0,
    size: raw.size ?? 10,
    first: raw.first ?? (raw.number === 0),
    last: raw.last ?? (raw.number >= (raw.totalPages ?? 1) - 1),
  };
}

// ── Helper: construir query params para Spring ────────────────────────────────

export function buildPageParams(request: PaginatedRequest): URLSearchParams {
  const params = new URLSearchParams();
  params.set('page', String(request.page));
  params.set('size', String(request.size));
  if (request.sortBy) {
    params.set('sort', `${request.sortBy},${request.sortDir ?? 'desc'}`);
  }
  if (request.search) {
    params.set('search', request.search);
  }
  return params;
}

// ── Default request ───────────────────────────────────────────────────────────

export const DEFAULT_PAGE_REQUEST: PaginatedRequest = {
  page: 0,
  size: 10,
  sortBy: 'createdAt',
  sortDir: 'desc',
};
