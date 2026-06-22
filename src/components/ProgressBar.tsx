interface Props {
  current: number;
  total: number;
  label: string;
}

export default function ProgressBar({ current, total, label }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full h-[3px] bg-[var(--border)]">
      <div className="prog-bar h-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
