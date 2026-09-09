'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, TriangleAlert } from 'lucide-react';
import { responderChequeo } from '@/lib/actions/sentido';
import type { EstadoSentido } from '@/lib/db/sentido';
import { acentoDe } from '@/lib/ui/esferas';

const OPCIONES = [
  { valor: 'si', etiqueta: 'Sí' },
  { valor: 'algo', etiqueta: 'Algo' },
  { valor: 'no', etiqueta: 'No' },
] as const;

/**
 * La pregunta incómoda, una vez al mes. No se puede posponer con un aspa:
 * o la contestas o sigue ahí, porque el día que dejas de hacértela la app se
 * convierte en una máquina de subir números.
 */
export function ChequeoDeSentido({ estado }: { estado: EstadoSentido }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [indice, setIndice] = useState(0);

  const pregunta = estado.preguntas[indice];

  function responder(valor: 'si' | 'algo' | 'no') {
    if (!pregunta) return;
    iniciar(async () => {
      await responderChequeo(pregunta.categoria, valor);
      if (indice + 1 < estado.preguntas.length) setIndice(indice + 1);
      else router.refresh();
    });
  }

  if (!pregunta && estado.alertas.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {pregunta && (
        <section className="rounded-xl border border-borde bg-superficie px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <HelpCircle className="size-4 shrink-0 text-tenue" />
            <span className="font-medium">Chequeo de sentido</span>
            {estado.preguntas.length > 1 && (
              <span className="ml-auto text-xs text-tenue">
                {indice + 1}/{estado.preguntas.length}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm">
            ¿Notas el progreso de{' '}
            <span style={{ color: acentoDe(pregunta.esfera) }}>{pregunta.nombre}</span>{' '}
            <span className="font-medium">fuera de la app</span>?
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {OPCIONES.map((o) => (
              <button
                key={o.valor}
                type="button"
                disabled={pendiente}
                onClick={() => responder(o.valor)}
                className="rounded-lg border border-borde py-2.5 text-sm text-tenue transition-colors disabled:opacity-50"
              >
                {o.etiqueta}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-tenue">
            Contesta con lo que sea verdad. Esta pregunta está aquí justo para poder decir que no.
          </p>
        </section>
      )}

      {estado.alertas.map((a) => (
        <section
          key={a.categoria}
          className="rounded-xl border border-amber-700/50 bg-amber-950/25 px-4 py-3.5"
        >
          <div className="flex items-center gap-2 text-sm text-amber-300">
            <TriangleAlert className="size-4 shrink-0" />
            <span className="font-medium">{a.nombre} no se está notando fuera</span>
          </div>
          <p className="mt-1.5 text-xs text-amber-200/80">{a.mensaje}</p>
        </section>
      ))}
    </div>
  );
}
