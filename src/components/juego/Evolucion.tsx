'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FilaComparativa, PuntoLinea } from '@/lib/db/evolucion';
import { GRAFICA, formatearXp, graficaDe } from '@/lib/ui/esferas';

type Reparto = { key: string; nombre: string; esfera: string; minutos: number };

const VENTANAS = [3, 6, 12] as const;

export function Evolucion({
  comparativas,
  linea,
  reparto,
}: {
  comparativas: Record<number, FilaComparativa[]>;
  linea: PuntoLinea[];
  reparto: Reparto[];
}) {
  const [meses, setMeses] = useState<number>(3);
  const filas = comparativas[meses] ?? [];
  const hayPasado = filas.some((f) => f.nivelAntes > 1);

  const datosRadar = filas.map((f) => ({
    categoria: f.nombre,
    ahora: f.nivelAhora,
    antes: f.nivelAntes,
  }));

  const datosLinea = linea.map((p) => ({
    dia: p.dia.slice(5).replace('-', '/'),
    xp: p.xp,
  }));

  return (
    <div className="space-y-8">
      {/* Filtros en una fila sobre las graficas */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-tenue">Tú contra ti mismo</h2>
          <div className="flex gap-1.5">
            {VENTANAS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMeses(v)}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  meses === v ? 'border-interior text-interior' : 'border-borde text-tenue'
                }`}
              >
                {v} meses
              </button>
            ))}
          </div>
        </div>

        {!hayPasado && (
          <p className="mb-3 rounded-lg border border-borde bg-superficie px-4 py-2.5 text-xs text-tenue">
            Todavía no hay tanto historial: la línea de hace {meses} meses sale plana porque
            entonces no habías registrado nada.
          </p>
        )}

        <div className="rounded-2xl border border-borde bg-superficie p-3">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={datosRadar} outerRadius="72%">
              <PolarGrid stroke={GRAFICA.rejilla} />
              <PolarAngleAxis
                dataKey="categoria"
                tick={{ fill: GRAFICA.texto, fontSize: 10 }}
              />
              <PolarRadiusAxis
                tick={{ fill: GRAFICA.texto, fontSize: 9 }}
                stroke={GRAFICA.rejilla}
                allowDecimals={false}
              />
              <Radar
                name={`Hace ${meses} meses`}
                dataKey="antes"
                stroke={GRAFICA.antes}
                strokeWidth={2}
                fill={GRAFICA.antes}
                fillOpacity={0.12}
              />
              <Radar
                name="Ahora"
                dataKey="ahora"
                stroke={GRAFICA.ahora}
                strokeWidth={2}
                fill={GRAFICA.ahora}
                fillOpacity={0.22}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: GRAFICA.texto }}
                iconSize={8}
              />
              <Tooltip
                contentStyle={estiloTooltip}
                labelStyle={{ color: '#e6edf5' }}
                formatter={(valor, nombre) => [`nivel ${Number(valor)}`, String(nombre)]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* La tabla no es un extra: es la lectura exacta de lo que insinua el radar */}
        <div className="mt-3 overflow-hidden rounded-2xl border border-borde bg-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borde text-xs text-tenue">
                <th className="px-4 py-2.5 text-left font-medium">Categoría</th>
                <th className="px-3 py-2.5 text-right font-medium">Antes</th>
                <th className="px-3 py-2.5 text-right font-medium">Ahora</th>
                <th className="px-4 py-2.5 text-right font-medium">XP ganada</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const ganada = f.xpAhora - f.xpAntes;
                return (
                  <tr key={f.categoria} className="border-b border-borde/60 last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: graficaDe(f.esfera) }}
                        />
                        {f.nombre}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-tenue">
                      {f.nivelAntes}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{f.nivelAhora}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-tenue">
                      {ganada > 0 ? `+${formatearXp(ganada)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Linea de XP acumulada: una sola serie, sin leyenda */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-tenue">XP acumulada</h2>
        {datosLinea.length < 2 ? (
          <p className="rounded-2xl border border-borde bg-superficie px-4 py-6 text-center text-xs text-tenue">
            Con un solo día registrado no hay línea que dibujar todavía.
          </p>
        ) : (
          <div className="rounded-2xl border border-borde bg-superficie p-3">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={datosLinea} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={GRAFICA.rejilla} vertical={false} />
                <XAxis
                  dataKey="dia"
                  tick={{ fill: GRAFICA.texto, fontSize: 10 }}
                  stroke={GRAFICA.rejilla}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: GRAFICA.texto, fontSize: 10 }}
                  stroke={GRAFICA.rejilla}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={estiloTooltip}
                  labelStyle={{ color: '#e6edf5' }}
                  formatter={(valor) => [`${formatearXp(Number(valor))} XP`, 'Acumulado']}
                />
                <Line
                  type="monotone"
                  dataKey="xp"
                  stroke={GRAFICA.ahora}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#121922' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Reparto del tiempo: barras horizontales con el valor al final */}
      {reparto.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-tenue">
            En qué se ha ido el tiempo (30 días)
          </h2>
          <div className="rounded-2xl border border-borde bg-superficie p-3">
            <ResponsiveContainer width="100%" height={Math.max(120, reparto.length * 42)}>
              <BarChart
                data={reparto}
                layout="vertical"
                margin={{ top: 4, right: 44, bottom: 4, left: 0 }}
                barCategoryGap={8}
              >
                <CartesianGrid stroke={GRAFICA.rejilla} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  tick={{ fill: GRAFICA.texto, fontSize: 11 }}
                  stroke={GRAFICA.rejilla}
                  tickLine={false}
                  axisLine={false}
                  width={104}
                />
                <Tooltip
                  cursor={{ fill: '#ffffff08' }}
                  contentStyle={estiloTooltip}
                  labelStyle={{ color: '#e6edf5' }}
                  formatter={(valor) => [`${Number(valor)} min`, 'Tiempo']}
                />
                <Bar dataKey="minutos" radius={[0, 4, 4, 0]} label={etiquetaMinutos}>
                  {reparto.map((r) => (
                    <Cell key={r.key} fill={graficaDe(r.esfera)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

const estiloTooltip = {
  background: '#1a2331',
  border: '1px solid #22303f',
  borderRadius: 10,
  fontSize: 12,
} as const;

/** Valor al final de cada barra: en horizontal, el numero va fuera. */
function etiquetaMinutos(props: unknown) {
  const p = props as Record<string, unknown>;
  const x = Number(p.x ?? 0);
  const y = Number(p.y ?? 0);
  const ancho = Number(p.width ?? 0);
  const alto = Number(p.height ?? 0);
  return (
    <text
      x={x + ancho + 8}
      y={y + alto / 2 + 4}
      fill={GRAFICA.texto}
      fontSize={11}
      className="tabular-nums"
    >
      {String(p.value ?? '')} min
    </text>
  );
}
