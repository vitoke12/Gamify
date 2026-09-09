'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Bell, BellOff } from 'lucide-react';

type Permiso = NotificationPermission | 'no-soportado';

/** No hay nada a lo que suscribirse: solo sirve para saber si ya hidratamos. */
const sinSuscripcion = () => () => {};

/**
 * Registro del service worker y aviso de racha en riesgo.
 *
 * Importante y honesto: sin servidor de push no existen las notificaciones
 * programadas. El navegador no puede despertarse solo a las ocho de la tarde
 * a recordarte nada. Lo que sí se puede es avisarte en cuanto abres la app,
 * y eso es lo que hace. Prometer más sería mentir con una campanita.
 */
export function Pwa({
  habilitado,
  rachaEnRiesgo,
  diasDeRacha,
}: {
  habilitado: boolean;
  rachaEnRiesgo: boolean;
  diasDeRacha: number;
}) {
  const enCliente = useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
  const [pedido, setPedido] = useState<Permiso | null>(null);

  const permiso: Permiso = pedido
    ? pedido
    : !enCliente
      ? 'default'
      : typeof Notification === 'undefined'
        ? 'no-soportado'
        : Notification.permission;

  useEffect(() => {
    if (!habilitado || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Un fallo aquí solo significa que no habrá modo sin conexión.
    });
  }, [habilitado]);

  useEffect(() => {
    if (permiso !== 'granted' || !rachaEnRiesgo) return;
    // Una sola vez al día: si no, cada recarga dispara otro aviso.
    const clave = `aviso-racha-${new Date().toDateString()}`;
    try {
      if (localStorage.getItem(clave)) return;
      localStorage.setItem(clave, '1');
    } catch {
      return;
    }
    new Notification('Tu racha aguanta hasta esta noche', {
      body: `Llevas ${diasDeRacha} ${diasDeRacha === 1 ? 'día' : 'días'}. Registra algo, aunque sean diez minutos.`,
      icon: '/icono.svg',
      tag: 'racha',
    });
  }, [permiso, rachaEnRiesgo, diasDeRacha]);

  if (permiso === 'no-soportado' || permiso === 'granted') return null;

  return (
    <button
      type="button"
      onClick={() => {
        void Notification.requestPermission().then(setPedido);
      }}
      className="mt-4 flex w-full items-center gap-2.5 rounded-xl border border-borde bg-superficie px-4 py-3 text-left"
    >
      {permiso === 'denied' ? (
        <BellOff className="size-4 shrink-0 text-tenue" />
      ) : (
        <Bell className="size-4 shrink-0 text-tenue" />
      )}
      <span className="flex-1 text-xs text-tenue">
        {permiso === 'denied'
          ? 'Los avisos están bloqueados en este navegador. Puedes reactivarlos desde sus ajustes.'
          : 'Avísame al abrir la app si la racha está en riesgo'}
      </span>
      {permiso !== 'denied' && <span className="text-xs text-interior">Activar</span>}
    </button>
  );
}
