import { RegistroRapido } from '@/components/juego/RegistroRapido';
import { categoriasRegistrables } from '@/lib/db/consultas';

export const dynamic = 'force-dynamic';

export default async function PaginaRegistrar() {
  const categorias = await categoriasRegistrables();
  return <RegistroRapido categorias={categorias} />;
}
