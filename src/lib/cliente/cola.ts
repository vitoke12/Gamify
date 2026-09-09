/**
 * Cola de registros hechos sin conexión.
 *
 * Vive en IndexedDB del móvil, no en memoria: si cierras la app o se muere la
 * batería antes de recuperar cobertura, la sesión que apuntaste sigue ahí.
 *
 * Cada entrada lleva su hora REAL. Un entrenamiento apuntado a las siete de
 * la tarde en mitad del campo tiene que contar a las siete de la tarde, no
 * cuando el teléfono vuelva a tener red: si no, la racha y el día lógico
 * saldrían mal.
 */

const BASE = 'gamify';
const ALMACEN = 'cola';

export type RegistroPendiente = {
  /** Clave que también viaja al servidor: es lo que evita duplicar. */
  clave: string;
  actividadId: string;
  actividadNombre: string;
  categoriaNombre: string;
  cantidad: number;
  intensidad: 'suave' | 'normal' | 'exigente';
  /** ISO del momento real en que ocurrió. */
  fecha: string;
};

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const peticion = indexedDB.open(BASE, 1);
    peticion.onupgradeneeded = () => {
      const db = peticion.result;
      if (!db.objectStoreNames.contains(ALMACEN)) {
        db.createObjectStore(ALMACEN, { keyPath: 'clave' });
      }
    };
    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
  });
}

async function conAlmacen<T>(
  modo: IDBTransactionMode,
  accion: (almacen: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await abrir();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(ALMACEN, modo);
      const peticion = accion(tx.objectStore(ALMACEN));
      peticion.onsuccess = () => resolve(peticion.result);
      peticion.onerror = () => reject(peticion.error);
    });
  } finally {
    db.close();
  }
}

/** ¿Puede este navegador guardar cola? En modo incógnito a veces no. */
export function hayCola(): boolean {
  return typeof indexedDB !== 'undefined';
}

export async function encolar(registro: RegistroPendiente): Promise<void> {
  await conAlmacen('readwrite', (a) => a.put(registro));
}

export async function pendientes(): Promise<RegistroPendiente[]> {
  const todos = await conAlmacen<RegistroPendiente[]>('readonly', (a) => a.getAll());
  // Se mandan en el orden en que ocurrieron: el motor recalcula el día
  // entero, y así el resultado no depende del orden de la cola.
  return [...todos].sort((x, y) => x.fecha.localeCompare(y.fecha));
}

export async function quitar(clave: string): Promise<void> {
  await conAlmacen('readwrite', (a) => a.delete(clave));
}

export function nuevaClave(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
