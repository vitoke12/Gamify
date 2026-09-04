import type { DefArbol } from './tipos';

export const ARBOL_FISICO: DefArbol = {
  categoria: 'fisico',
  ramas: [
    {
      key: 'kitesurf',
      nombre: 'Kitesurf',
      descripcion: 'Deporte específico. Progresión real de la disciplina.',
      orden: 1,
      nodos: [
        { key: 'kite-seguridad', nombre: 'Seguridad', descripcion: 'Sistemas de seguridad, viento, ventana de vuelo.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'kite-montaje', nombre: 'Montaje', descripcion: 'Armado de cometa, líneas y barra sin ayuda.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'kite-bodydrag', nombre: 'Bodydrag', descripcion: 'Arrastre con y sin tabla, recuperación.', tier: 2, maxLevel: 3, costePuntos: 2, requiere: ['kite-seguridad', 'kite-montaje'] },
        { key: 'kite-waterstart', nombre: 'Waterstart', descripcion: 'Salida del agua sobre la tabla de forma consistente.', tier: 2, maxLevel: 3, costePuntos: 2, requiere: ['kite-seguridad', 'kite-montaje'] },
        // Cuello de botella único: todo lo de arriba pasa por aquí.
        { key: 'kite-navegacion', nombre: 'Navegación', descripcion: 'Ceñida, control de rumbo, ganar barlovento.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['kite-bodydrag', 'kite-waterstart'] },
        { key: 'kite-freestyle', nombre: 'Freestyle', descripcion: 'Saltos, rotaciones, trucos con y sin desenganche.', tier: 4, maxLevel: 5, costePuntos: 4, requiere: ['kite-navegacion'] },
        { key: 'kite-olas', nombre: 'Olas y viajes', descripcion: 'Navegación en olas y en spots desconocidos.', tier: 4, maxLevel: 5, costePuntos: 4, requiere: ['kite-navegacion'] },
        {
          key: 'kite-maestria',
          nombre: 'Maestría · Kitesurf',
          descripcion: 'No se compra con puntos. Se demuestra.',
          tier: 5,
          maxLevel: 1,
          costePuntos: 0,
          requiere: ['kite-freestyle', 'kite-olas'],
          esMaestria: true,
          retoDescripcion: 'Sesión completa en un spot nuevo con viento de +20 nudos: navegación en olas y un salto limpio grabado en vídeo.',
        },
      ],
    },
    {
      key: 'fuerza',
      nombre: 'Fuerza',
      orden: 2,
      nodos: [
        { key: 'fue-tecnica', nombre: 'Técnica básica', descripcion: 'Patrones de sentadilla, bisagra, empuje y tracción.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'fue-progresion', nombre: 'Progresión de cargas', descripcion: 'Sobrecarga progresiva planificada.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['fue-tecnica'] },
        { key: 'fue-calistenia', nombre: 'Calistenia', descripcion: 'Dominadas, fondos, control del propio peso.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['fue-tecnica'] },
        { key: 'fue-fuerza-maxima', nombre: 'Fuerza máxima', descripcion: 'Trabajo en rangos de 1-5 repeticiones.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['fue-progresion'] },
      ],
    },
    {
      key: 'resistencia',
      nombre: 'Resistencia',
      orden: 3,
      nodos: [
        { key: 'res-base-aerobica', nombre: 'Base aeróbica', descripcion: 'Volumen a intensidad conversacional.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'res-umbral', nombre: 'Umbral', descripcion: 'Series en umbral y tempo sostenido.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['res-base-aerobica'] },
        { key: 'res-larga-distancia', nombre: 'Larga distancia', descripcion: 'Sesiones de más de 90 minutos.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['res-umbral'] },
      ],
    },
    {
      key: 'movilidad',
      nombre: 'Movilidad',
      orden: 4,
      nodos: [
        { key: 'mov-rutina', nombre: 'Rutina diaria', descripcion: 'Diez minutos de movilidad articular.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'mov-rangos', nombre: 'Rangos de fuerza', descripcion: 'Fuerza en rangos finales, no solo estiramiento pasivo.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['mov-rutina'] },
      ],
    },
  ],
};
