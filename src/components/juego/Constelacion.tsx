'use client';

import type { NodoVista, RamaVista } from '@/lib/db/arbol';

/**
 * El árbol como constelación, a lo Skyrim: las habilidades son estrellas en
 * un cielo, unidas por las líneas de sus requisitos. Los tiers son las
 * alturas, así que la forma de la rama se lee de un vistazo y el cuello de
 * botella (Navegación) se ve literalmente como un punto por el que pasa todo.
 *
 * Los cuatro estados se distinguen sin leer una palabra:
 *   dominado    estrella llena, verde, con halo
 *   en progreso estrella con anillo de acento que se va cerrando
 *   disponible  estrella hueca de acento, con su chispa
 *   bloqueado   punto apagado, línea de puntos, pero SIEMPRE visible
 */

const ANCHO = 320;
const ALTO_TIER = 74;
const MARGEN_SUPERIOR = 34;

/** Polvo de estrellas de fondo. Fijo a propósito: si fuese aleatorio en cada
 *  render, el servidor y el cliente pintarían cielos distintos. */
const POLVO = [
  [18, 22], [46, 58], [88, 30], [130, 96], [172, 40], [214, 78], [258, 26],
  [296, 64], [34, 128], [76, 168], [118, 210], [160, 140], [202, 186], [244, 232],
  [286, 152], [22, 254], [64, 296], [148, 268], [190, 312], [232, 288], [274, 340],
  [106, 352], [58, 380], [252, 404], [166, 420], [300, 224],
] as const;

type Posicion = { nodo: NodoVista; x: number; y: number };

