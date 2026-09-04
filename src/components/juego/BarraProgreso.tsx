type Props = {
  progreso: number;
  acento: string;
  alto?: 'fina' | 'gruesa';
};

export function BarraProgreso({ progreso, acento, alto = 'fina' }: Props) {
  const porcentaje = Math.round(Math.min(1, Math.max(0, progreso)) * 100);
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-borde ${
        alto === 'gruesa' ? 'h-3' : 'h-1.5'
      }`}
      role="progressbar"
      aria-valuenow={porcentaje}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${porcentaje}%`, backgroundColor: acento }}
      />
    </div>
  );
}
