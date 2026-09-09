import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gamify · tu progreso como un RPG',
    short_name: 'Gamify',
    description: 'Registra lo que haces de verdad y míralo como un árbol de habilidades.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0e14',
    theme_color: '#0a0e14',
    lang: 'es',
    categories: ['lifestyle', 'productivity', 'health'],
    icons: [
      { src: '/icono.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icono-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Registrar actividad',
        short_name: 'Registrar',
        description: 'Apunta lo que acabas de hacer',
        url: '/registrar',
      },
    ],
  };
}
