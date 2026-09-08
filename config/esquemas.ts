/**
 * Validacion del config. Las reglas del juego son datos, y los datos mal
 * formados tienen que reventar en el seed y en los tests, no en la UI a las
 * tres semanas. Se valida tambien la coherencia entre archivos: que cada
 * actividad apunte a una categoria y a un nodo que existen, que ningun nodo
 * dependa de si mismo y que no haya ciclos en los requisitos.
 */
import { z } from 'zod';
import { ACTIVIDADES } from './actividades';
import { ARBOLES } from './arboles';
import { CATEGORIAS } from './categorias';
import { LOGROS } from './logros';
import { MISIONES } from './misiones';

const esferaSchema = z.enum(['interior', 'expresion', 'base']);
const unidadSchema = z.enum(['minutos', 'repeticiones', 'paginas']);
const keySchema = z.string().regex(/^[a-z0-9-]+$/, 'las keys van en kebab-case');

export const categoriaSchema = z.object({
  key: keySchema,
  nombre: z.string().min(1),
  esfera: esferaSchema,
  icono: z.string().min(1),
  orden: z.number().int().positive(),
  activa: z.boolean(),
  topeDiarioMin: z.number().int().positive().optional(),
});

export const nodoSchema = z.object({
  key: keySchema,
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  tier: z.number().int().min(1).max(9),
  maxLevel: z.number().int().min(1),
  costePuntos: z.number().int().min(0),
  requiere: z.array(keySchema),
  esMaestria: z.boolean().optional(),
  retoDescripcion: z.string().optional(),
});

export const ramaSchema = z.object({
  key: keySchema,
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  orden: z.number().int().positive(),
  nodos: z.array(nodoSchema).min(1),
});

export const arbolSchema = z.object({
  categoria: keySchema,
  ramas: z.array(ramaSchema),
});

export const actividadSchema = z.object({
  key: keySchema,
  categoria: keySchema,
  nodo: keySchema.optional(),
  nombre: z.string().min(1),
  unidad: unidadSchema,
  minutosPorUnidad: z.number().positive(),
  xpBasePorMinuto: z.number().positive().optional(),
  tierEquivalente: z.number().int().min(1).max(9),
  orden: z.number().int().min(0),
});

export type ProblemaConfig = string;

