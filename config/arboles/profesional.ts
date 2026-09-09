import type { DefArbol } from './tipos';

export const ARBOL_PROFESIONAL: DefArbol = {
  categoria: 'profesional',
  ramas: [
    {
      key: 'oficio',
      nombre: 'Oficio',
      descripcion: 'Ser mejor en lo que ya haces.',
      orden: 1,
      nodos: [
        { key: 'pro-fundamentos', nombre: 'Fundamentos', descripcion: 'Lo básico, pero bien.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'pro-profundidad', nombre: 'Profundidad', descripcion: 'Meterse donde los demás se paran.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['pro-fundamentos'] },
        { key: 'pro-referente', nombre: 'Referente', descripcion: 'Que te pregunten a ti.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['pro-profundidad'] },
      ],
    },
    {
      key: 'proyectos',
      nombre: 'Proyectos',
      orden: 2,
      nodos: [
        { key: 'pro-entregar', nombre: 'Entregar', descripcion: 'Terminar lo empezado, aunque no sea perfecto.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'pro-planificar', nombre: 'Planificar', descripcion: 'Ver el camino antes de andarlo.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['pro-entregar'] },
        { key: 'pro-dirigir', nombre: 'Dirigir', descripcion: 'Que otros trabajen contigo y no a pesar de ti.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['pro-planificar'] },
      ],
    },
    {
      key: 'marca',
      nombre: 'Marca personal',
      orden: 3,
      nodos: [
        { key: 'pro-publicar', nombre: 'Publicar lo que sabes', descripcion: 'Sacarlo fuera aunque esté a medias.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'pro-audiencia', nombre: 'Audiencia', descripcion: 'Gente que vuelve a leerte.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['pro-publicar'] },
        {
          key: 'pro-maestria',
          nombre: 'Maestría · Profesional',
          descripcion: 'No se compra con puntos. Se demuestra.',
          tier: 4,
          maxLevel: 1,
          costePuntos: 0,
          requiere: ['pro-referente', 'pro-dirigir'],
          esMaestria: true,
          retoDescripcion: 'Sacar adelante un proyecto con gente a tu cargo, de principio a fin, y que quede constancia pública o del cliente.',
        },
      ],
    },
  ],
};
