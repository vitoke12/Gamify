import type { DefArbol } from './tipos';

export const ARBOL_HABITOS: DefArbol = {
  categoria: 'habitos',
  ramas: [
    {
      key: 'sueno',
      nombre: 'Sueño',
      orden: 1,
      nodos: [
        { key: 'sue-horario', nombre: 'Horario estable', descripcion: 'Acostarse y levantarse a la misma hora.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'sue-higiene', nombre: 'Higiene del sueño', descripcion: 'Sin pantallas ni cafeína en la ventana previa.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['sue-horario'] },
      ],
    },
    {
      key: 'alimentacion',
      nombre: 'Alimentación',
      orden: 2,
      nodos: [
        { key: 'ali-registro', nombre: 'Registro consciente', descripcion: 'Anotar lo que comes sin juzgarlo.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'ali-cocina', nombre: 'Cocinar en casa', descripcion: 'Preparar tu propia comida.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['ali-registro'] },
        { key: 'ali-planificacion', nombre: 'Planificación semanal', descripcion: 'Menú y compra decididos de antemano.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['ali-cocina'] },
      ],
    },
    {
      key: 'mindfulness',
      nombre: 'Mindfulness',
      orden: 3,
      nodos: [
        { key: 'min-respiracion', nombre: 'Respiración', descripcion: 'Cinco minutos de atención a la respiración.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'min-meditacion', nombre: 'Meditación sentada', descripcion: 'Sesiones de 15 minutos o más.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['min-respiracion'] },
      ],
    },
    {
      key: 'disciplina',
      nombre: 'Disciplina y tiempo',
      orden: 4,
      nodos: [
        { key: 'dis-planificacion', nombre: 'Planificar el día', descripcion: 'Decidir por la mañana qué importa hoy.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'dis-revision', nombre: 'Revisión semanal', descripcion: 'Mirar atrás una vez por semana.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['dis-planificacion'] },
      ],
    },
  ],
};