/** Devuelve la lista de problemas encontrados. Vacia = config sano. */
export function validarConfig(): ProblemaConfig[] {
  const problemas: ProblemaConfig[] = [];

  const revisar = (
    etiqueta: string,
    resultado: { success: boolean; error?: z.ZodError },
  ) => {
    if (!resultado.success && resultado.error) {
      for (const issue of resultado.error.issues) {
        problemas.push(`${etiqueta}: ${issue.path.join('.')} ${issue.message}`);
      }
    }
  };

  revisar('categorias', z.array(categoriaSchema).safeParse(CATEGORIAS));
  revisar('arboles', z.array(arbolSchema).safeParse(ARBOLES));
  revisar('actividades', z.array(actividadSchema).safeParse(ACTIVIDADES));

  const keysCategoria = new Set(CATEGORIAS.map((c) => c.key));
  const duplicadas = CATEGORIAS.length - keysCategoria.size;
  if (duplicadas > 0) problemas.push(`categorias: hay ${duplicadas} key(s) repetida(s)`);

  // Nodos: keys unicas globalmente, requisitos existentes y sin ciclos.
  const nodosPorKey = new Map<string, { requiere: string[]; rama: string }>();
  for (const arbol of ARBOLES) {
    if (!keysCategoria.has(arbol.categoria)) {
      problemas.push(`arboles: la categoria "${arbol.categoria}" no existe`);
    }
    for (const rama of arbol.ramas) {
      for (const nodo of rama.nodos) {
        if (nodosPorKey.has(nodo.key)) {
          problemas.push(`nodos: key duplicada "${nodo.key}"`);
        }
        nodosPorKey.set(nodo.key, { requiere: nodo.requiere, rama: rama.key });
        if (nodo.esMaestria && nodo.costePuntos !== 0) {
          problemas.push(`nodos: "${nodo.key}" es de maestria y no puede costar puntos`);
        }
        if (nodo.esMaestria && !nodo.retoDescripcion) {
          problemas.push(`nodos: "${nodo.key}" es de maestria y necesita un reto`);
        }
      }
    }
  }

  for (const [key, nodo] of nodosPorKey) {
    for (const req of nodo.requiere) {
      if (req === key) problemas.push(`nodos: "${key}" se requiere a si mismo`);
      else if (!nodosPorKey.has(req)) {
        problemas.push(`nodos: "${key}" requiere "${req}", que no existe`);
      }
    }
  }

  for (const key of nodosPorKey.keys()) {
    if (tieneCiclo(key, nodosPorKey)) {
      problemas.push(`nodos: hay un ciclo de requisitos que pasa por "${key}"`);
      break;
    }
  }

  const keysActividad = new Set<string>();
  for (const act of ACTIVIDADES) {
    if (keysActividad.has(act.key)) problemas.push(`actividades: key duplicada "${act.key}"`);
    keysActividad.add(act.key);
    if (!keysCategoria.has(act.categoria)) {
      problemas.push(`actividades: "${act.key}" apunta a la categoria inexistente "${act.categoria}"`);
    }
    if (act.nodo && !nodosPorKey.has(act.nodo)) {
      problemas.push(`actividades: "${act.key}" apunta al nodo inexistente "${act.nodo}"`);
    }
    if (act.unidad === 'minutos' && act.minutosPorUnidad !== 1) {
      problemas.push(`actividades: "${act.key}" mide minutos, minutosPorUnidad debe ser 1`);
    }
  }

  // Una categoria activa sin actividades no se puede registrar: es una
  // promesa rota en el registro rapido.
  for (const cat of CATEGORIAS.filter((c) => c.activa)) {
    if (!ACTIVIDADES.some((a) => a.categoria === cat.key)) {
      problemas.push(`categorias: "${cat.key}" esta activa pero no tiene actividades`);
    }
  }

  // Misiones: una que apunte a una actividad inexistente no se completaria
  // jamas, y el fallo seria invisible.
  const keysMision = new Set<string>();
  for (const m of MISIONES) {
    if (keysMision.has(m.key)) problemas.push(`misiones: key duplicada "${m.key}"`);
    keysMision.add(m.key);
    if (!keysCategoria.has(m.categoria)) {
      problemas.push(`misiones: "${m.key}" apunta a la categoria inexistente "${m.categoria}"`);
    }
    if ('actividad' in m.objetivo && !keysActividad.has(m.objetivo.actividad)) {
      problemas.push(
        `misiones: "${m.key}" apunta a la actividad inexistente "${m.objetivo.actividad}"`,
      );
    }
    if ('categoria' in m.objetivo && !keysCategoria.has(m.objetivo.categoria)) {
      problemas.push(
        `misiones: "${m.key}" apunta a la categoria inexistente "${m.objetivo.categoria}"`,
      );
    }
  }
  for (const tipo of ['principal', 'secundaria', 'ocio', 'sorpresa', 'semanal'] as const) {
    if (!MISIONES.some((m) => m.tipo === tipo)) {
      problemas.push(`misiones: no hay ninguna de tipo "${tipo}"`);
    }
  }

  const keysLogro = new Set<string>();
  for (const l of LOGROS) {
    if (keysLogro.has(l.key)) problemas.push(`logros: key duplicada "${l.key}"`);
    keysLogro.add(l.key);
    const categorias =
      l.condicion.tipo === 'nivelCategoria'
        ? [l.condicion.categoria]
        : l.condicion.tipo === 'nivelEnVarias'
          ? l.condicion.categorias
          : [];
    for (const c of categorias) {
      if (!keysCategoria.has(c)) {
        problemas.push(`logros: "${l.key}" apunta a la categoria inexistente "${c}"`);
      }
    }
  }

  return problemas;
}

function tieneCiclo(
  inicio: string,
  nodos: Map<string, { requiere: string[] }>,
  visitados = new Set<string>(),
): boolean {
  if (visitados.has(inicio)) return true;
  visitados.add(inicio);
  for (const req of nodos.get(inicio)?.requiere ?? []) {
    if (nodos.has(req) && tieneCiclo(req, nodos, new Set(visitados))) return true;
  }
  return false;
}
