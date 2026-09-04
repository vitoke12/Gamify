import type { DefArbol } from './tipos';

export const ARBOL_MENTAL: DefArbol = {
  categoria: 'mental',
  ramas: [
    {
      key: 'conocimiento',
      nombre: 'Conocimiento',
      orden: 1,
      nodos: [
        { key: 'con-lectura', nombre: 'Lectura sostenida', descripcion: 'Leer sin interrupciones ni pantallas.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'con-notas', nombre: 'Notas y síntesis', descripcion: 'Resumir con tus palabras lo leído.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['con-lectura'] },
        { key: 'con-estudio', nombre: 'Estudio estructurado', descripcion: 'Cursos y material técnico con temario.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['con-lectura'] },
        { key: 'con-ensenar', nombre: 'Enseñar lo aprendido', descripcion: 'Explicárselo a alguien es la prueba real.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['con-notas', 'con-estudio'] },
      ],
    },
    {
      key: 'foco',
      nombre: 'Foco profundo',
      orden: 2,
      nodos: [
        { key: 'foc-bloques', nombre: 'Bloques de 25 min', descripcion: 'Trabajo sin interrupciones ni notificaciones.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'foc-noventa', nombre: 'Bloques de 90 min', descripcion: 'Sesión larga de concentración continua.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['foc-bloques'] },
        { key: 'foc-inmersion', nombre: 'Inmersión', descripcion: 'Media jornada dedicada a un solo problema.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['foc-noventa'] },
      ],
    },
    {
      key: 'pensamiento-critico',
      nombre: 'Pensamiento crítico',
      orden: 3,
      nodos: [
        { key: 'pen-argumentos', nombre: 'Análisis de argumentos', descripcion: 'Separar tesis, premisas y saltos lógicos.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'pen-escritura', nombre: 'Escritura razonada', descripcion: 'Defender una postura por escrito.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['pen-argumentos'] },
        { key: 'pen-memoria', nombre: 'Memoria activa', descripcion: 'Repaso espaciado y recuerdo forzado.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['pen-argumentos'] },
      ],
    },
  ],
};
