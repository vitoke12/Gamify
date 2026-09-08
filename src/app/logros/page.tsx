import Link from 'next/link';
import { ChevronLeft, Lock, Medal } from 'lucide-react';
import { coleccionDeLogros } from '@/lib/db/logros';
import { premios } from '@/lib/db/recompensas';

export const dynamic = 'force-dynamic';

export default async function PaginaLogros() {
  const [logros, coleccion] = await Promise.all([coleccionDeLogros(), premios()]);
  const conseguidos = logros.filter((l) => l.desbloqueado).length;

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
        <h1 className="flex-1 text-lg font-semibold">Logros</h1>
        <span className="text-sm tabular-nums text-tenue">
          {conseguidos}/{logros.length}
        </span>
      </header>

      <ul className="mt-6 grid grid-cols-2 gap-2.5">
        {logros.map((l) => (
          <li
            key={l.key}
            className={`rounded-xl border p-3.5 ${
              l.desbloqueado
                ? 'border-borde bg-superficie'
                : 'border-dashed border-borde bg-superficie/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {l.desbloqueado ? (
                <Medal className="size-4 shrink-0 text-amber-400" />
              ) : (
                <Lock className="size-3.5 shrink-0 text-tenue" />
              )}
              <span
                className={`truncate text-sm font-medium ${l.desbloqueado ? '' : 'text-tenue'}`}
              >
                {l.nombre}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-tenue">{l.descripcion}</p>
            {l.desbloqueadoEn && (
              <p className="mt-2 text-[11px] text-tenue/70">
                {l.desbloqueadoEn.toLocaleDateString('es-ES')}
              </p>
            )}
          </li>
        ))}
      </ul>

      {coleccion.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-tenue">Salido de los cofres</h2>
          <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
            {coleccion.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.descripcion}</p>
                  <p className="text-xs text-tenue">
                    {p.otorgadoEn.toLocaleDateString('es-ES')}
                    {p.expiraEn && !p.vigente ? ' · caducado' : ''}
                  </p>
                </div>
                {p.expiraEn && p.vigente && (
                  <span className="shrink-0 rounded-full border border-amber-500/40 px-2 py-0.5 text-[11px] text-amber-300">
                    activo
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-xs text-tenue">
        Los secretos no cuentan de qué van hasta que caen. Si te los dijeran antes, serían una
        lista de tareas más.
      </p>
    </div>
  );
}
