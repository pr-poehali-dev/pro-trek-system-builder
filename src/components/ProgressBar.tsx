interface Props {
  current: number;
  total: number;
  label: string;
}

const STEP_LABELS = [
  '', 'Тип системы', 'Тип установки', 'Конструктор', 'Конструкции',
  'Комплектующие', 'Светильники', 'Электрика', 'Итог',
];

export default function ProgressBar({ current, total, label }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full px-6 pt-4 pb-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-[var(--text-secondary)] font-medium tracking-wide">
          Шаг {current} из {total}. <span className="text-[var(--text-primary)]">{label || STEP_LABELS[current]}</span>
        </span>
        <span className="text-xs font-bold neon-text font-mono">{current}</span>
      </div>
      <div className="w-full h-[3px] bg-[var(--border)] rounded-full overflow-hidden">
        <div className="prog-bar h-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
