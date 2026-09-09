import Link from 'next/link';
import { Download, Flame, Medal, Plus, Snowflake, Sparkles } from 'lucide-react';
import { Avatar } from '@/components/juego/Avatar';
import { BarraProgreso } from '@/components/juego/BarraProgreso';
import { ChequeoDeSentido } from '@/components/juego/ChequeoDeSentido';
import { Pwa } from '@/components/juego/Pwa';
import { TableroMisiones } from '@/components/juego/TableroMisiones';
import { resumenHome, ultimosRegistros } from '@/lib/db/consultas';
import { categoriasConArbol } from '@/lib/db/arbol';
import { sincronizarClase } from '@/lib/db/clases';
import { sincronizarLogros } from '@/lib/db/logros';
import { sincronizarMisiones } from '@/lib/db/misiones';
import { cofresSinAbrir } from '@/lib/db/recompensas';
import { congeladoresGlobales, sincronizarRachas } from '@/lib/db/rachas';
import { estadoDelChequeo } from '@/lib/db/sentido';
import { fraseDeContexto } from '@/lib/domain/perfil';
import { acentoDe, formatearXp, iconoDe } from '@/lib/ui/esferas';

// Los datos cambian con cada registro: nada de prerender.
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Antes de leer nada: poner las rachas al día. Es idempotente y no necesita
  // cron; los congeladores que se hayan gastado vuelven como avisos.
  // El orden importa: las rachas alimentan la categoria que manda en la
  // mision principal, y las misiones completadas alimentan los logros.
  const avisos = await sincronizarRachas();
  const misiones = await sincronizarMisiones();
  const logrosNuevos = await sincronizarLogros();
  const { clase, esNueva } = await sincronizarClase();

  const [resumen, ultimos, conArbol, congeladores, cofres, sentido] = await Promise.all([
    resumenHome(),
    ultimosRegistros(4),
    categoriasConArbol(),
    congeladoresGlobales(),
    cofresSinAbrir(),
    estadoDelChequeo(),
  ]);
  const { global, racha } = resumen;
  const keysConArbol = new Set(conArbol.map((c) => c.key));

  return (
    <>
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-6">
        {/* 1. Identidad */}
        <header className="flex items-center gap-3">
          <Link href="/evolucion" className="shrink-0" aria-label="Ver evolucion">
            <Avatar
              datos={{
                nivelGlobal: global.nivel,
                segmentos: resumen.categorias.map((c) => ({
                  key: c.key,
                  esfera: c.esfera,
                  cuota: clase?.distribucion[c.key] ?? 0,
                  nivel: c.nivel,
                })),
                esferaDominante:
                  resumen.categorias.find((c) => c.key === clase?.dominantes[0])?.esfera ??
                  'interior',
                tipoClase: clase?.tipo ?? null,
              }}
              tamano={52}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-tenue">
              {clase?.nombre ?? 'Sin clase todavia'} · nivel{' '}
              <span className="text-texto">{global.nivel}</span>
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

        {/* Un congelador gastado se avisa siempre: consumirlo en silencio seria
            quitarle al usuario justo la informacion que le importa. */}
        {avisos.length > 0 && (
          <div className="mt-4 rounded-xl border border-sky-800/60 bg-sky-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-sky-300">
              <Snowflake className="size-4 shrink-0" />
              <span className="font-medium">Racha salvada</span>
            </div>
            <p className="mt-1 text-xs text-sky-200/80">
              {avisos[0].diasPerdonados.length === 1
                ? 'Ayer no registraste nada y se ha usado un congelador.'
                : `Se han usado ${avisos[0].diasPerdonados.length} congeladores por los dias que faltaban.`}{' '}
              Te {avisos[0].congeladoresRestantes === 1 ? 'queda' : 'quedan'}{' '}
              {avisos[0].congeladoresRestantes} este mes.
            </p>
          </div>
        )}

        {esNueva && clase && (
          <Link
            href="/evolucion"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-interior/40 bg-interior/[0.07] px-4 py-3"
          >
            <Sparkles className="size-4 shrink-0 text-interior" />
            <span className="flex-1 text-sm">
              Empiezas un capitulo nuevo como{' '}
              <span className="font-semibold text-interior">{clase.nombre}</span>
            </span>
            <span className="text-xs text-tenue">Ver</span>
          </Link>
        )}

        {misiones.secretos.length > 0 && (
          <div className="mt-4 rounded-xl border border-purple-500/40 bg-purple-500/[0.08] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-purple-300">
              <Sparkles className="size-4 shrink-0" />
              <span className="font-medium">La sorpresa traia un secreto</span>
            </div>
            <p className="mt-1 text-xs text-purple-200/80">
              {misiones.secretos.join(', ')} · desbloqueado sin cumplir su condicion.
            </p>
          </div>
        )}

        {logrosNuevos.length > 0 && (
          <Link
            href="/logros"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-3"
          >
            <Medal className="size-4 shrink-0 text-amber-400" />
            <span className="flex-1 text-sm">
              {logrosNuevos.length === 1
                ? `Logro nuevo: ${logrosNuevos[0].nombre}`
                : `${logrosNuevos.length} logros nuevos`}
            </span>
            <span className="text-xs text-tenue">Ver</span>
          </Link>
        )}

        {racha.enRiesgo && avisos.length === 0 && (
          <p className="mt-4 rounded-xl border border-amber-800/60 bg-amber-950/25 px-4 py-3 text-xs text-amber-200/85">
            Hoy no has registrado nada todavia. Tu racha de {racha.diasActuales} dias aguanta
            hasta el final del dia; despues se gastaria un congelador
            {congeladores === 1 ? ' (te queda 1 este mes).' : ` (te quedan ${congeladores} este mes).`}
          </p>
        )}

        {/* La pregunta incomoda, una vez al mes. Va arriba a proposito:
            escondida al final no la contestaria nadie. */}
        <ChequeoDeSentido estado={sentido} />

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

        {/* Puntos sin gastar: la llamada a especializarse */}
        {resumen.puntosLibres > 0 && (
          <Link
            href="/arbol"
            className="mt-3 flex items-center gap-2.5 rounded-xl border border-interior/40 bg-interior/[0.07] px-4 py-3"
          >
            <Sparkles className="size-4 shrink-0 text-interior" />
            <span className="flex-1 text-sm">
              Tienes <span className="font-semibold text-interior">{resumen.puntosLibres}</span>{' '}
              {resumen.puntosLibres === 1 ? 'punto' : 'puntos'} de habilidad sin gastar
            </span>
            <span className="text-xs text-tenue">Abrir árbol</span>
          </Link>
        )}

        {/* 3. Categorias: el desequilibrio tiene que verse de un vistazo. */}
        <section className="mt-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-tenue">Categorias</h2>
            <div className="flex gap-3">
              <Link href="/arbol" className="text-xs text-tenue underline underline-offset-4">
                Árbol
              </Link>
              <Link href="/logros" className="text-xs text-tenue underline underline-offset-4">
                Logros
              </Link>
              <Link href="/evolucion" className="text-xs text-tenue underline underline-offset-4">
                Evolución
              </Link>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-2.5">
            {resumen.categorias.map((cat) => {
              const Icono = iconoDe(cat.icono);
              const acento = acentoDe(cat.esfera);
              const tarjeta = (
                <div
                  className={`h-full rounded-xl border border-borde bg-superficie p-3 ${
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
                </div>
              );

              return (
                <li key={cat.key}>
                  {keysConArbol.has(cat.key) ? (
                    <Link href={`/arbol/${cat.key}`}>{tarjeta}</Link>
                  ) : (
                    tarjeta
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-tenue">
            Las categorias atenuadas aun no tienen actividades: llegan en fases posteriores.
          </p>
        </section>

        {/* 4. Tablero de misiones */}
        <TableroMisiones tablero={misiones.tablero} semanal={misiones.semanal} cofres={cofres} />

        {/* 5. Ultimos registros */}
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

        <footer className="mt-8 border-t border-borde pt-4">
          <Pwa
            habilitado={process.env.NODE_ENV === 'production'}
            rachaEnRiesgo={racha.enRiesgo}
            diasDeRacha={racha.diasActuales}
          />
          <a
            href="/api/exportar"
            download
            className="mt-3 flex items-center gap-2.5 rounded-xl border border-borde bg-superficie px-4 py-3"
          >
            <Download className="size-4 shrink-0 text-tenue" />
            <span className="flex-1 text-xs text-tenue">
              Descargar todos mis datos en un archivo
            </span>
          </a>
          <p className="mt-3 text-center text-[11px] text-tenue">
            Tus datos viven en tu ordenador y salen de aqui cuando quieras.
          </p>
        </footer>
      </main>

      {/* 6. Registro rapido, siempre a un pulgar de distancia. */}
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
