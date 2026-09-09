import type { DefArbol } from './tipos';

export const ARBOL_FINANCIERO: DefArbol = {
  categoria: 'financiero',
  ramas: [
    {
      key: 'base',
      nombre: 'Base',
      descripcion: 'Saber dónde estás antes de moverte.',
      orden: 1,
      nodos: [
        { key: 'fin-registro', nombre: 'Registrar gastos', descripcion: 'Saber a dónde se va el dinero.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'fin-presupuesto', nombre: 'Presupuesto', descripcion: 'Decidir antes de gastar, no después.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['fin-registro'] },
        { key: 'fin-colchon', nombre: 'Colchón', descripcion: 'Meses de tranquilidad guardados.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['fin-presupuesto'] },
      ],
    },
    {
      key: 'inversion',
      nombre: 'Inversión',
      orden: 2,
      nodos: [
        { key: 'fin-formacion', nombre: 'Educación financiera', descripcion: 'Entender antes de meter un euro.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'fin-invertir', nombre: 'Invertir con plan', descripcion: 'Aportaciones periódicas y aburridas.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['fin-formacion'] },
        { key: 'fin-cartera', nombre: 'Cartera propia', descripcion: 'Una estrategia que puedes explicar.', tier: 3, maxLevel: 5, costePuntos: 3, requiere: ['fin-invertir'] },
      ],
    },
    {
      key: 'ingresos',
      nombre: 'Ingresos',
      orden: 3,
      nodos: [
        { key: 'fin-extra', nombre: 'Ingreso extra', descripcion: 'Un euro que no viene de la nómina.', tier: 1, maxLevel: 3, costePuntos: 1, requiere: [] },
        { key: 'fin-recurrente', nombre: 'Ingreso recurrente', descripcion: 'Que vuelva sin volver a empezar.', tier: 2, maxLevel: 5, costePuntos: 2, requiere: ['fin-extra'] },
        {
          key: 'fin-maestria',
          nombre: 'Maestría · Financiero',
          descripcion: 'No se compra con puntos. Se demuestra.',
          tier: 4,
          maxLevel: 1,
          costePuntos: 0,
          requiere: ['fin-colchon', 'fin-cartera'],
          esMaestria: true,
          retoDescripcion: 'Doce meses seguidos con el colchón intacto y la cartera aportada según el plan, con los extractos delante.',
        },
      ],
    },
  ],
};
