import type { DefArbol } from './tipos';

export const ARBOL_AVENTURA: DefArbol = {
  categoria: 'aventura',
  ramas: [
    {
      key: 'zona-de-confort',
      nombre: 'Zona de confort',
      descripcion: 'El músculo de hacer cosas por primera vez.',
      orden: 1,
      nodos: [
        { key: 'ave-primera-vez', nombre: 'Primera vez', descripcion: 'Algo que nunca habías hecho.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'ave-solo', nombre: 'Hacerlo solo', descripcion: 'Sin la red de nadie conocido.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['ave-primera-vez'] },
        { key: 'ave-incomodo', nombre: 'Buscar lo incómodo', descripcion: 'Elegir el plan que te da pereza o miedo.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['ave-solo'] },
      ],
    },
    {
      key: 'viajes',
      nombre: 'Viajes',
      orden: 2,
      nodos: [
        { key: 'ave-escapada', nombre: 'Escapada corta', descripcion: 'Dos días fuera bastan para cambiar la cabeza.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'ave-lejos', nombre: 'Lejos', descripcion: 'Otro idioma, otra comida, otras normas.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['ave-escapada'] },
        { key: 'ave-largo', nombre: 'Viaje largo', descripcion: 'El tiempo suficiente para dejar de ser turista.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['ave-lejos'] },
        {
          key: 'ave-maestria',
          nombre: 'Maestría · Aventura',
          descripcion: 'No se compra con puntos. Se demuestra.',
          tier: 4,
          maxLevel: 1,
          costePuntos: 0,
          requiere: ['ave-incomodo', 'ave-largo'],
          esMaestria: true,
          retoDescripcion: 'Un viaje de más de dos semanas organizado por ti, en un sitio donde no conocías a nadie, con fotos fechadas.',
        },
      ],
    },
  ],
};
