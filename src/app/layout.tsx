import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gamify',
  description: 'Tu progreso real, contado como un RPG.',
};

export const viewport: Viewport = {
  themeColor: '#0a0e14',
  // Mobile-first de verdad: sin zoom accidental al tocar los controles.
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

/**
 * La clase `dark` es fija: shadcn cuelga sus tokens de ella y esta app no
 * tiene modo claro. Sin ella, el `body { @apply bg-background }` que instala
 * shadcn pinta la app de blanco.
 *
 * Sin next/font/google a proposito: la tipografia del sistema evita que el
 * build dependa de una descarga y en movil se ve igual de bien.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
