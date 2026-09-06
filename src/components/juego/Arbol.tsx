'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Check, ChevronLeft, Lock, RotateCcw, Sparkles } from 'lucide-react';
import { BarraProgreso } from '@/components/juego/BarraProgreso';
import { desbloquearNodo, respecCategoria, verificarMaestria } from '@/lib/actions/arbol';
import type { ArbolVista, NodoVista } from '@/lib/db/arbol';
import { acentoDe, formatearXp } from '@/lib/ui/esferas';

type Pestana = { key: string; nombre: string };

export function Arbol({ arbol, pestanas }: { arbol: ArbolVista; pestanas: Pestana[] }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [ramaActiva, setRamaActiva] = useState(arbol.ramas[0]?.key ?? '');
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);
  const [confirmandoRespec, setConfirmandoRespec] = useState(false);

  const acento = acentoDe(arbol.categoria.esfera);
  const rama = arbol.ramas.find((r) => r.key === ramaActiva) ?? arbol.ramas[0];

  function ejecutar(accion: () => Promise<{ ok: boolean; mensaje?: string; error?: string }>) {
    iniciar(async () => {
      try {
        const r = await accion();
        setMensaje({ texto: r.ok ? (r.mensaje ?? '') : (r.error ?? ''), error: !r.ok });
        if (r.ok) router.refresh();
      } catch {
        setMensaje({ texto: 'No se ha podido guardar. Intentalo otra vez.', error: true });
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-24 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-borde bg-superficie"
          aria-label="Volver"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold">Árbol de habilidades</h1>
        {/* Los puntos libres no se esconden nunca: son la moneda de la pantalla. */}
        <div
          className="shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold tabular-nums"
          style={{ borderColor: `${acento}66`, color: acento }}
          title="Puntos de habilidad libres en esta categoría"
        >
          {arbol.puntos.libres} pts
        </div>
      </header>

      {/* Pestaña de categoría */}
      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {pestanas.map((p) => (
          <Link
            key={p.key}
            href={`/arbol/${p.key}`}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
              p.key === arbol.categoria.key
                ? 'border-transparent bg-superficie-alta font-medium text-texto'
                : 'border-borde text-tenue'
            }`}
          >
            {p.nombre}
          </Link>
        ))}
      </nav>

      <p className="mt-3 text-sm text-tenue">
        Nivel {arbol.categoria.nivel} · {formatearXp(arbol.categoria.xp)} XP ·{' '}
        {arbol.puntos.gastados} de {arbol.puntos.ganados} puntos invertidos
      </p>

      {/* Selector de rama: nunca todo el árbol a la vez */}
      <div className="mt-4 flex flex-wrap gap-2">
        {arbol.ramas.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRamaActiva(r.key)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              r.key === rama?.key ? 'text-texto' : 'border-borde text-tenue'
            }`}
            style={r.key === rama?.key ? { borderColor: acento, color: acento } : undefined}
          >
            {r.nombre}
          </button>
        ))}
      </div>

      {mensaje && (
        <p
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            mensaje.error
              ? 'border-red-900 bg-red-950/40 text-red-300'
              : 'border-emerald-900 bg-emerald-950/40 text-emerald-300'
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      {rama?.descripcion && <p className="mt-4 text-sm text-tenue">{rama.descripcion}</p>}

      <ul className="mt-4 space-y-2.5">
        {rama?.nodos.map((nodo) => (
          <TarjetaNodo
            key={nodo.id}
            nodo={nodo}
            acento={acento}
            pendiente={pendiente}
            onDesbloquear={() => ejecutar(() => desbloquearNodo(nodo.id))}
            onVerificar={(evidencia) => ejecutar(() => verificarMaestria(nodo.id, evidencia))}
          />
        ))}
      </ul>

      {/* Respec: quita el miedo a elegir mal, no invita a reoptimizar cada semana */}
      <section className="mt-8 rounded-2xl border border-borde bg-superficie p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <RotateCcw className="size-4 text-tenue" />
          Reiniciar los puntos de {arbol.categoria.nombre}
        </div>
        <p className="mt-2 text-xs text-tenue">
          Devuelve los {arbol.puntos.gastados} puntos invertidos y conserva toda la XP. Una vez
          cada 90 días.
        </p>
        {!arbol.respec.disponible ? (
          <p className="mt-3 text-xs text-tenue">
            Disponible en {arbol.respec.diasRestantes} días.
          </p>
        ) : arbol.puntos.gastados === 0 ? (
          <p className="mt-3 text-xs text-tenue">Todavía no has invertido nada aquí.</p>
        ) : confirmandoRespec ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                setConfirmandoRespec(false);
                ejecutar(() => respecCategoria(arbol.categoria.key));
              }}
              className="flex-1 rounded-lg border border-red-800 bg-red-950/40 py-2.5 text-sm text-red-300"
            >
              Sí, devolver {arbol.puntos.gastados} puntos
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoRespec(false)}
              className="rounded-lg border border-borde px-4 py-2.5 text-sm text-tenue"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoRespec(true)}
            className="mt-3 w-full rounded-lg border border-borde py-2.5 text-sm text-tenue"
          >
            Reiniciar puntos
          </button>
        )}
      </section>
    </div>
  );
}

