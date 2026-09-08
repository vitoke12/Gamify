'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Gift, Sparkles } from 'lucide-react';
import { BarraProgreso } from '@/components/juego/BarraProgreso';
import { abrirCofrePendiente, elegirSecundaria } from '@/lib/actions/misiones';
import type { MisionVista } from '@/lib/db/misiones';
import { acentoDe, formatearXp } from '@/lib/ui/esferas';

export function TableroMisiones({
  tablero,
  semanal,
  cofres,
}: {
  tablero: MisionVista[];
  semanal: MisionVista | null;
  cofres: { id: string; otorgadoEn: Date }[];
}) {
  const [pendiente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);
  const [premio, setPremio] = useState<string | null>(null);

  const principal = tablero.find((m) => m.tipo === 'principal');
  const secundarias = tablero.filter((m) => m.tipo === 'secundaria');
  const ocio = tablero.find((m) => m.tipo === 'ocio');
  const sorpresa = tablero.find((m) => m.tipo === 'sorpresa');
  const elegidas = secundarias.filter((m) => m.estado !== 'ofrecida').length;

  function alternar(id: string) {
    iniciar(async () => {
      const r = await elegirSecundaria(id);
      setAviso(r.ok ? null : (r.error ?? null));
    });
  }

  function abrir(id: string) {
    iniciar(async () => {
      const r = await abrirCofrePendiente(id);
      if (r.ok) setPremio(r.descripcion);
      else setAviso(r.error);
    });
  }

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-medium text-tenue">Misiones de hoy</h2>

      {/* Cofre pendiente: lo primero que se ve, porque es lo que apetece */}
      {cofres.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={pendiente}
          onClick={() => abrir(c.id)}
          className="mb-3 flex w-full items-center gap-3 rounded-xl border border-amber-500/50 bg-amber-500/[0.08] px-4 py-3.5 text-left active:scale-[0.99] transition-transform"
        >
          <Gift className="size-5 shrink-0 text-amber-400" />
          <span className="flex-1 text-sm font-medium text-amber-200">
            Tienes un cofre sin abrir
          </span>
          <span className="text-xs text-amber-300/70">Abrir</span>
        </button>
      ))}

      {aviso && (
        <p className="mb-3 rounded-lg border border-amber-800/60 bg-amber-950/25 px-4 py-2.5 text-xs text-amber-200/85">
          {aviso}
        </p>
      )}

      {/* El jefe va primero: enmarca la semana entera y es lo que da cofre.
          Al final del tablero quedaba a un scroll de distancia. */}
      {semanal && (
        <div className="mb-4">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-xs font-medium text-amber-400">Jefe de la semana</p>
            <p className="text-xs text-tenue">
              {semanal.completada ? 'derrotado' : 'da cofre al completarlo'}
            </p>
          </div>
          <Tarjeta mision={semanal} jefe />
        </div>
      )}

      {principal && <Tarjeta mision={principal} destacada />}

      {secundarias.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-tenue">
            Elige dos de las tres · {elegidas}/2 elegidas
          </p>
          <div className="space-y-2">
            {secundarias.map((m) => (
              <Tarjeta
                key={m.id}
                mision={m}
                seleccionable
                pendiente={pendiente}
                onAlternar={() => alternar(m.id)}
              />
            ))}
          </div>
        </div>
      )}

      {ocio && <div className="mt-3">{<Tarjeta mision={ocio} />}</div>}
      {sorpresa && <div className="mt-3">{<Tarjeta mision={sorpresa} sorpresa />}</div>}

      <AnimatePresence>
        {premio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPremio(null)}
            className="fixed inset-0 z-50 grid place-items-center bg-fondo/95 px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              <Gift className="mx-auto size-14 text-amber-400" />
              <p className="mt-4 text-sm uppercase tracking-widest text-amber-400">Cofre</p>
              <p className="mt-2 text-2xl font-semibold">{premio}</p>
              <p className="mt-6 text-xs text-tenue">Toca para cerrar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Tarjeta({
  mision,
  destacada,
  sorpresa,
  jefe,
  seleccionable,
  pendiente,
  onAlternar,
}: {
  mision: MisionVista;
  destacada?: boolean;
  sorpresa?: boolean;
  jefe?: boolean;
  seleccionable?: boolean;
  pendiente?: boolean;
  onAlternar?: () => void;
}) {
  const acento = acentoDe(mision.esfera);
  const ofrecida = mision.estado === 'ofrecida';

  // La principal lleva borde de acento, la sorpresa ámbar, el resto neutro.
  const borde = mision.completada
    ? 'border-emerald-500/50 bg-emerald-500/[0.06]'
    : sorpresa || jefe
      ? 'border-amber-500/50 bg-amber-500/[0.06]'
      : 'border-borde bg-superficie';

  const contenido = (
    <>
      <div className="flex items-start gap-2.5">
        {mision.completada ? (
          <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" strokeWidth={3} />
        ) : sorpresa || jefe ? (
          <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-400" />
        ) : (
          <span
            className="mt-1.5 size-2 shrink-0 rounded-full"
            style={{ backgroundColor: ofrecida ? '#3c4a5a' : acento }}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${ofrecida ? 'text-tenue' : ''}`}>{mision.descripcion}</p>
          <p className="mt-1 text-xs text-tenue">
            {mision.categoria} · {mision.texto}
          </p>
        </div>
        <span
          className="shrink-0 text-sm font-semibold tabular-nums"
          style={{ color: mision.completada ? '#34d399' : undefined }}
        >
          +{formatearXp(mision.xp)}
        </span>
      </div>

      {!mision.completada && !ofrecida && mision.progreso.meta > 0 && (
        <div className="mt-2.5">
          <BarraProgreso
            progreso={mision.progreso.actual / mision.progreso.meta}
            acento={sorpresa || jefe ? '#fbbf24' : acento}
          />
        </div>
      )}
    </>
  );

  if (seleccionable) {
    return (
      <button
        type="button"
        disabled={pendiente || mision.completada}
        onClick={onAlternar}
        className={`w-full rounded-xl border p-3.5 text-left transition-colors ${borde} ${
          ofrecida ? 'opacity-70' : ''
        }`}
      >
        {contenido}
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl border p-3.5 ${borde}`}
      style={destacada && !mision.completada ? { borderColor: acento } : undefined}
    >
      {contenido}
    </div>
  );
}
