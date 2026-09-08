import {
  Brain,
  Briefcase,
  Coffee,
  Compass,
  Dumbbell,
  HeartPulse,
  Palette,
  PiggyBank,
  Sunrise,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** Acento por esfera. Se inyecta como variable CSS para no generar clases dinamicas. */
export const ACENTO: Record<string, string> = {
  interior: '#2dd4bf',
  expresion: '#c084fc',
  base: '#fbbf24',
};

export function acentoDe(esfera: string): string {
  return ACENTO[esfera] ?? '#8b9cb0';
}

/** Mapa explicito: importar todo lucide se lleva por delante el bundle. */
const ICONOS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  brain: Brain,
  'heart-pulse': HeartPulse,
  users: Users,
  briefcase: Briefcase,
  palette: Palette,
  compass: Compass,
  sunrise: Sunrise,
  'piggy-bank': PiggyBank,
  coffee: Coffee,
};

export function iconoDe(nombre: string): LucideIcon {
  return ICONOS[nombre] ?? Compass;
}

export function formatearXp(xp: number): string {
  return xp.toLocaleString('es-ES');
}

/**
 * Colores para las graficas. Son un paso mas oscuros que los acentos de la
 * interfaz porque las marcas de datos tienen que caer dentro de la banda de
 * luminosidad del fondo oscuro (OKLCH L 0,48-0,67). Validados con el
 * comprobador de paletas: banda, croma, separacion para daltonismo y
 * contraste, todo en verde.
 */
export const GRAFICA = {
  interior: '#0d9488',
  expresion: '#a855f7',
  base: '#d97706',
  /** Serie "ahora" frente a serie "antes" en las comparativas. */
  ahora: '#0d9488',
  antes: '#d97706',
  rejilla: '#22303f',
  texto: '#8b9cb0',
} as const;

export function graficaDe(esfera: string): string {
  return GRAFICA[esfera as keyof typeof GRAFICA] ?? GRAFICA.interior;
}
