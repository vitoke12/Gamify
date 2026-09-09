'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { CloudUpload, TriangleAlert } from 'lucide-react';
import { registrarActividad } from '@/lib/actions/registrar';
import { hayCola, pendientes, quitar } from '@/lib/cliente/cola';

/**
 * Sube lo que se apuntó sin cobertura.
 *
 * El estado vive fuera de React a propósito: la cola es del dispositivo, no
 * de este componente, y así montar la pantalla dos veces no lanza dos subidas.
 *
 * Reglas del reintento, que son la parte delicada:
 *
 *   · si la llamada REVIENTA (no llegó al servidor), la entrada se queda en
 *     la cola y se reintenta más tarde
 *   · si el servidor CONTESTA que no, se quita: ya ha hablado, reintentarlo
 *     mil veces no lo va a convencer y solo taparía el aviso
 *   · si contesta que ya lo tenía, se quita sin más: la clave de cliente hace
 *     que reenviar sea inofensivo
 */

type EstadoCola = {
  enCola: number;
  subiendo: boolean;
  subidos: number;
  rechazados: string[];
};

const VACIO: EstadoCola = { enCola: 0, subiendo: false, subidos: 0, rechazados: [] };

let estado: EstadoCola = VACIO;
let enMarcha = false;
const oyentes = new Set<() => void>();

function fijar(parcial: Partial<EstadoCola>) {
  estado = { ...estado, ...parcial };
  for (const oyente of oyentes) oyente();
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

async function sincronizarTodo(refrescar: () => void) {
  if (enMarcha || !hayCola()) return;
  enMarcha = true;
  try {
    const lista = await pendientes().catch(() => []);
    fijar({ enCola: lista.length });
    if (lista.length === 0 || !navigator.onLine) return;

    fijar({ subiendo: true });
    let bien = 0;
    const mal: string[] = [];

    for (const registro of lista) {
      try {
        const r = await registrarActividad({
          actividadId: registro.actividadId,
          cantidad: registro.cantidad,
          intensidad: registro.intensidad,
          fecha: registro.fecha,
          claveCliente: registro.clave,
        });
        await quitar(registro.clave);
        if (r.ok) bien++;
        else mal.push(`${registro.actividadNombre}: ${r.error}`);
      } catch {
        // No llegó al servidor: se queda en la cola para el próximo intento.
        break;
      }
    }

    const quedan = await pendientes().catch(() => []);
    fijar({ subiendo: false, subidos: bien, rechazados: mal, enCola: quedan.length });
    if (bien > 0 || mal.length > 0) refrescar();
  } finally {
    enMarcha = false;
  }
}

export function Sincronizador() {
  const router = useRouter();
  const cola = useSyncExternalStore(
    suscribir,
    () => estado,
    () => VACIO,
  );

  useEffect(() => {
    const refrescar = () => router.refresh();
    void sincronizarTodo(refrescar);
    const alVolver = () => void sincronizarTodo(refrescar);
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
  }, [router]);

  if (cola.enCola === 0 && cola.subidos === 0 && cola.rechazados.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {cola.enCola > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-sky-800/60 bg-sky-950/30 px-4 py-3">
          <CloudUpload className="size-4 shrink-0 text-sky-300" />
          <span className="flex-1 text-xs text-sky-200/85">
            {cola.enCola === 1
              ? 'Tienes 1 registro esperando a subir.'
              : `Tienes ${cola.enCola} registros esperando a subir.`}{' '}
            {cola.subiendo ? 'Subiendo…' : 'Se enviarán solos en cuanto haya conexión.'}
          </span>
          {!cola.subiendo && (
            <button
              type="button"
              onClick={() => void sincronizarTodo(() => router.refresh())}
              className="shrink-0 text-xs text-sky-300 underline underline-offset-4"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {cola.subidos > 0 && cola.enCola === 0 && (
        <p className="rounded-xl border border-emerald-900 bg-emerald-950/30 px-4 py-2.5 text-xs text-emerald-300">
          {cola.subidos === 1
            ? 'Se ha subido 1 registro que tenías pendiente. Su XP ya está contada.'
            : `Se han subido ${cola.subidos} registros pendientes. Su XP ya está contada.`}
        </p>
      )}

      {cola.rechazados.map((r) => (
        <p
          key={r}
          className="flex items-start gap-2 rounded-xl border border-amber-800/60 bg-amber-950/25 px-4 py-2.5 text-xs text-amber-200/85"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {r}
        </p>
      ))}
    </div>
  );
}
