import { ShapeType } from '@/lib/types';
import { SHAPE_META } from '@/lib/shapes';

interface Props { shape: ShapeType; size?: number; color?: string; }

export default function ShapeSVG({ shape, size = 80, color = 'var(--neon)' }: Props) {
  const meta = SHAPE_META[shape];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d={meta.svgPath}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
    </svg>
  );
}
