/*
 * Service worker de Gamify.
 *
 * Offline SOLO de lectura, como estaba previsto: se sirve lo último que
 * visitaste para poder mirar tu progreso sin cobertura. Registrar una
 * actividad necesita servidor y no se finge lo contrario: si no hay red, el
 * registro falla y se dice, en vez de tragarse la sesión y perderla.
 */
const VERSION = 'gamify-v1';
const PAGINAS = `${VERSION}-paginas`;
const ESTATICOS = `${VERSION}-estaticos`;

self.addEventListener('install', (evento) => {
  self.skipWaiting();
  evento.waitUntil(caches.open(PAGINAS));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres.filter((n) => !n.startsWith(VERSION)).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;
  // Las acciones de servidor y la exportación no se cachean nunca.
  if (url.pathname.startsWith('/api/')) return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(redPrimero(peticion));
    return;
  }

  // Next navega por dentro pidiendo el arbol de la pagina (?_rsc=). Sin
  // cachearlo, moverse por la app sin red se quedaba en blanco aunque la
  // pagina entera estuviera guardada.
  if (url.searchParams.has('_rsc')) {
    evento.respondWith(redPrimero(peticion));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icono')) {
    evento.respondWith(cachePrimero(peticion));
  }
});

async function redPrimero(peticion) {
  const cache = await caches.open(PAGINAS);
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) cache.put(peticion, respuesta.clone());
    return respuesta;
  } catch {
    const guardada = await cache.match(peticion);
    if (guardada) return guardada;
    const inicio = await cache.match('/');
    if (inicio) return inicio;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Sin conexion</title>' +
        '<body style="background:#0a0e14;color:#e6edf5;font-family:system-ui;padding:2rem">' +
        '<h1>Sin conexion</h1><p>Abre la app con red al menos una vez para poder consultarla luego sin ella.</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 },
    );
  }
}

async function cachePrimero(peticion) {
  const cache = await caches.open(ESTATICOS);
  const guardada = await cache.match(peticion);
  if (guardada) return guardada;
  const respuesta = await fetch(peticion);
  if (respuesta.ok) cache.put(peticion, respuesta.clone());
  return respuesta;
}
