import { useState } from 'react';
import { ProjectState, SpecItem } from '@/lib/types';
import { calculateSpec } from '@/lib/api';
import ProgressBar from '@/components/ProgressBar';
import ImageUpload from '@/components/ui/ImageUpload';
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
  arlight: { name: 'Arlight', color: '#3d5afe' },
  ego:     { name: 'EGO Lighting', color: '#f59e0b', badge: 'DEMO' },
};

const CATEGORY_PLACEHOLDER: Record<string, string> = {
  track: '📏',
  connector_straight: '🔗',
  connector_angle: '📐',
  connector_flexible: '〰️',
  end_cap: '🔲',
  mount: '🔩',
  power_inlet: '🔌',
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
    <div className="mt-2 flex gap-1.5 flex-wrap">
      {opts.map(o => (
        <button
          key={o.key}
          onClick={e => { e.stopPropagation(); onChange(o.key); }}
          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
            choice === o.key
              ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.1)] text-[var(--text-primary)]'
              : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
          }`}
        >
          {o.label}
          {o.price != null && o.price > 0 && <span className="ml-1 opacity-60">~{Math.round(o.price)}₽</span>}
          {o.key === 'cut_45' && <span className="ml-1 opacity-60">бесплатно</span>}
        </button>
      ))}
    </div>
  );
}

export default function Step6Accessories({ state, update, next, back, totalSteps }: Props) {
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
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

  const handleRecalc = async () => {
    setRecalcLoading(true);
    try {
      const res = await calculateSpec({
        constructions: state.constructions.map(c => ({ shape: c.shape, dims: c.dims })),
        supplier_code: state.supplierCode,
        voltage: state.voltage,
        mount_type: state.mountType,
      });
      update({ spec: res.spec || [], summary: res.summary || null });
    } catch { /* keep old */ }
    setRecalcLoading(false);
  };

  return (
    <div className="animate-fadein">
      <ProgressBar current={6} total={totalSteps} label="Комплектующие" />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button onClick={back} className="text-[var(--neon)] text-sm mb-6 hover:opacity-80 flex items-center gap-1.5 transition-opacity">
          <Icon name="ArrowLeft" size={14} /> Назад
        </button>

        {/* Шапка */}
        <div className="pro-card p-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg"
                style={{ backgroundColor: currentMeta.color, boxShadow: `0 0 14px ${currentMeta.color}55` }}
              >
                {currentMeta.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-black text-[var(--text-primary)]">{currentMeta.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                    style={{ backgroundColor: currentMeta.color }}
                  >
                    {state.voltage ?? '?'}В
                  </span>
                  {currentMeta.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                      {currentMeta.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {recalcLoading && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span className="animate-spin inline-block text-[var(--neon)]">⚡</span>
                  Пересчитываю...
                </div>
              )}
              <button
                onClick={handleRecalc}
                disabled={recalcLoading}
                className="flex items-center gap-1.5 text-xs border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--neon)] hover:text-[var(--neon)] px-3 py-2 rounded-xl transition-all disabled:opacity-40"
              >
                <Icon name="RefreshCw" size={12} />
                Пересчитать
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        {s && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Длина трека', value: `${s.total_length_m} м`, icon: 'Ruler' },
              { label: 'Треков', value: `${s.total_track_count} шт`, icon: 'Minus' },
              { label: 'Углов', value: `${s.total_corners} шт`, icon: 'CornerDownRight' },
              { label: 'Итого', value: `~${Math.round(totalPrice).toLocaleString('ru')} ₽`, icon: 'Wallet', accent: true },
            ].map(m => (
              <div key={m.label} className={`pro-card p-4 ${m.accent ? 'border-[var(--neon)] shadow-[0_0_12px_var(--neon-glow)]' : ''}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon name={m.icon as Parameters<typeof Icon>[0]['name']} size={13} className={m.accent ? 'text-[var(--neon)]' : 'text-[var(--text-muted)]'} />
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{m.label}</span>
                </div>
                <div className={`text-lg font-black ${m.accent ? 'neon-text' : 'text-[var(--text-primary)]'}`}>{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Спецификация */}
        {state.spec.length === 0 ? (
          <div className="pro-card p-12 text-center text-[var(--text-muted)]">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm">Спецификация пуста. Вернитесь и добавьте конструкции.</div>
          </div>
        ) : (
          <div className={`space-y-4 transition-opacity duration-200 ${recalcLoading ? 'opacity-30 pointer-events-none' : ''}`}>
            {CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
              <div key={cat} className="pro-card overflow-hidden">
                {/* Заголовок группы */}
                <div className="flex items-center gap-2.5 px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <div className="w-6 h-6 rounded-lg bg-[rgba(61,90,254,0.12)] flex items-center justify-center flex-shrink-0">
                    <Icon name={CATEGORY_ICONS[cat] as Parameters<typeof Icon>[0]['name']} size={12} className="text-[var(--neon)]" />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">{CATEGORY_LABELS[cat]}</span>
                  <span className="ml-auto text-[10px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full">
                    {grouped[cat].length} поз.
                  </span>
                </div>

                {/* Строки товаров */}
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
                    const imgSrc = itemImages[item.article] || item.image_url;

                    return (
                      <div key={item.article} className="flex items-center gap-0 hover:bg-[var(--bg-secondary)] transition-colors">
                        {/* Картинка слева */}
                        <div className="w-16 h-16 flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border)] overflow-hidden">
                          {imgSrc ? (
                            <ImageUpload
                              src={imgSrc}
                              alt={item.name}
                              className="w-full h-full"
                              imgClassName="w-full h-full object-cover"
                              onReplace={url => setItemImages(prev => ({ ...prev, [item.article]: url }))}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer group"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = e => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = ev => setItemImages(prev => ({ ...prev, [item.article]: ev.target?.result as string }));
                                  reader.readAsDataURL(file);
                                };
                                input.click();
                              }}
                            >
                              <span className="text-xl leading-none">{CATEGORY_PLACEHOLDER[item.category] ?? '📦'}</span>
                              <span className="text-[8px] text-[var(--text-muted)] group-hover:text-[var(--neon)] transition-colors">фото</span>
                            </div>
                          )}
                        </div>

                        {/* Данные */}
                        <div className="flex-1 px-4 py-3 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{item.name}</div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-[var(--text-muted)] font-mono">{item.article}</span>
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white"
                                  style={{ backgroundColor: currentMeta.color, opacity: 0.85 }}
                                >
                                  {currentMeta.name}
                                </span>
                              </div>
                              {item.category === 'connector_angle' && (
                                <AngleSelector
                                  item={item}
                                  choice={choice}
                                  onChange={v => update({ angleChoices: { ...state.angleChoices, [item.article]: v } })}
                                />
                              )}
                            </div>

                            {/* Кол-во и цена */}
                            <div className="text-right flex-shrink-0">
                              <div className="text-base font-black text-[var(--text-primary)]">{item.qty} <span className="text-xs font-normal text-[var(--text-muted)]">{item.unit}</span></div>
                              {displayPrice != null && (
                                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                  {displayPrice > 0 ? (
                                    <>
                                      <span>{Math.round(displayPrice).toLocaleString('ru')}₽ × {item.qty} = </span>
                                      <span className="font-bold text-[var(--text-primary)]">{Math.round(total).toLocaleString('ru')}₽</span>
                                    </>
                                  ) : (
                                    <span className="text-green-400">бесплатно</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Итог */}
            <div className="pro-card p-5 flex items-center justify-between border-[var(--neon)] shadow-[0_0_16px_var(--neon-glow)]">
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-0.5">Комплектующие (без светильников)</div>
                <div className="text-sm text-[var(--text-secondary)]">
                  {state.spec.length} позиций ·{' '}
                  <span className="font-bold" style={{ color: currentMeta.color }}>{currentMeta.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Итого</div>
                <div className="text-2xl font-black neon-text">
                  ~{Math.round(totalPrice).toLocaleString('ru')} ₽
                </div>
              </div>
            </div>
          </div>
        )}

        {state.spec.length > 0 && (
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => next()}
              disabled={recalcLoading}
              className="neon-btn text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              Выбрать светильники
              <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
