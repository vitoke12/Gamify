import { acentoDe } from '@/lib/ui/esferas';

export type DatosAvatar = {
  nivelGlobal: number;
  /** Reparto 0..1 por categoría, en el orden en que se quieren pintar. */
  segmentos: { key: string; esfera: string; cuota: number; nivel: number }[];
  esferaDominante: string;
  tipoClase: 'pura' | 'hibrida' | 'polimata' | null;
};

/**
 * El avatar no es un dibujo elegido: se construye con los stats reales.
 *
 *   · el anillo exterior tiene un arco por categoría, de longitud igual a su
 *     cuota de esfuerzo, así que la forma ES tu desequilibrio
 *   · el núcleo crece con el nivel global
 *   · los rayos salen de las categorías que pasan de nivel 3
 *   · el color lo pone la esfera dominante
 *
 * Dos personas con el mismo nivel y distinto reparto no se parecen en nada,
 * que es justo lo que tiene que pasar.
 */
export function Avatar({ datos, tamano = 96 }: { datos: DatosAvatar; tamano?: number }) {
  const centro = 50;
  const radioAnillo = 42;
  const acento = acentoDe(datos.esferaDominante);

  // Núcleo entre 8 y 22 de radio: crece rápido al principio y se frena.
  const radioNucleo = 8 + Math.min(14, Math.sqrt(Math.max(0, datos.nivelGlobal - 1)) * 3.2);

  // Los arcos se encadenan uno detras de otro empezando arriba del todo.
  const arcos: { key: string; esfera: string; nivel: number; desde: number; barrido: number }[] =
    [];
  let angulo = -90;
  for (const s of datos.segmentos) {
    if (s.cuota <= 0) continue;
    const barrido = s.cuota * 360;
    arcos.push({ key: s.key, esfera: s.esfera, nivel: s.nivel, desde: angulo, barrido });
    angulo += barrido;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={tamano}
      height={tamano}
      role="img"
      aria-label={`Avatar de nivel ${datos.nivelGlobal}`}
    >
      {/* Anillo de fondo: siempre visible, para que se note lo que falta */}
      <circle cx={centro} cy={centro} r={radioAnillo} fill="none" stroke="#22303f" strokeWidth={6} />

      {arcos.map((a) => (
        <path
          key={a.key}
          d={arco(centro, centro, radioAnillo, a.desde, a.desde + a.barrido)}
          fill="none"
          stroke={acentoDe(a.esfera)}
          strokeWidth={6}
          strokeLinecap="butt"
          opacity={0.9}
        />
      ))}

      {/* Rayos de las categorías que ya son algo serio */}
      {arcos
        .filter((a) => a.nivel >= 3)
        .map((a) => {
          const medio = ((a.desde + a.barrido / 2) * Math.PI) / 180;
          return (
            <line
              key={`rayo-${a.key}`}
              x1={centro + Math.cos(medio) * (radioNucleo + 3)}
              y1={centro + Math.sin(medio) * (radioNucleo + 3)}
              x2={centro + Math.cos(medio) * (radioAnillo - 6)}
              y2={centro + Math.sin(medio) * (radioAnillo - 6)}
              stroke={acentoDe(a.esfera)}
              strokeWidth={1.5}
              opacity={0.45}
            />
          );
        })}

      {/* Núcleo: la forma depende de en qué te has convertido */}
      {datos.tipoClase === 'pura' ? (
        <polygon
          points={rombo(centro, centro, radioNucleo)}
          fill={acento}
          opacity={0.9}
        />
      ) : datos.tipoClase === 'hibrida' ? (
        <>
          <circle cx={centro - radioNucleo * 0.35} cy={centro} r={radioNucleo * 0.8} fill={acento} opacity={0.75} />
          <circle cx={centro + radioNucleo * 0.35} cy={centro} r={radioNucleo * 0.8} fill={acento} opacity={0.55} />
        </>
      ) : (
        <circle cx={centro} cy={centro} r={radioNucleo} fill={acento} opacity={datos.tipoClase ? 0.85 : 0.35} />
      )}

      <text
        x={centro}
        y={centro + 4.5}
        textAnchor="middle"
        fontSize={radioNucleo > 14 ? 13 : 11}
        fontWeight={700}
        fill="#0a0e14"
      >
        {datos.nivelGlobal}
      </text>
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, grados: number) {
  const rad = (grados * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arco(cx: number, cy: number, r: number, desde: number, hasta: number): string {
  // Un arco de 360 grados exactos degenera en un punto: se recorta un pelo.
  const fin = hasta - desde >= 359.9 ? desde + 359.9 : hasta;
  const a = polar(cx, cy, r, desde);
  const b = polar(cx, cy, r, fin);
  const grande = fin - desde > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${grande} 1 ${b.x} ${b.y}`;
}

function rombo(cx: number, cy: number, r: number): string {
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
}