export function Constelacion({
  rama,
  acento,
  seleccionado,
  onSeleccionar,
}: {
  rama: RamaVista;
  acento: string;
  seleccionado: string | null;
  onSeleccionar: (id: string) => void;
}) {
  const tiers = [...new Set(rama.nodos.map((n) => n.tier))].sort((a, b) => a - b);
  const alto = MARGEN_SUPERIOR * 2 + (tiers.length - 1) * ALTO_TIER;

  const posiciones: Posicion[] = [];
  for (const [fila, tier] of tiers.entries()) {
    const enTier = rama.nodos.filter((n) => n.tier === tier);
    for (const [i, nodo] of enTier.entries()) {
      posiciones.push({
        nodo,
        x: ((i + 1) / (enTier.length + 1)) * ANCHO,
        y: MARGEN_SUPERIOR + fila * ALTO_TIER,
      });
    }
  }
  const porId = new Map(posiciones.map((p) => [p.nodo.id, p]));

  // Las aristas son los requisitos de verdad, no una suposición por tiers:
  // conectar todo con todo entre tiers pintaría precedencias que no existen.
  const aristas: { origen: { x: number; y: number }; destino: Posicion; viva: boolean }[] = [];

  // Hay requisitos que viven en OTRA rama: los nodos de maestría exigen
  // amplitud, no profundidad. Se pintan como puertas de entrada en el borde
  // superior. Sin esto la maestría salía flotando y sin una sola línea, como
  // si no dependiera de nada.
  const puertas: { x: number; y: number; nombre: string; cumplido: boolean }[] = [];

  for (const destino of posiciones) {
    const fuera = destino.nodo.requiere.filter((r) => !porId.has(r.id));
    for (const r of destino.nodo.requiere) {
      const origen = porId.get(r.id);
      if (!origen) continue;
      aristas.push({
        origen,
        destino,
        // Una arista "viva" es la que ya has recorrido: su origen esta abierto.
        viva: origen.nodo.estado !== 'bloqueado' && origen.nodo.estado !== 'disponible',
      });
    }
    for (const [i, r] of fuera.entries()) {
      const puerta = {
        x: ((i + 1) / (fuera.length + 1)) * ANCHO,
        y: Math.max(12, destino.y - ALTO_TIER * 0.6),
        nombre: r.nombre,
        cumplido: r.cumplido,
      };
      puertas.push(puerta);
      aristas.push({ origen: puerta, destino, viva: r.cumplido });
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-borde bg-[#070b11]">
      <svg viewBox={`0 0 ${ANCHO} ${alto}`} width="100%" role="img" aria-label={`Rama ${rama.nombre}`}>
        <defs>
          <radialGradient id="cielo" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#101a26" />
            <stop offset="100%" stopColor="#070b11" />
          </radialGradient>
          <filter id="brillo" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="3" result="borroso" />
            <feMerge>
              <feMergeNode in="borroso" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={ANCHO} height={alto} fill="url(#cielo)" />
        {POLVO.filter(([, y]) => y < alto).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 0.9 : 0.6} fill="#8b9cb0" opacity={0.28} />
        ))}

        {aristas.map((a, i) => (
          <line
            key={i}
            x1={a.origen.x}
            y1={a.origen.y}
            x2={a.destino.x}
            y2={a.destino.y}
            stroke={a.viva ? acento : '#2a3a4d'}
            strokeWidth={a.viva ? 1.3 : 1}
            strokeDasharray={a.viva ? undefined : '3 4'}
            opacity={a.viva ? 0.5 : 0.55}
          />
        ))}

        {/* Puertas: lo que hace falta y vive en otra rama de esta categoría */}
        {puertas.map((p, i) => (
          <g key={`puerta-${i}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={3}
              fill="none"
              stroke={p.cumplido ? acento : '#3c4a5a'}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <text
              x={p.x}
              y={p.y - 7}
              textAnchor="middle"
              fontSize={8}
              fill={p.cumplido ? '#8b9cb0' : '#6b7c8f'}
            >
              {recortar(p.nombre)}
            </text>
          </g>
        ))}

        {posiciones.map(({ nodo, x, y }) => (
          <Estrella
            key={nodo.id}
            nodo={nodo}
            x={x}
            y={y}
            acento={acento}
            seleccionado={seleccionado === nodo.id}
            onSeleccionar={onSeleccionar}
          />
        ))}
      </svg>
    </div>
  );
}

function Estrella({
  nodo,
  x,
  y,
  acento,
  seleccionado,
  onSeleccionar,
}: {
  nodo: NodoVista;
  x: number;
  y: number;
  acento: string;
  seleccionado: boolean;
  onSeleccionar: (id: string) => void;
}) {
  const maestria = nodo.esMaestria;
  const color =
    nodo.estado === 'dominado'
      ? '#34d399'
      : maestria
        ? '#fbbf24'
        : nodo.estado === 'bloqueado'
          ? '#3c4a5a'
          : acento;

  const radio =
    nodo.estado === 'dominado' ? 6.5 : maestria ? 7 : nodo.estado === 'bloqueado' ? 4 : 5.5;
  const encendida = nodo.estado !== 'bloqueado';

  // Anillo de progreso del nivel, solo cuando hay algo que mostrar.
  const r = radio + 4;
  const circunferencia = 2 * Math.PI * r;

  return (
    <g
      onClick={() => onSeleccionar(nodo.id)}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      aria-label={`${nodo.nombre}, ${nodo.estado}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSeleccionar(nodo.id);
      }}
    >
      {/* Area de toque generosa: el dedo es mas gordo que la estrella */}
      <circle cx={x} cy={y} r={22} fill="transparent" />

      {seleccionado && (
        <circle cx={x} cy={y} r={radio + 9} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />
      )}

      {nodo.estado === 'en-progreso' && (
        <circle
          cx={x}
          cy={y}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeDasharray={`${circunferencia * nodo.progreso} ${circunferencia}`}
          transform={`rotate(-90 ${x} ${y})`}
          opacity={0.85}
        />
      )}

      <circle
        cx={x}
        cy={y}
        r={radio}
        fill={encendida ? color : 'none'}
        fillOpacity={nodo.estado === 'disponible' ? 0.15 : 0.9}
        stroke={color}
        strokeWidth={nodo.estado === 'bloqueado' ? 1 : 1.5}
        strokeDasharray={nodo.estado === 'bloqueado' ? '2 2' : undefined}
        filter={encendida ? 'url(#brillo)' : undefined}
      />

      {nodo.estado === 'dominado' && (
        <path
          d={`M ${x - 2.6} ${y} l 1.9 2.1 l 3.4 -4`}
          fill="none"
          stroke="#07110c"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      <text
        x={x}
        y={y + radio + 13}
        textAnchor="middle"
        fontSize={9}
        fill={encendida ? '#c7d3e0' : '#6b7c8f'}
      >
        {recortar(nodo.nombre)}
      </text>

      {nodo.estado === 'disponible' && !maestria && (
        <text x={x} y={y + radio + 23} textAnchor="middle" fontSize={8} fill={acento}>
          {nodo.costePuntos} pts
        </text>
      )}
    </g>
  );
}

function recortar(nombre: string): string {
  const limpio = nombre.replace('Maestría · ', '');
  return limpio.length > 14 ? `${limpio.slice(0, 13)}…` : limpio;
}
