import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Avatar } from '@/components/juego/Avatar';
import { Evolucion } from '@/components/juego/Evolucion';
import { sincronizarClase } from '@/lib/db/clases';
import { comparativa, lineaDeXp, repartoDeTiempo } from '@/lib/db/evolucion';
import { resumenHome } from '@/lib/db/consultas';

export const dynamic = 'force-dynamic';

export default async function PaginaEvolucion() {
  const [{ clase, historia }, tres, seis, doce, linea, reparto, resumen] = await Promise.all([
    sincronizarClase(),
    comparativa(3),
    comparativa(6),
    comparativa(12),
    lineaDeXp(),
    repartoDeTiempo(30),
    resumenHome(),
  ]);

  const segmentos = resumen.categorias.map((c) => ({
    key: c.key,
    esfera: c.esfera,
    cuota: clase?.distribucion[c.key] ?? 0,
    nivel: c.nivel,
  }));
  const esferaDominante =
    resumen.categorias.find((c) => c.key === clase?.dominantes[0])?.esfera ?? 'interior';

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-borde bg-superficie"
          aria-label="Volver"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold">Evolución</h1>
      </header>

      {/* Identidad: el avatar sale de los stats, no se elige */}
      <section className="mt-6 flex items-center gap-4 rounded-2xl border border-borde bg-superficie p-4">
        <Avatar
          datos={{
            nivelGlobal: resumen.global.nivel,
            segmentos,
            esferaDominante,
            tipoClase: clase?.tipo ?? null,
          }}
          tamano={92}
        />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-tenue">Clase actual</p>
          <p className="mt-0.5 text-xl font-semibold">{clase?.nombre ?? 'Sin clase todavía'}</p>
          <p className="mt-1 text-xs text-tenue">
            {clase?.descripcion ?? 'Registra un poco más y la clase saldrá sola.'}
          </p>
        </div>
      </section>

      <p className="mt-3 text-xs text-tenue">
        La clase no se elige: sale de dónde has puesto el esfuerzo. El avatar tampoco: cada
        arco del anillo es una categoría, y su tamaño es su parte del reparto.
      </p>

      {historia.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-tenue">Capítulos</h2>
          <ol className="space-y-2">
            {[...historia].reverse().map((c) => (
              <li
                key={c.mes}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  c.esCambio ? 'border-interior/40 bg-interior/[0.05]' : 'border-borde bg-superficie'
                }`}
              >
                <span className="w-16 shrink-0 text-xs tabular-nums text-tenue">{c.mes}</span>
                <span className="flex-1 text-sm font-medium">{c.nombre}</span>
                {c.esCambio && (
                  <span className="shrink-0 text-[11px] text-interior">nueva etapa</span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-tenue">
            Ver que fuiste una cosa y ahora eres otra cuenta una historia que ninguna barra de
            progreso cuenta.
          </p>
        </section>
      )}

      <div className="mt-8">
        <Evolucion comparativas={{ 3: tres, 6: seis, 12: doce }} linea={linea} reparto={reparto} />
      </div>
    </div>
  );
}
