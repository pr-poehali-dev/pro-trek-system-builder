import React, { useEffect } from 'react';
import { ProjectState, SpecItem, Quote } from '@/lib/types';
import { updateQuote } from '@/lib/api';
import ProgressBar from '@/components/ProgressBar';
import Icon from '@/components/ui/icon';

interface Props { state: ProjectState; back: () => void; reset: () => void; totalSteps: number; update: (p: Partial<ProjectState>) => void; next: () => void; }

const SECTIONS: { label: string; cats: string[]; icon: string }[] = [ // v2
  { label: 'Треки и профили',    cats: ['track'],                                    icon: 'Minus' },
  { label: 'Соединители',        cats: ['connector_straight','connector_angle','connector_flexible'], icon: 'Link' },
  { label: 'Заглушки и крепёж', cats: ['end_cap','mount'],                           icon: 'Package' },
  { label: 'Электрика',          cats: ['power_inlet','driver','controller'],         icon: 'Zap' },
  { label: 'Светильники',        cats: ['head'],                                      icon: 'Lightbulb' },
];

export default function Step8Final({ state, back, reset, update, totalSteps }: Props) {
  const s = state.summary;
  const totalPower = state.selectedLuminaires.reduce((sum, l) => sum + Number(l.product.params?.power_w ?? 0) * l.qty, 0);

  // Merge spec + luminaires
  const luminaireItems: SpecItem[] = state.selectedLuminaires.map(l => ({
    article: l.product.article,
    name: l.product.name,
    category: 'head',
    qty: l.qty,
    unit: 'шт',
    price: l.product.price,
  }));
  const allItems = [...state.spec, ...luminaireItems];

  const grandTotal = allItems.reduce((sum, item) => {
    let price = item.price ?? 0;
    if (item.category === 'connector_angle' && item.angle_options) {
      const ch = state.angleChoices[item.article] || 'cut_45';
      const ao = item.angle_options;
      price = ch === 'connector' ? (ao.connector?.price ?? 0)
            : ch === 'flex'      ? (ao.flex?.price ?? 0)
            : 0;
    }
    return sum + price * item.qty;
  }, 0);

  let rowNum = 0;

  // Автоматически сохраняем итоговую сумму в счёт при открытии финального экрана
  useEffect(() => {
    const q = state.quote as Quote | null;
    if (q?.id && grandTotal > 0) {
      updateQuote({ id: q.id, total_amount: Math.round(grandTotal), status: 'in_progress' });
      update({ quote: { ...q, total_amount: Math.round(grandTotal), status: 'in_progress' } });
    }
  }, []);

  return (
    <div className="animate-fadein">
      <ProgressBar current={8} total={totalSteps} label="Финальная сборка" />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button onClick={back} className="text-[var(--neon)] text-sm mb-5 hover:opacity-80 flex items-center gap-1">← Назад</button>

        {/* Header metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Длина системы', val: `${s?.total_length_m ?? 0} м`, icon: 'Ruler' },
            { label: 'Светильников',  val: `${state.selectedLuminaires.reduce((s,l)=>s+l.qty,0)} шт`, icon: 'Lightbulb' },
            { label: 'Суммарная мощность', val: `${totalPower.toFixed(0)} Вт`, icon: 'Zap' },
            { label: 'Итого (демо)',  val: `~${Math.round(grandTotal).toLocaleString('ru')} ₽`, icon: 'Wallet' },
          ].map(m => (
            <div key={m.label} className="pro-card p-3 text-center">
              <Icon name={m.icon as Parameters<typeof Icon>[0]['name']} size={16} className="text-[var(--neon)] mx-auto mb-1" />
              <div className="text-xs text-[var(--text-muted)]">{m.label}</div>
              <div className="text-base font-bold text-[var(--text-primary)] mt-0.5">{m.val}</div>
            </div>
          ))}
        </div>

        {/* Spec table */}
        <div className="pro-card overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
            <Icon name="FileText" size={14} className="text-[var(--neon)]" />
            <span className="text-sm font-bold text-[var(--text-primary)]">Спецификация</span>
            <span className={`ml-2 text-[var(--neon)] ${state.voltage === 48 ? 'badge-48v' : 'badge-220v'}`}>{state.voltage}В</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['№','Наименование','Арт.','Кол-во','Ед.','Цена','Сумма'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] text-[var(--text-muted)] uppercase tracking-wide font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map(section => {
                  const items = allItems.filter(it => section.cats.includes(it.category));
                  if (!items.length) return null;
                  return (
                    <React.Fragment key={section.label}>
                      <tr className="bg-[var(--bg-secondary)]">
                        <td colSpan={7} className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <Icon name={section.icon as Parameters<typeof Icon>[0]['name']} size={12} className="text-[var(--neon)]" />
                            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{section.label}</span>
                          </div>
                        </td>
                      </tr>
                      {items.map(item => {
                        rowNum++;
                        let price = item.price ?? 0;
                        if (item.category === 'connector_angle' && item.angle_options) {
                          const ch = state.angleChoices[item.article] || 'cut_45';
                          const ao = item.angle_options;
                          price = ch === 'connector' ? (ao.connector?.price ?? 0)
                                : ch === 'flex'      ? (ao.flex?.price ?? 0) : 0;
                        }
                        const total = price * item.qty;
                        return (
                          <tr key={`${item.article}_${rowNum}`} className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors">
                            <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs">{rowNum}</td>
                            <td className="px-3 py-2.5">
                              <div className="text-[var(--text-primary)] text-xs leading-tight">{item.name}</div>
                              {item.note && <div className="text-[10px] text-[var(--text-muted)] mt-0.5 italic">{item.note}</div>}
                            </td>
                            <td className="px-3 py-2.5 text-[var(--text-muted)] text-[10px] font-mono whitespace-nowrap">{item.article}</td>
                            <td className="px-3 py-2.5 text-[var(--text-primary)] font-semibold text-center">{item.qty}</td>
                            <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs">{item.unit}</td>
                            <td className="px-3 py-2.5 text-[var(--text-secondary)] text-xs whitespace-nowrap">
                              {price > 0 ? `${Math.round(price).toLocaleString('ru')} ₽` : '—'}
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-xs whitespace-nowrap">
                              {total > 0 ? <span className="neon-text">{Math.round(total).toLocaleString('ru')} ₽</span> : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                {/* Total row */}
                <tr className="bg-[var(--bg-secondary)] border-t-2 border-[var(--neon)]">
                  <td colSpan={6} className="px-3 py-3 text-right text-sm font-bold text-[var(--text-primary)]">Итого (демо-цены):</td>
                  <td className="px-3 py-3 text-base font-black neon-text whitespace-nowrap">
                    ~{Math.round(grandTotal).toLocaleString('ru')} ₽
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap justify-end">
          <button
            onClick={() => alert('PDF-экспорт в разработке. Скоро появится!')}
            className="flex items-center gap-2 border border-[var(--border)] text-[var(--text-secondary)] px-6 py-2.5 rounded-xl text-sm hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all"
          >
            <Icon name="Download" size={14} /> Скачать PDF
          </button>
          <button
            onClick={reset}
            className="neon-btn text-white font-semibold px-8 py-2.5 rounded-xl flex items-center gap-2"
          >
            <Icon name="RefreshCw" size={14} /> Новый проект
          </button>
        </div>
      </div>
    </div>
  );
}