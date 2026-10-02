export interface Calificaciones {
  atencion?: number | null;
  comida?: number | null;
  bebida?: number | null;
  postre?: number | null;
  precio?: number | null;
  ambiente?: number | null;
  [key: string]: number | null | undefined;
}

export interface FotoItem {
  id: string;
  url: string;
  pieDeFoto?: string;
}

export interface Resena {
  id: string;
  titulo: string;
  ubicacion: string;
  lat?: number;
  lng?: number;
  resena: string;
  calificaciones: Calificaciones;
  precio: number; // 1 to 5
  fotaPortada?: string;
  fecha?: string;
  etiquetas?: string[];
  platoInsignia?: string; // "Qué pedir sí o sí"
  ocasion?: string[]; // p.ej. ["Primera Cita", "Con Amigos", "Sobremesa Larga"]
  galeria?: (FotoItem | string)[];
  destacadoDelMes?: boolean; // Badge "Destacado del Mes · Recomendación del Autor"
}

export interface SobreNosotrosData {
  activo: boolean;
  titulo: string;
  subtitulo: string;
  fotoPortada: string;
  texto: string;
  fotos: (FotoItem | string)[]; // hasta 10+ fotos con pie de foto opcional
}

export interface Receta {
  id: string;
  titulo: string;
  descripcion: string;
  fotaPortada?: string;
  tiempo?: string;
  porciones?: string;
  ingredientes?: string[];
  pasos?: string[];
  etiquetas?: string[];
  galeria?: (FotoItem | string)[];
}

export interface Pendiente {
  id: string;
  nombre: string;
  direccion: string;
  lat?: number;
  lng?: number;
  descripcion: string;
  categoria?: string;
  fotaPortada?: string;
  galeria?: (FotoItem | string)[];
}

export interface Configuracion {
  nombre: string;
  slogan: string;
  ratingSymbol: string;
  mapsApiKey: string;
  logoUrl?: string | null;
}

export interface AppState {
  resenas: Resena[];
  recetas: Receta[];
  pendientes: Pendiente[];
  config: Configuracion;
  sobreNosotros?: SobreNosotrosData;
  deletedIds?: string[]; // IDs o nombres normalizados borrados permanentemente (tombstones)
  timestamp?: number;
  updatedAt?: string;
}

export type Seccion = 'inicio' | 'resenas' | 'mapa' | 'recetas' | 'pendientes' | 'sobre-nosotros';

export interface MarkerLocation {
  id: string;
  titulo: string;
  tipo: 'visitado' | 'pendiente';
  direccion: string;
  lat: number;
  lng: number;
  rating?: number;
  precio?: number;
  imagen?: string;
  descripcionBreve: string;
  rawResena?: Resena;
}
