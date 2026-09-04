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
