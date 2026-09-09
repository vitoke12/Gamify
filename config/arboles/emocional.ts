import type { DefArbol } from './tipos';

export const ARBOL_EMOCIONAL: DefArbol = {
  categoria: 'emocional',
  ramas: [
    {
      key: 'regulacion',
      nombre: 'Regulación',
      descripcion: 'Que la emoción no conduzca.',
      orden: 1,
      nodos: [
        { key: 'emo-nombrar', nombre: 'Nombrar lo que pasa', descripcion: 'Ponerle palabra exacta a lo que sientes.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'emo-pausa', nombre: 'La pausa', descripcion: 'Meter un hueco entre el estímulo y la reacción.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['emo-nombrar'] },
        { key: 'emo-reencuadre', nombre: 'Reencuadre', descripcion: 'Contarte el mismo hecho de otra forma útil.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['emo-pausa'] },
      ],
    },
    {
      key: 'autoconocimiento',
      nombre: 'Autoconocimiento',
      orden: 2,
      nodos: [
        { key: 'emo-diario', nombre: 'Diario', descripcion: 'Escribir lo que ha pasado por dentro.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'emo-patrones', nombre: 'Ver patrones', descripcion: 'Reconocer lo que se repite, no solo lo que duele.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['emo-diario'] },
        { key: 'emo-acompanado', nombre: 'Trabajo acompañado', descripcion: 'Terapia, mentoría, alguien que te devuelva el reflejo.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['emo-patrones'] },
      ],
    },
    {
      key: 'resiliencia',
      nombre: 'Resiliencia',
      orden: 3,
      nodos: [
        { key: 'emo-incomodidad', nombre: 'Tolerar la incomodidad', descripcion: 'Quedarse sin huir ni tapar.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'emo-recuperacion', nombre: 'Recuperarse rápido', descripcion: 'Volver al eje antes de que el día se pierda.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['emo-incomodidad'] },
        {
          key: 'emo-maestria',
          nombre: 'Maestría · Emocional',
          descripcion: 'No se compra con puntos. Se demuestra.',
          tier: 4,
          maxLevel: 1,
          costePuntos: 0,
          requiere: ['emo-reencuadre', 'emo-recuperacion'],
          esMaestria: true,
          retoDescripcion: 'Atravesar una situación que antes te habría hundido y poder contarla entera, con fecha, a alguien que estuvo delante.',
        },
      ],
    },
  ],
};
