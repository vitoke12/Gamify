import type { DefArbol } from './tipos';

export const ARBOL_SOCIAL: DefArbol = {
  categoria: 'social',
  ramas: [
    {
      key: 'cercanos',
      nombre: 'Relaciones cercanas',
      descripcion: 'Los pocos que de verdad importan.',
      orden: 1,
      nodos: [
        { key: 'soc-contacto', nombre: 'Mantener el contacto', descripcion: 'Escribir o llamar sin que haya un motivo.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'soc-escucha', nombre: 'Escuchar de verdad', descripcion: 'Sin preparar la respuesta mientras el otro habla.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['soc-contacto'] },
        { key: 'soc-conflicto', nombre: 'Conversación difícil', descripcion: 'Decir lo incómodo sin romper el vínculo.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['soc-escucha'] },
      ],
    },
    {
      key: 'publico',
      nombre: 'Hablar en público',
      orden: 2,
      nodos: [
        { key: 'soc-uno-a-uno', nombre: 'Uno a uno', descripcion: 'Explicar algo con claridad a una persona.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'soc-grupo', nombre: 'Ante un grupo', descripcion: 'Hablar delante de diez personas sin morirte.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['soc-uno-a-uno'] },
        { key: 'soc-escenario', nombre: 'Escenario', descripcion: 'Charla preparada ante gente que no conoces.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['soc-grupo'] },
      ],
    },
    {
      key: 'red',
      nombre: 'Red',
      orden: 3,
      nodos: [
        { key: 'soc-conocer', nombre: 'Conocer gente nueva', descripcion: 'Empezar una conversación con un desconocido.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'soc-cultivar', nombre: 'Cultivar la red', descripcion: 'Dar antes de necesitar.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['soc-conocer'] },
        {
          key: 'soc-maestria',
          nombre: 'Maestría · Social',
          descripcion: 'No se compra con puntos. Se demuestra.',
          tier: 4,
          maxLevel: 1,
          costePuntos: 0,
          requiere: ['soc-escenario', 'soc-conflicto'],
          esMaestria: true,
          retoDescripcion: 'Dar una charla ante más de treinta personas que no te conocen, con grabación o programa del evento.',
        },
      ],
    },
  ],
};
