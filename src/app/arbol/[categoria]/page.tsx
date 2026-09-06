import { notFound } from 'next/navigation';
import { Arbol } from '@/components/juego/Arbol';
import { arbolDeCategoria, categoriasConArbol } from '@/lib/db/arbol';

export const dynamic = 'force-dynamic';

export default async function PaginaArbol({ params }: PageProps<'/arbol/[categoria]'>) {
  const { categoria } = await params;
  const [arbol, pestanas] = await Promise.all([
    arbolDeCategoria(categoria),
    categoriasConArbol(),
  ]);

  if (!arbol || arbol.ramas.length === 0) notFound();

  return <Arbol arbol={arbol} pestanas={pestanas} />;
}
