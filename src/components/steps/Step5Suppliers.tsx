import { useState } from 'react';
import { ProjectState, SpecItem } from '@/lib/types';
import { calculateSpec } from '@/lib/api';
import ProgressBar from '@/components/ProgressBar';
import Icon from '@/components/ui/icon';

interface Props { state: ProjectState; update: (p: Partial<ProjectState>) => void; next: (p?: Partial<ProjectState>) => void; back: () => void; totalSteps: number; }

const CATEGORY_ORDER = ['track','connector_straight','connector_angle','connector_flexible','end_cap','mount','power_inlet'];
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

const SUPPLIERS_META: Record<string, { name: string; color: string; badge?: string }> = {
  arlight: { name: 'Arlight',      color: '#3d5afe' },
  ego:     { name: 'EGO Lighting', color: '#f59e0b', badge: 'DEMO' },
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
          {o.key === 'cut_45' && <span className="ml-1 opacity-60">без затрат</span>}
        </button>
      ))}
    </div>
  );
}

export default function Step5Suppliers({ state, update, next, back, totalSteps }: Props) {
  const [recalcLoading, setRecalcLoading] = useState(false);
  const s = state.summary;

  const grouped: Record<string, SpecItem[]> = {};
  for (const item of state.spec) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const totalPrice = state.spec.reduce((sum, item) => {
    const ch = state.angleChoices[item.article];
    if (item.category === 'connector_angle' && item.angle_options) {
      const ao = item.angle_options;
      const src = ch === 'connector' ? ao.connector : ch === 'flex' ? ao.flex : ao.cut_45;
      const p = src && 'price' in src ? (src.price ?? 0) : 0;
      return sum + p * item.qty;
    }
    return sum + (item.price ?? 0) * item.qty;
  }, 0);

  const currentMeta = SUPPLIERS_META[state.supplierCode] || SUPPLIERS_META.arlight;

  // Пересчёт при смене поставщика
  const handleSwitchSupplier = async (code: string) => {
    if (code === state.supplierCode) return;
    setRecalcLoading(true);
    update({ supplierCode: code });
    try {
      const body = {
        constructions: state.constructions.map(c => ({ shape: c.shape, dims: c.dims })),
        supplier_code: code,
        voltage: state.voltage,
        mount_type: state.mountType,
      };
      const res = await calculateSpec(body);
      update({ spec: res.spec || [], summary: res.summary || null, supplierCode: code });
    } catch {
      // keep old spec
    }
    setRecalcLoading(false);
  };

  return (
    <div className="animate-fadein">
      <ProgressBar current={5} total={totalSteps} label="Комплектующие" />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button onClick={back} className="text-[var(--neon)] text-sm mb-5 hover:opacity-80 flex items-center gap-1">← Назад</button>

        {/* Переключатель поставщика */}
        <div className="pro-card p-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Поставщик</div>
              <div className="flex gap-2">
                {Object.entries(SUPPLIERS_META).map(([code, meta]) => (
                  <button
                    key={code}
                    onClick={() => handleSwitchSupplier(code)}
                    disabled={recalcLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                      state.supplierCode === code
                        ? 'text-white border-transparent shadow-lg'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                    }`}
                    style={state.supplierCode === code
                      ? { backgroundColor: meta.color, boxShadow: `0 0 14px ${meta.color}55` }
                      : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: state.supplierCode === code ? 'rgba(255,255,255,0.7)' : meta.color }}
                    />
                    {meta.name}
                    {meta.badge && (
                      <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-bold">{meta.badge}</span>
                    )}
                    {state.supplierCode === code && !recalcLoading && (
                      <Icon name="Check" size={12} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={state.voltage === 48 ? 'badge-48v' : 'badge-220v'}>
                {state.voltage ?? '?'}В
              </span>
              {recalcLoading && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] animate-fadein">
                  <span className="animate-spin inline-block">⚡</span>
                  Пересчитываю для {currentMeta.name}...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        {s && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Общая длина',      value: `${s.total_length_m} м`,  icon: 'Ruler' },
              { label: 'Треков',           value: `${s.total_track_count} шт`, icon: 'Minus' },
              { label: 'Углов',            value: `${s.total_corners} шт`,  icon: 'CornerDownRight' },
              { label: 'Ориент. стоимость',value: `~${Math.round(totalPrice).toLocaleString('ru')} ₽`, icon: 'Wallet', sub: `${currentMeta.name}` },
            ].map(m => (
              <div key={m.label} className="pro-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name={m.icon as Parameters<typeof Icon>[0]['name']} size={14} className="text-[var(--neon)]" />
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{m.label}</span>
                </div>
                <div className="text-lg font-bold text-[var(--text-primary)]">{m.value}</div>
                {m.sub && <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Spec table */}
        {state.spec.length === 0 ? (
          <div className="pro-card p-8 text-center text-[var(--text-muted)]">
            <div className="text-3xl mb-3">📋</div>
            <div className="text-sm">Спецификация пуста. Вернитесь и добавьте конструкции.</div>
          </div>
        ) : (
          <div className={`space-y-4 transition-opacity ${recalcLoading ? 'opacity-40 pointer-events-none' : ''}`}>
            {CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
              <div key={cat} className="pro-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <Icon name={CATEGORY_ICONS[cat] as Parameters<typeof Icon>[0]['name']} size={14} className="text-[var(--neon)]" />
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{CATEGORY_LABELS[cat]}</span>
                  <span className="ml-auto text-[10px] text-[var(--text-muted)]">{grouped[cat].length} поз.</span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {grouped[cat].map(item => {
                    const choice = state.angleChoices[item.article] || item.selected_option || 'cut_45';
                    let displayPrice = item.price;
                    if (item.category === 'connector_angle' && item.angle_options) {
                      const ao = item.angle_options;
                      if (choice === 'connector' && ao.connector) displayPrice = ao.connector.price;
                      else if (choice === 'flex' && ao.flex) displayPrice = ao.flex.price;
                      else displayPrice = 0;
                    }
                    const total = (displayPrice ?? 0) * item.qty;

                    return (
                      <div key={item.article} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[var(--text-primary)] leading-tight">{item.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">{item.article}</span>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-white"
                                style={{ backgroundColor: currentMeta.color, opacity: 0.85 }}
                              >
                                {currentMeta.name}
                              </span>
                            </div>
                            {item.note && item.category !== 'connector_angle' && (
                              <div className="text-[10px] text-[var(--text-muted)] mt-1 italic">{item.note}</div>
                            )}
                            {item.category === 'connector_angle' && (
                              <AngleSelector
                                item={item}
                                choice={choice}
                                onChange={v => update({ angleChoices: { ...state.angleChoices, [item.article]: v } })}
                              />
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-[var(--text-primary)]">
                              {item.qty} {item.unit}
                            </div>
                            {displayPrice != null && (
                              <div className="text-[10px] text-[var(--text-muted)]">
                                {displayPrice > 0
                                  ? `${Math.round(displayPrice).toLocaleString('ru')}₽ × ${item.qty} = `
                                  : ''}
                                {displayPrice > 0
                                  ? <span className="text-[var(--text-primary)] font-semibold">{Math.round(total).toLocaleString('ru')}₽</span>
                                  : 'без доп. затрат'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Итого */}
            <div className="pro-card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-0.5">Комплектующие без светильников</div>
                <div className="text-sm text-[var(--text-secondary)]">
                  {state.spec.length} позиций · поставщик{' '}
                  <span className="font-semibold" style={{ color: currentMeta.color }}>
                    {currentMeta.name}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--text-muted)] mb-0.5">Ориент. итого</div>
                <div className="text-xl font-black neon-text">
                  ~{Math.round(totalPrice).toLocaleString('ru')} ₽
                </div>
              </div>
            </div>
          </div>
        )}

        {state.spec.length > 0 && (
          <div className="mt-5 flex justify-end">
            <button onClick={() => next()} disabled={recalcLoading} className="neon-btn text-white font-semibold px-8 py-3 rounded-xl disabled:opacity-50">
              Выбрать светильники →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
