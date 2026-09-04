import Link from 'next/link';
import { Flame, Plus } from 'lucide-react';
import { BarraProgreso } from '@/components/juego/BarraProgreso';
import { resumenHome, ultimosRegistros } from '@/lib/db/consultas';
import { fraseDeContexto } from '@/lib/domain/perfil';
import { acentoDe, formatearXp, iconoDe } from '@/lib/ui/esferas';

// Los datos cambian con cada registro: nada de prerender.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [resumen, ultimos] = await Promise.all([resumenHome(), ultimosRegistros(4)]);
  const { global, racha } = resumen;

  return (
    <>
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-6">
        {/* 1. Identidad */}
        <header className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-full border border-borde bg-superficie text-lg font-semibold">
            {resumen.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-tenue">
              Sin clase todavia · nivel <span className="text-texto">{global.nivel}</span>
            </p>
            <h1 className="truncate text-xl font-semibold">{resumen.nombre}</h1>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 py-1.5"
            title={
              racha.enRiesgo
                ? 'Registra algo hoy para no perder la racha'
                : `Maximo historico: ${racha.diasMaximos} dias`
            }
          >
            <Flame
              className="size-4"
              style={{ color: racha.diasActuales > 0 ? '#fb923c' : '#4b5a6b' }}
            />
            <span className="text-sm font-semibold tabular-nums">{racha.diasActuales}</span>
          </div>
        </header>

        {/* 2. Progreso al siguiente nivel. Va aqui arriba porque estar cerca
            de completar es el disparador de accion mas potente del sistema. */}
        <section className="mt-6 rounded-2xl border border-borde bg-superficie p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-tenue">Nivel {global.nivel}</span>
            <span className="text-sm tabular-nums text-tenue">
              {formatearXp(global.xpEnNivel)} / {formatearXp(global.xpParaSiguienteNivel)} XP
            </span>
          </div>
          <div className="mt-3">
            <BarraProgreso progreso={global.progreso} acento="#2dd4bf" alto="gruesa" />
          </div>
          <p className="mt-3 text-sm text-tenue">
            {global.xpTotal === 0
              ? 'Todavia no has registrado nada. La primera vez de cada actividad da el doble.'
              : fraseDeContexto(global)}
          </p>
        </section>

        {/* 3. Categorias: el desequilibrio tiene que verse de un vistazo. */}
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-tenue">Categorias</h2>
          <ul className="grid grid-cols-2 gap-2.5">
            {resumen.categorias.map((cat) => {
              const Icono = iconoDe(cat.icono);
              const acento = acentoDe(cat.esfera);
              return (
                <li
                  key={cat.key}
                  className={`rounded-xl border border-borde bg-superficie p-3 ${
                    cat.activa ? '' : 'opacity-45'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icono className="size-4 shrink-0" style={{ color: acento }} />
                    <span className="truncate text-sm font-medium">{cat.nombre}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-semibold tabular-nums">Nv {cat.nivel}</span>
                    <span className="text-xs tabular-nums text-tenue">
                      {formatearXp(cat.xp)} XP
                    </span>
                  </div>
                  <div className="mt-2">
                    <BarraProgreso progreso={cat.progreso} acento={acento} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-tenue">
            Las categorias atenuadas aun no tienen actividades: llegan en fases posteriores.
          </p>
        </section>

        {/* 4. Ultimos registros. El tablero de misiones entra en la fase 3. */}
        {ultimos.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-medium text-tenue">Ultimo registrado</h2>
            <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
              {ultimos.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: acentoDe(r.esfera) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{r.actividad}</p>
                    <p className="text-xs text-tenue">
                      {r.categoria} · {Math.round(r.duracionMin)} min
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    +{formatearXp(r.xp)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* 5. Registro rapido, siempre a un pulgar de distancia. */}
      <Link
        href="/registrar"
        className="fixed inset-x-0 bottom-6 z-10 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-center gap-2 rounded-full bg-interior py-4 font-semibold text-fondo shadow-lg shadow-black/40 active:scale-[0.98] transition-transform"
      >
        <Plus className="size-5" strokeWidth={2.5} />
        Registrar actividad
      </Link>
    </>
  );
}
