import type { DefArbol } from './tipos';

export const ARBOL_CREATIVO: DefArbol = {
  categoria: 'creativo',
  ramas: [
    {
      key: 'escritura',
      nombre: 'Escritura',
      orden: 1,
      nodos: [
        { key: 'cre-escribir', nombre: 'Escribir a diario', descripcion: 'Aunque sea malo, aunque sea poco.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'cre-terminar', nombre: 'Terminar textos', descripcion: 'Cerrar en vez de acumular borradores.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['cre-escribir'] },
        { key: 'cre-largo', nombre: 'Formato largo', descripcion: 'Algo que no cabe en una sentada.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['cre-terminar'] },
      ],
    },
    {
      key: 'imagen',
      nombre: 'Imagen',
      descripcion: 'Fotografía y diseño.',
      orden: 2,
      nodos: [
        { key: 'cre-disparar', nombre: 'Disparar mucho', descripcion: 'Volumen antes que criterio.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'cre-composicion', nombre: 'Composición', descripcion: 'Decidir qué entra y qué se queda fuera.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['cre-disparar'] },
        { key: 'cre-serie', nombre: 'Serie con voz', descripcion: 'Un conjunto que se reconoce como tuyo.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['cre-composicion'] },
      ],
    },
    {
      key: 'musica',
      nombre: 'Música',
      orden: 3,
      nodos: [
        { key: 'cre-instrumento', nombre: 'Practicar', descripcion: 'Manos sobre el instrumento, sin excusas.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'cre-piezas', nombre: 'Piezas enteras', descripcion: 'Tocar algo de principio a fin.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['cre-instrumento'] },
        {
          key: 'cre-maestria',
          nombre: 'Maestría · Creativo',
          descripcion: 'No se compra con puntos. Se demuestra.',
          tier: 4,
          maxLevel: 1,
          costePuntos: 0,
          requiere: ['cre-largo', 'cre-serie'],
          esMaestria: true,
          retoDescripcion: 'Publicar una obra terminada que alguien de fuera haya visto, leído o escuchado: enlace, exposición o publicación.',
        },
      ],
    },
  ],
};
