'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronLeft } from 'lucide-react';
import type { CategoriaRegistrable } from '@/lib/db/consultas';
import { registrarActividad, type ResultadoRegistro } from '@/lib/actions/registrar';
import { acentoDe, formatearXp, iconoDe } from '@/lib/ui/esferas';

type Actividad = CategoriaRegistrable['actividades'][number];

const INTENSIDADES = [
  { clave: 'suave', etiqueta: 'Suave', pista: 'x0,8' },
  { clave: 'normal', etiqueta: 'Normal', pista: 'x1' },
  { clave: 'exigente', etiqueta: 'Exigente', pista: 'x1,5' },
] as const;

/** Rango y atajos por unidad: tocar un preset debe bastar casi siempre. */
const ESCALAS = {
  minutos: { min: 5, max: 180, paso: 5, presets: [15, 30, 45, 60, 90], sufijo: 'min' },
  paginas: { min: 5, max: 200, paso: 5, presets: [10, 20, 30, 50], sufijo: 'pags' },
  repeticiones: { min: 5, max: 300, paso: 5, presets: [10, 25, 50, 100], sufijo: 'reps' },
} as const;

export function RegistroRapido({ categorias }: { categorias: CategoriaRegistrable[] }) {
  const router = useRouter();
  const [enviando, iniciarEnvio] = useTransition();

  const [categoria, setCategoria] = useState<CategoriaRegistrable | null>(null);
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [cantidad, setCantidad] = useState(30);
  const [intensidad, setIntensidad] = useState<'suave' | 'normal' | 'exigente'>('normal');
  const [resultado, setResultado] = useState<ResultadoRegistro | null>(null);

  const escala = actividad ? ESCALAS[actividad.unidad] : ESCALAS.minutos;

  function elegirActividad(a: Actividad) {
    setActividad(a);
    setCantidad(ESCALAS[a.unidad].presets[1]);
  }

  function confirmar() {
    if (!actividad) return;
    iniciarEnvio(async () => {
      try {
        const r = await registrarActividad({
          actividadId: actividad.id,
          cantidad,
          intensidad,
        });
        setResultado(r);
        if (r.ok) {
          router.refresh();
          setTimeout(() => router.push('/'), r.subioNivel ? 3200 : 2000);
        }
      } catch {
        // Sin esto, un fallo del servidor deja el boton en "Guardando..."
        // para siempre y la sesion registrada se pierde sin avisar.
        setResultado({ ok: false, error: 'No se ha podido guardar. Intentalo otra vez.' });
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-32 pt-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (actividad ? setActividad(null) : categoria ? setCategoria(null) : router.push('/'))}
          className="grid size-10 place-items-center rounded-full border border-borde bg-superficie"
          aria-label="Atras"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">
          {!categoria ? 'Que has hecho' : !actividad ? categoria.nombre : actividad.nombre}
        </h1>
      </header>

      {/* Paso 1: categoria */}
      {!categoria && (
        <ul className="mt-6 grid grid-cols-2 gap-2.5">
          {categorias.map((c) => {
            const Icono = iconoDe(c.icono);
            const acento = acentoDe(c.esfera);
            return (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => setCategoria(c)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-borde bg-superficie p-4 text-left active:scale-[0.98] transition-transform"
                >
                  <Icono className="size-5 shrink-0" style={{ color: acento }} />
                  <span className="truncate font-medium">{c.nombre}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Paso 2: actividad */}
      {categoria && !actividad && (
        <ul className="mt-6 divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
          {categoria.actividades.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => elegirActividad(a)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
              >
                <span className="truncate">{a.nombre}</span>
                <span className="shrink-0 text-xs text-tenue">{ESCALAS[a.unidad].sufijo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Paso 3: cuanto y como. Con los presets, un solo toque basta. */}
      {actividad && (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-borde bg-superficie p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-tenue">Cuanto</span>
              <span className="text-2xl font-semibold tabular-nums">
                {cantidad} <span className="text-base text-tenue">{escala.sufijo}</span>
              </span>
            </div>
            <input
              type="range"
              min={escala.min}
              max={escala.max}
              step={escala.paso}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-borde accent-interior"
            />
            <div className="mt-3 flex gap-2">
              {escala.presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCantidad(p)}
                  className={`flex-1 rounded-lg border py-2 text-sm tabular-nums transition-colors ${
                    cantidad === p
                      ? 'border-interior bg-interior/10 text-interior'
                      : 'border-borde text-tenue'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-borde bg-superficie p-4">
            <span className="text-sm text-tenue">Como ha ido</span>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {INTENSIDADES.map((i) => (
                <button
                  key={i.clave}
                  type="button"
                  onClick={() => setIntensidad(i.clave)}
                  className={`rounded-lg border py-3 text-sm transition-colors ${
                    intensidad === i.clave
                      ? 'border-interior bg-interior/10 text-interior'
                      : 'border-borde text-tenue'
                  }`}
                >
                  <span className="block font-medium">{i.etiqueta}</span>
                  <span className="block text-xs opacity-70">{i.pista}</span>
                </button>
              ))}
            </div>
          </section>

          {resultado && !resultado.ok && (
            <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {resultado.error}
            </p>
          )}

          <button
            type="button"
            onClick={confirmar}
            disabled={enviando}
            className="fixed inset-x-0 bottom-6 z-10 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-center gap-2 rounded-full bg-interior py-4 font-semibold text-fondo shadow-lg shadow-black/40 disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            <Check className="size-5" strokeWidth={2.5} />
            {enviando ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      )}

      <Celebracion resultado={resultado} />
    </div>
  );
}

/**
 * El momento de recompensa. Es lo unico que se anima en toda la app: la
 * navegacion no se anima, la XP si.
 */
function Celebracion({ resultado }: { resultado: ResultadoRegistro | null }) {
  const visible = Boolean(resultado?.ok);
  const datos = resultado?.ok ? resultado : null;

  return (
    <AnimatePresence>
      {visible && datos && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-fondo/95 px-6 text-center"
        >
          <div>
            <motion.p
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              className="text-6xl font-bold tabular-nums text-interior"
            >
              +{formatearXp(datos.xpDelRegistro)}
            </motion.p>
            <p className="mt-2 text-tenue">XP · {datos.actividad}</p>

            {datos.xpExtraRetroactivo > 0 && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-3 text-sm text-tenue"
              >
                +{formatearXp(datos.xpExtraRetroactivo)} XP extra en lo de antes por sinergia
              </motion.p>
            )}

            {datos.minutosNoComputados > 0 && (
              <p className="mt-3 text-sm text-amber-400/80">
                {datos.minutosNoComputados} min fuera del tope diario de la categoria
              </p>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {Object.entries(datos.modificadores).map(([nombre, valor]) => (
                <motion.span
                  key={nombre}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-full border border-borde bg-superficie px-2.5 py-1 text-xs text-tenue"
                >
                  {nombre} x{valor}
                </motion.span>
              ))}
            </div>

            {datos.subioNivel && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 16 }}
                className="mt-8 rounded-2xl border border-interior/40 bg-interior/10 px-6 py-5"
              >
                <p className="text-sm uppercase tracking-widest text-interior">Subes de nivel</p>
                <p className="mt-1 text-4xl font-bold tabular-nums">
                  Nivel {datos.global.nivelDespues}
                </p>
              </motion.div>
            )}

            {datos.categoria.nivelDespues > datos.categoria.nivelAntes && (
              <p className="mt-4 text-sm text-tenue">
                {datos.categoria.nombre} sube a nivel {datos.categoria.nivelDespues}: tienes un
                punto de habilidad nuevo.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
