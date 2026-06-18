import { ShapeType, ShapeDims, Construction } from './types';

export const SHAPE_META: Record<ShapeType, {
  label: string;
  fields: { key: string; label: string }[];
  corners: number;
  closed: boolean;
  svgPath: string;
}> = {
  straight: {
    label: 'Прямая',
    fields: [{ key: 'length', label: 'Длина, м' }],
    corners: 0, closed: false,
    svgPath: 'M10,50 L90,50',
  },
  l_shaped: {
    label: 'Г-образная',
    fields: [{ key: 'length', label: 'Длина, м' }, { key: 'width', label: 'Ширина, м' }],
    corners: 1, closed: false,
    svgPath: 'M10,20 L10,80 L80,80',
  },
  s_shaped: {
    label: 'С-образная',
    fields: [
      { key: 'length', label: 'Длина 1, м' },
      { key: 'width', label: 'Ширина, м' },
      { key: 'length2', label: 'Длина 2, м' },
    ],
    corners: 2, closed: false,
    svgPath: 'M10,20 L60,20 L60,50 L90,50 L90,80',
  },
  u_shaped: {
    label: 'П-образная',
    fields: [
      { key: 'length', label: 'Длина, м' },
      { key: 'width', label: 'Ширина, м' },
    ],
    corners: 2, closed: false,
    svgPath: 'M10,20 L10,80 L90,80 L90,20',
  },
  closed: {
    label: 'Замкнутая',
    fields: [{ key: 'length', label: 'Длина, м' }, { key: 'width', label: 'Ширина, м' }],
    corners: 4, closed: true,
    svgPath: 'M10,20 L90,20 L90,80 L10,80 Z',
  },
  custom: {
    label: 'Произвольная',
    fields: [],
    corners: 0, closed: false,
    svgPath: 'M10,70 L30,30 L60,50 L90,20',
  },
};

export function calcConstruction(shape: ShapeType, dims: ShapeDims): { totalLength: number; cornersCount: number; isClosed: boolean } {
  const meta = SHAPE_META[shape];
  const L = Number(dims.length || 0);
  const W = Number(dims.width || L);
  const L2 = Number(dims.length2 || L);

  let totalLength = 0;
  if (shape === 'straight') totalLength = L;
  else if (shape === 'l_shaped') totalLength = L + W;
  else if (shape === 's_shaped') totalLength = L + W + L2;
  else if (shape === 'u_shaped') totalLength = L + W + L;
  else if (shape === 'closed') totalLength = 2 * L + 2 * W;
  else if (shape === 'custom') {
    totalLength = (dims.segments || []).reduce((s, v) => s + Number(v), 0);
  }

  return {
    totalLength: Math.round(totalLength * 100) / 100,
    cornersCount: shape === 'custom' ? Number(dims.corners || 0) : meta.corners,
    isClosed: meta.closed,
  };
}

export function formatDims(c: Construction): string {
  const { shape, dims } = c;
  const L = dims.length ?? 0;
  const W = dims.width;
  if (shape === 'straight') return `${L} м`;
  if (shape === 'closed') return `${L} × ${W} м`;
  if (shape === 'l_shaped') return `${L} × ${W} м`;
  if (shape === 'u_shaped') return `${L} × ${W} м`;
  if (shape === 's_shaped') return `${L} / ${W} / ${dims.length2} м`;
  return `${c.totalLength} м`;
}
