import { useState, useEffect } from 'react';
import { ProjectState, SpecItem } from '@/lib/types';
import { calculateSpec } from '@/lib/api';
import ProgressBar from '@/components/ProgressBar';
import Icon from '@/components/ui/icon';

interface Props {
  state: ProjectState;
  update: (p: Partial<ProjectState>) => void;
  next: (p?: Partial<ProjectState>) => void;
  back: () => void;
  totalSteps: number;
}

const CATEGORY_ORDER = ['track', 'connector_straight', 'connector_angle', 'connector_flexible', 'end_cap', 'mount', 'power_inlet'];
const CATEGORY_LABELS: Record<string, string> = {
  track: 'Шинопроводы (треки)',
  connector_straight: 'Прямые соединители',
  connector_angle: 'Угловые соединители',
  connector_flexible: 'Гибкие соединители',
  end_cap: 'Заглушки торцевые',
  mount: 'Подвесы / крепёж',
  power_inlet: 'Токовводы',
};
const CATEGORY_ICONS: Record<string, string> = {
  track: 'Minus', connector_straight: 'ArrowRight', connector_angle: 'CornerDownRight',
  connector_flexible: 'Waypoints', end_cap: 'Square', mount: 'Link', power_inlet: 'Plug',
};

function AngleSelector({ item, choice, onChange }: {
  item: SpecItem; choice: string; onChange: (v: string) => void;
}) {
  const ao = item.angle_options;
  if (!ao) return null;
  const opts = [
    ao.has_connector && ao.connector ? { key: 'connector', label: 'Готовый угол', price: ao.connector.price } : null,
    ao.has_flex && ao.flex ? { key: 'flex', label: 'Гибкий', price: ao.flex.price } : null,
    { key: 'cut_45', label: 'Зарезка 45°', price: 0 },
  ].filter(Boolean) as { key: string; label: string; price: number | null }[];

  return (
    <div className="mt-2 flex gap-2 flex-wrap">
      {opts.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
            choice === o.key
              ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.1)] text-[var(--text-primary)]'
              : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
          }`}
        >
          {o.label}
          {o.price != null && o.price > 0 && <span className="ml-1 opacity-60">~{Math.round(o.price)}₽</span>}
          {o.key === 'cut_45' && <span className="ml-1 opacity-60">без доп. затрат</span>}
        </button>
      ))}
    </div>
  );
}

function ProductRow({ item, choice, onAngleChange }: {
  item: SpecItem;
  choice: string;
  onAngleChange: (v: string) => void;
}) {
  let displayPrice = item.price;
  if (item.category === 'connector_angle' && item.angle_options) {
    const ao = item.angle_options;
    if (choice === 'connector' && ao.connector) displayPrice = ao.connector.price;
    else if (choice === 'flex' && ao.flex) displayPrice = ao.flex.price;
    else displayPrice = 0;
  }
  const total = (displayPrice ?? 0) * item.qty;

  return (
    <div className="flex items-stretch gap-0 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
      {/* Левая часть — картинка заглушка */}
      <div className="w-16 flex-shrink-0 flex items-center justify-center bg-[var(--bg-secondary)] border-r border-[var(--border)] p-2">
        <div className="w-10 h-10 rounded-lg bg-[var(--border)] flex items-center justify-center">
          <Icon
            name={CATEGORY_ICONS[item.category] as Parameters<typeof Icon>[0]['name'] || 'Package'}
            size={16}
            className="text-[var(--neon)]"
          />
        </div>
      </div>

      {/* Правая часть — инфо */}
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-[var(--text-primary)] font-medium leading-tight">{item.name}</div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{item.article}</div>
            {item.note && item.category !== 'connector_angle' && (
              <div className="text-[10px] text-amber-500 mt-1">⚠ {item.note}</div>
            )}
            {item.category === 'connector_angle' && (
              <AngleSelector item={item} choice={choice} onChange={onAngleChange} />
            )}
          </div>
          <div className="text-right flex-shrink-0 min-w-[80px]">
            <div className="text-sm font-bold text-[var(--text-primary)]">
              {item.qty} <span className="text-[var(--text-muted)] font-normal text-xs">{item.unit}</span>
            </div>
            {displayPrice != null && displayPrice > 0 ? (
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {Math.round(displayPrice).toLocaleString('ru')} ₽ × {item.qty}
              </div>
            ) : displayPrice === 0 ? (
              <div className="text-[10px] text-[var(--success)] mt-0.5">без затрат</div>
            ) : null}
            {total > 0 && (
              <div className="text-xs font-semibold neon-text mt-0.5">
                = {Math.round(total).toLocaleString('ru')} ₽
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Step6Spec({ state, update, next, back, totalSteps }: Props) {
  const [loading, setLoading] = useState(false);
  const s = state.summary;

  // Автоматически рассчитываем при входе на шаг если спека пустая
  useEffect(() => {
    if (state.spec.length === 0 && state.constructions.length > 0) {
      runCalc();
    }
  }, []);

  const runCalc = async () => {
    setLoading(true);
    try {
      const body = {
        constructions: state.constructions.map(c => ({ shape: c.shape, dims: c.dims })),
        supplier_code: state.supplierCode,
        voltage: state.voltage,
        mount_type: state.mountType,
      };
      const res = await calculateSpec(body);
      update({ spec: res.spec || [], summary: res.summary || null });
    } catch {
      // silent — покажем кнопку ручного пересчёта
    }
    setLoading(false);
  };

  const grouped: Record<string, SpecItem[]> = {};
  for (const item of state.spec) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const totalPrice = state.spec.reduce((sum, item) => {
    const ch = state.angleChoices[item.article] || item.selected_option || 'cut_45';
    if (item.category === 'connector_angle' && item.angle_options) {
      const ao = item.angle_options;
      const p = ch === 'connector' ? (ao.connector?.price ?? 0)
               : ch === 'flex' ? (ao.flex?.price ?? 0) : 0;
      return sum + p * item.qty;
    }
    return sum + (item.price ?? 0) * item.qty;
  }, 0);

  const handleRecalc = () => runCalc();

  return (
    <div className="animate-fadein">
      <ProgressBar current={6} total={totalSteps} label="Комплектующие" />
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-5">
          <button onClick={back} className="text-[var(--neon)] text-sm hover:opacity-80 flex items-center gap-1">← Назад</button>
          <button
            onClick={handleRecalc}
            disabled={loading}
            className="text-xs border border-[var(--border)] text-[var(--text-muted)] px-3 py-1.5 rounded-lg hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Icon name="RefreshCw" size={12} /> {loading ? 'Пересчёт...' : 'Пересчитать'}
          </button>
        </div>

        {/* Summary */}
        {s && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Длина', value: `${s.total_length_m} м`, icon: 'Ruler' },
              { label: 'Треков', value: `${s.total_track_count} шт`, icon: 'Minus' },
              { label: 'Углов', value: `${s.total_corners} шт`, icon: 'CornerDownRight' },
              { label: 'Профиль', value: totalPrice > 0 ? `~${Math.round(totalPrice).toLocaleString('ru')} ₽` : '—', icon: 'Wallet', sub: totalPrice > 0 ? 'демо' : '' },
            ].map(m => (
              <div key={m.label} className="pro-card p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon name={m.icon as Parameters<typeof Icon>[0]['name']} size={12} className="text-[var(--neon)]" />
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{m.label}</span>
                </div>
                <div className="text-base font-bold text-[var(--text-primary)]">{m.value}</div>
                {m.sub && <div className="text-[9px] text-[var(--text-muted)]">{m.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Поставщик и напряжение */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 pro-card px-3 py-1.5">
            <Icon name="Store" size={12} className="text-[var(--neon)]" />
            <span className="text-xs text-[var(--text-primary)] font-semibold">{state.supplierCode}</span>
          </div>
          <span className={state.voltage === 48 ? 'badge-48v' : 'badge-220v'}>{state.voltage ?? '?'}В</span>
        </div>

        {/* Spec groups */}
        {state.spec.length === 0 ? (
          <div className="pro-card p-10 text-center text-[var(--text-muted)]">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm mb-2">Спецификация пуста</div>
            <div className="text-xs">Каталог Arlight нужно загрузить — откройте ⚙ Каталог в шапке</div>
            <button onClick={handleRecalc} className="mt-4 neon-btn text-white text-xs px-5 py-2 rounded-lg">
              Рассчитать заново
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
              <div key={cat} className="pro-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <Icon name={CATEGORY_ICONS[cat] as Parameters<typeof Icon>[0]['name']} size={14} className="text-[var(--neon)]" />
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{CATEGORY_LABELS[cat]}</span>
                  <span className="ml-auto text-[10px] text-[var(--text-muted)]">{grouped[cat].length} поз.</span>
                </div>
                {grouped[cat].map(item => (
                  <ProductRow
                    key={item.article}
                    item={item}
                    choice={state.angleChoices[item.article] || item.selected_option || 'cut_45'}
                    onAngleChange={v => update({ angleChoices: { ...state.angleChoices, [item.article]: v } })}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={() => next()} className="neon-btn text-white font-semibold px-8 py-3 rounded-xl">
            Выбрать светильники →
          </button>
        </div>
      </div>
    </div>
  );
}