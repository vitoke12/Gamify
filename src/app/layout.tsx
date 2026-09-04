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

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
