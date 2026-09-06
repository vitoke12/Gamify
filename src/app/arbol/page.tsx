import { notFound, redirect } from 'next/navigation';
import { categoriasConArbol } from '@/lib/db/arbol';

export const dynamic = 'force-dynamic';

/** El árbol siempre se entra por una categoría concreta, nunca entero. */
export default async function PaginaArbolRaiz() {
  const categorias = await categoriasConArbol();
  if (categorias.length === 0) notFound();
  redirect(`/arbol/${categorias[0].key}`);
}
