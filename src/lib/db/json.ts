/**
 * SQLite no tiene tipo Json en Prisma, asi que los campos `*Json` son String.
 * Estos dos helpers son el unico sitio donde se serializa y se parsea, para
 * que un JSON corrupto en la base no reviente una pantalla entera.
 */

export function aJson(valor: unknown): string {
  return JSON.stringify(valor ?? null);
}

export function deJson<T>(texto: string | null | undefined, porDefecto: T): T {
  if (!texto) return porDefecto;
  try {
    const parseado = JSON.parse(texto);
    return (parseado ?? porDefecto) as T;
  } catch {
    return porDefecto;
  }
}
