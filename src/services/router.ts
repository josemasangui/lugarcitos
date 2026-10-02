import { Seccion, Resena, Receta, AppState } from '../types';

/**
 * Creates a URL-friendly slug from any string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns the path for a given top-level section
 */
export function getPathForSection(sec: Seccion): string {
  switch (sec) {
    case 'resenas':
      return '/resenas';
    case 'mapa':
      return '/mapa';
    case 'recetas':
      return '/recetas';
    case 'pendientes':
      return '/pendientes';
    case 'sobre-nosotros':
      return '/sobre-nosotros';
    case 'inicio':
    default:
      return '/';
  }
}

/**
 * Returns the unique path for an item, matching the exact pattern:
 * "/resenas-nombre-del-local" or "/recetas-nombre-del-plato"
 */
export function getPathForDetail(item: Resena | Receta, tipo: 'resena' | 'receta'): string {
  const slug = slugify(item.titulo || item.id);
  const prefix = tipo === 'resena' ? 'resenas' : 'recetas';
  return `/${prefix}-${slug}`;
}

/**
 * Returns the absolute URL for sharing or displaying
 */
export function getFullUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

export interface RouteResolution {
  seccion: Seccion;
  detailItem: {
    item: Resena | Receta;
    tipo: 'resena' | 'receta';
  } | null;
}

/**
 * Resolves current pathname into active section and optional detail item
 */
export function resolveRoute(pathname: string, state: AppState): RouteResolution {
  const cleanPath = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';

  // 1. Check for specific review detail e.g. /resenas-nombre-del-local or /resena-nombre-del-local
  const resenaMatch = cleanPath.match(/^\/rese[nñ]as?[-/](.+)$/);
  if (resenaMatch) {
    const targetSlug = resenaMatch[1];
    const match = state.resenas.find(
      (r) =>
        slugify(r.titulo) === targetSlug ||
        r.id === targetSlug ||
        slugify(r.id) === targetSlug
    );
    if (match) {
      return {
        seccion: 'resenas',
        detailItem: { item: match, tipo: 'resena' }
      };
    }
  }

  // 2. Check for specific recipe detail e.g. /recetas-nombre-del-plato or /receta-nombre-del-plato
  const recetaMatch = cleanPath.match(/^\/recetas?[-/](.+)$/);
  if (recetaMatch) {
    const targetSlug = recetaMatch[1];
    const match = state.recetas.find(
      (r) =>
        slugify(r.titulo) === targetSlug ||
        r.id === targetSlug ||
        slugify(r.id) === targetSlug
    );
    if (match) {
      return {
        seccion: 'recetas',
        detailItem: { item: match, tipo: 'receta' }
      };
    }
  }

  // 3. Check for top-level sections
  if (cleanPath === '/resenas' || cleanPath === '/reseñas') {
    return { seccion: 'resenas', detailItem: null };
  }
  if (cleanPath === '/mapa') {
    return { seccion: 'mapa', detailItem: null };
  }
  if (cleanPath === '/recetas') {
    return { seccion: 'recetas', detailItem: null };
  }
  if (cleanPath === '/pendientes') {
    return { seccion: 'pendientes', detailItem: null };
  }
  if (cleanPath === '/sobre-nosotros' || cleanPath === '/nosotros') {
    if (state.sobreNosotros && state.sobreNosotros.activo === false) {
      return { seccion: 'inicio', detailItem: null };
    }
    return { seccion: 'sobre-nosotros', detailItem: null };
  }

  // 4. Default to inicio
  return { seccion: 'inicio', detailItem: null };
}

/**
 * Changes browser URL without full page reload
 */
export function pushRoute(path: string, title?: string): void {
  if (typeof window !== 'undefined' && window.history) {
    window.history.pushState(null, '', path);
    if (title) {
      document.title = title;
    }
  }
}
