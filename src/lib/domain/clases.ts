/**
 * Sistema de clases. Nunca lo elige el usuario: emerge de dónde puso el
 * esfuerzo, y ese es todo el punto. Que puedas mirar atrás y ver que fuiste
 * Erudito hace un año y ahora eres Nómada cuenta una historia que ninguna
 * barra de progreso cuenta.
 *
 * Se reparte sobre los niveles GANADOS (nivel - 1), no sobre el nivel bruto:
 * todas las categorías empiezan en 1, así que contar el nivel entero daría a
 * un perfil recién creado diez categorías empatadas al 10% y una clase que no
 * significa nada.
 */
import { CLASES, CLASE_POLIMATA, UMBRALES_CLASE, type DefClase } from '@config/clases';
import type { TipoClase } from './tipos';

export type Clase = {
  key: string;
  nombre: string;
  tipo: TipoClase;
  descripcion: string;
  /** Las categorías que la han provocado, de mayor a menor. */
  dominantes: string[];
  /** Reparto del esfuerzo, 0..1 por categoría. */
  distribucion: Record<string, number>;
  /** Pasiva: +10% en la dominante, +25% en la más descuidada. */
  pasiva: { dominante: string | null; descuidada: string | null };
};

function buscar(key: string): DefClase {
  return CLASES.find((c) => c.key === key) ?? CLASES[CLASES.length - 1];
}

function claseHibrida(a: string, b: string): DefClase | undefined {
  return CLASES.find(
    (c) =>
      c.tipo === 'hibrida' &&
      c.categorias.length === 2 &&
      c.categorias.includes(a) &&
      c.categorias.includes(b),
  );
}

function clasePura(categoria: string): DefClase | undefined {
  return CLASES.find((c) => c.tipo === 'pura' && c.categorias[0] === categoria);
}

/**
 * Devuelve null mientras no haya esfuerzo repartido: sin un solo nivel
 * ganado no hay clase que emerja, y ponerle una etiqueta al azar el primer
 * día sería inventarse una identidad.
 */
export function calcularClase(
  nivelPorCategoria: Record<string, number>,
  categorias: readonly string[],
): Clase | null {
  const puntos: Record<string, number> = {};
  let total = 0;
  for (const c of categorias) {
    const ganados = Math.max(0, (nivelPorCategoria[c] ?? 1) - 1);
    puntos[c] = ganados;
    total += ganados;
  }
  if (total === 0) return null;

  const distribucion: Record<string, number> = {};
  for (const c of categorias) distribucion[c] = puntos[c] / total;

  const orden = [...categorias].sort((a, b) => distribucion[b] - distribucion[a]);
  const [primera, segunda] = orden;
  const cuotaPrimera = distribucion[primera] ?? 0;
  const cuotaSegunda = segunda ? (distribucion[segunda] ?? 0) : 0;

  let definicion: DefClase | undefined;
  let dominantes: string[] = [];

  if (cuotaPrimera > UMBRALES_CLASE.pura) {
    definicion = clasePura(primera);
    dominantes = [primera];
  } else if (segunda && cuotaPrimera + cuotaSegunda > UMBRALES_CLASE.hibrida) {
    definicion = claseHibrida(primera, segunda);
    dominantes = [primera, segunda];
  }

  // Polímata es el cajón de sastre a propósito: sin él quedarían huecos sin
  // clase (una pareja dominante que no tiene nombre, o un perfil a medio
  // camino entre concentrado y repartido) y el usuario se quedaría sin
  // identidad por un tecnicismo del reparto.
  if (!definicion) {
    definicion = buscar(CLASE_POLIMATA);
    dominantes = cuotaPrimera > 0 ? [primera] : [];
  }

  const conEsfuerzo = categorias.filter((c) => puntos[c] > 0);
  const descuidada =
    conEsfuerzo.length > 0
      ? [...categorias].sort((a, b) => distribucion[a] - distribucion[b])[0]
      : null;

  return {
    key: definicion.key,
    nombre: definicion.nombre,
    tipo: definicion.tipo as TipoClase,
    descripcion: definicion.descripcion,
    dominantes,
    distribucion,
    pasiva: {
      dominante: dominantes[0] ?? null,
      descuidada: descuidada && descuidada !== dominantes[0] ? descuidada : null,
    },
  };
}

/** Un capítulo del historial: la clase que fuiste en un mes concreto. */
export type CapituloClase = {
  mes: string;
  claseKey: string;
  nombre: string;
  tipo: TipoClase;
  dominantes: string[];
  /** true si cambiaste de clase respecto al mes anterior. */
  esCambio: boolean;
};

/** Convierte una lista de snapshots en capítulos, marcando los cambios. */
export function capitulos(
  snapshots: readonly { mes: string; claseKey: string; tipo: string; dominantes: string[] }[],
): CapituloClase[] {
  const ordenados = [...snapshots].sort((a, b) => a.mes.localeCompare(b.mes));
  return ordenados.map((s, i) => {
    const definicion = buscar(s.claseKey);
    return {
      mes: s.mes,
      claseKey: s.claseKey,
      nombre: definicion.nombre,
      tipo: s.tipo as TipoClase,
      dominantes: s.dominantes,
      esCambio: i === 0 || ordenados[i - 1].claseKey !== s.claseKey,
    };
  });
}