function TarjetaNodo({
  nodo,
  acento,
  pendiente,
  onDesbloquear,
  onVerificar,
}: {
  nodo: NodoVista;
  acento: string;
  pendiente: boolean;
  onDesbloquear: () => void;
  onVerificar: (evidencia: string) => void;
}) {
  const [evidencia, setEvidencia] = useState('');
  const [abriendoReto, setAbriendoReto] = useState(false);

  // Cuatro estados que se distinguen sin leer una palabra.
  const estilos: Record<string, string> = {
    dominado: 'border-emerald-500/50 bg-emerald-500/[0.06]',
    'en-progreso': 'bg-superficie',
    disponible: 'border-borde bg-superficie',
    bloqueado: 'border-dashed border-borde bg-superficie/40 opacity-60',
  };
  const esMaestriaPendiente = nodo.esMaestria && nodo.estado !== 'dominado';

  return (
    <li
      className={`rounded-xl border p-4 ${
        esMaestriaPendiente ? 'border-amber-500/50 bg-amber-500/[0.06]' : estilos[nodo.estado]
      }`}
      style={
        nodo.estado === 'en-progreso' && !nodo.esMaestria ? { borderColor: acento } : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {nodo.estado === 'dominado' && (
              <Check className="size-4 shrink-0 text-emerald-400" strokeWidth={3} />
            )}
            {nodo.estado === 'bloqueado' && <Lock className="size-3.5 shrink-0 text-tenue" />}
            {esMaestriaPendiente && <Sparkles className="size-4 shrink-0 text-amber-400" />}
            <h3 className="truncate font-medium">{nodo.nombre}</h3>
          </div>
          {nodo.descripcion && (
            <p className="mt-1 text-xs text-tenue">{nodo.descripcion}</p>
          )}
        </div>
        <span className="shrink-0 rounded border border-borde px-1.5 py-0.5 text-[10px] text-tenue">
          T{nodo.tier}
        </span>
      </div>

      {nodo.estado === 'en-progreso' && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between text-xs text-tenue">
            <span>
              Nivel {nodo.nivel} de {nodo.maxLevel}
            </span>
            <span className="tabular-nums">{formatearXp(nodo.xpEnNodo)} XP practicados</span>
          </div>
          <div className="mt-2">
            <BarraProgreso progreso={nodo.progreso} acento={acento} />
          </div>
        </div>
      )}

      {nodo.estado === 'dominado' && !nodo.esMaestria && (
        <p className="mt-3 text-xs text-emerald-400/90">
          Dominado · nivel {nodo.maxLevel} · {formatearXp(nodo.xpEnNodo)} XP
        </p>
      )}

      {/* Un nodo bloqueado nunca se esconde: enseña justo lo que le falta. */}
      {nodo.estado === 'bloqueado' && (
        <p className="mt-3 text-xs text-tenue">
          {nodo.faltan.length > 0 ? `Necesitas: ${nodo.faltan.join(', ')}` : 'Bloqueado'}
        </p>
      )}

      {nodo.estado === 'disponible' && !nodo.esMaestria && (
        <button
          type="button"
          disabled={!nodo.comprable || pendiente}
          onClick={onDesbloquear}
          className="mt-3 w-full rounded-lg border py-2.5 text-sm font-medium transition-colors disabled:opacity-45"
          style={{ borderColor: nodo.comprable ? acento : undefined, color: nodo.comprable ? acento : undefined }}
        >
          {nodo.comprable
            ? `Desbloquear · ${nodo.costePuntos} pts`
            : `Necesitas ${nodo.costePuntos} pts`}
        </button>
      )}

      {esMaestriaPendiente && (
        <div className="mt-3">
          {nodo.retoDescripcion && (
            <p className="text-xs text-amber-200/80">{nodo.retoDescripcion}</p>
          )}
          {nodo.estado === 'bloqueado' ? null : !abriendoReto ? (
            <button
              type="button"
              onClick={() => setAbriendoReto(true)}
              className="mt-3 w-full rounded-lg border border-amber-500/50 py-2.5 text-sm font-medium text-amber-300"
            >
              He superado el reto
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <textarea
                value={evidencia}
                onChange={(e) => setEvidencia(e.target.value)}
                rows={3}
                placeholder="Qué lo demuestra: enlace al vídeo, dato del wearable, quién lo vio..."
                className="w-full rounded-lg border border-borde bg-fondo px-3 py-2 text-sm outline-none focus:border-amber-500/60"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pendiente || evidencia.trim().length < 10}
                  onClick={() => onVerificar(evidencia)}
                  className="flex-1 rounded-lg border border-amber-500/50 py-2.5 text-sm font-medium text-amber-300 disabled:opacity-45"
                >
                  Verificar
                </button>
                <button
                  type="button"
                  onClick={() => setAbriendoReto(false)}
                  className="rounded-lg border border-borde px-4 py-2.5 text-sm text-tenue"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-[11px] text-tenue">
                Esto no lo compra la moneda del juego. Si te lo regalas, el árbol deja de
                significar algo.
              </p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
