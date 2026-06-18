import { useState, useEffect } from 'react';
import { ProjectState } from '@/lib/types';
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

interface SystemOption {
  supplierCode: string;
  supplierName: string;
  supplierColor: string;
  supplierLogo: string | null;
  seriesId: number | null;
  seriesName: string;
  voltage: number | null;
  totalPrice: number | null;
  spec: unknown[];
  summary: unknown;
  pills: { label: string; color?: string }[];
}

const SUPPLIERS_META: Record<string, { name: string; color: string; logo: string }> = {
  arlight: {
    name: 'Arlight',
    color: '#3d5afe',
    logo: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/67102236-293c-4925-b47f-e13686e93b7e.jpg',
  },
  ego: {
    name: 'EGO Lighting',
    color: '#f59e0b',
    logo: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/9e2f7080-ba25-407a-a4ab-2a89623e9876.jpg',
  },
};

const SYSTEMS_CATALOG: SystemOption[] = [
  {
    supplierCode: 'arlight',
    supplierName: 'Arlight',
    supplierColor: '#3d5afe',
    supplierLogo: SUPPLIERS_META.arlight.logo,
    seriesId: 44,
    seriesName: 'TRACK-4TR (220В)',
    voltage: 220,
    totalPrice: null,
    spec: [],
    summary: null,
    pills: [
      { label: '220В' },
      { label: '4-проводная' },
      { label: 'Накладная' },
      { label: 'Встраиваемая' },
      { label: 'Подвесная' },
    ],
  },
  {
    supplierCode: 'arlight',
    supplierName: 'Arlight',
    supplierColor: '#3d5afe',
    supplierLogo: SUPPLIERS_META.arlight.logo,
    seriesId: 42,
    seriesName: 'MAG-45 (48В)',
    voltage: 48,
    totalPrice: null,
    spec: [],
    summary: null,
    pills: [
      { label: '48В' },
      { label: 'Маломощная' },
      { label: 'IP20' },
      { label: 'Накладная' },
      { label: 'Встраиваемая' },
    ],
  },
  {
    supplierCode: 'arlight',
    supplierName: 'Arlight',
    supplierColor: '#3d5afe',
    supplierLogo: SUPPLIERS_META.arlight.logo,
    seriesId: 43,
    seriesName: 'MAG-20 (24В)',
    voltage: 24,
    totalPrice: null,
    spec: [],
    summary: null,
    pills: [
      { label: '24В' },
      { label: 'Компактная' },
      { label: 'IP20' },
      { label: 'Накладная' },
    ],
  },
  {
    supplierCode: 'ego',
    supplierName: 'EGO Lighting',
    supplierColor: '#f59e0b',
    supplierLogo: SUPPLIERS_META.ego.logo,
    seriesId: null,
    seriesName: 'EGO Track System',
    voltage: 220,
    totalPrice: null,
    spec: [],
    summary: null,
    pills: [
      { label: '220В' },
      { label: '4-проводная' },
      { label: 'DEMO' },
    ],
  },
];

export default function Step5SystemSelect({ state, update, next, back, totalSteps }: Props) {
  const [systems, setSystems] = useState<SystemOption[]>(SYSTEMS_CATALOG);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const constructionsPayload = state.constructions.map(c => ({ shape: c.shape, dims: c.dims }));
  const totalLength = state.constructions.reduce((s, c) => s + c.totalLength, 0);

  useEffect(() => {
    if (!state.constructions.length) return;
    SYSTEMS_CATALOG.forEach((sys, idx) => {
      setLoading(prev => ({ ...prev, [idx]: true }));
      calculateSpec({
        constructions: constructionsPayload,
        supplier_code: sys.supplierCode,
        voltage: sys.voltage,
        mount_type: state.mountType,
      }).then(res => {
        setSystems(prev => {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            totalPrice: res.summary?.total_price ?? null,
            spec: res.spec ?? [],
            summary: res.summary ?? null,
          };
          return updated;
        });
      }).catch(() => {}).finally(() => {
        setLoading(prev => ({ ...prev, [idx]: false }));
      });
    });
  }, []);

  const handleSelect = (sys: SystemOption) => {
    const key = `${sys.supplierCode}-${sys.seriesId}`;
    setSelected(key);
    update({
      supplierCode: sys.supplierCode,
      voltage: sys.voltage,
      spec: sys.spec as never,
      summary: sys.summary as never,
      angleChoices: {},
    });
  };

  const handleConfirm = () => {
    const sys = systems.find(s => `${s.supplierCode}-${s.seriesId}` === selected);
    if (!sys) return;
    next({
      supplierCode: sys.supplierCode,
      voltage: sys.voltage,
      spec: sys.spec as never,
      summary: sys.summary as never,
      angleChoices: {},
    });
  };

  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="animate-fadein">
      <ProgressBar current={5} total={totalSteps} label="Выбор системы" />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button onClick={back} className="text-[var(--neon)] text-sm mb-5 hover:opacity-80 flex items-center gap-1 transition-opacity">
          ← Назад
        </button>

        <div className="pro-card p-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Выберите поставщика и систему</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Общая длина трека: <strong className="text-[var(--text-secondary)]">{totalLength.toFixed(1)} м</strong>
                {state.mountType && <span className="ml-2">· {state.mountType === 'surface' ? 'Накладной' : state.mountType === 'built_in' ? 'В ГКЛ' : state.mountType === 'harpoon' ? 'Гарпун' : 'Подвесной'}</span>}
              </p>
            </div>
            {anyLoading && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="animate-spin inline-block">⚡</span>
                Считаю цены...
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {systems.map((sys, idx) => {
            const key = `${sys.supplierCode}-${sys.seriesId}`;
            const isSelected = selected === key;
            const isLoading = loading[idx];

            return (
              <button
                key={key}
                onClick={() => handleSelect(sys)}
                className={`w-full pro-card p-0 overflow-hidden text-left transition-all duration-200 ${
                  isSelected
                    ? 'selected shadow-[0_0_20px_var(--neon-glow)]'
                    : 'hover:border-[rgba(61,90,254,0.4)]'
                }`}
              >
                <div className="flex items-stretch">
                  {/* Лого поставщика */}
                  <div
                    className="w-28 flex-shrink-0 flex flex-col items-center justify-center p-4 border-r border-[var(--border)]"
                    style={{ backgroundColor: `${sys.supplierColor}10` }}
                  >
                    {sys.supplierLogo ? (
                      <img
                        src={sys.supplierLogo}
                        alt={sys.supplierName}
                        className="w-14 h-14 rounded-xl object-cover mb-2"
                        style={{ boxShadow: `0 0 12px ${sys.supplierColor}44` }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-2 text-white font-black text-lg"
                        style={{ backgroundColor: sys.supplierColor, boxShadow: `0 0 12px ${sys.supplierColor}55` }}
                      >
                        {sys.supplierName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] text-center leading-tight">
                      {sys.supplierName}
                    </span>
                  </div>

                  {/* Контент */}
                  <div className="flex-1 p-4 flex flex-col justify-center gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-[var(--text-primary)] mb-1.5">
                          {sys.seriesName}
                        </div>
                        {/* Характеристики в пилюлях */}
                        <div className="flex flex-wrap gap-1.5">
                          {sys.pills.map((pill, pi) => (
                            <span
                              key={pi}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-secondary)]"
                            >
                              {pill.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Цена */}
                      <div className="text-right flex-shrink-0 min-w-[90px]">
                        {isLoading ? (
                          <div className="text-[var(--text-muted)] text-xs animate-pulse">считаю...</div>
                        ) : sys.totalPrice != null ? (
                          <>
                            <div className="text-[10px] text-[var(--text-muted)] mb-0.5">комплектующие</div>
                            <div
                              className="text-lg font-black leading-tight"
                              style={{ color: sys.supplierColor }}
                            >
                              ~{Math.round(sys.totalPrice).toLocaleString('ru')} ₽
                            </div>
                          </>
                        ) : (
                          <div className="text-[var(--text-muted)] text-xs">нет цены</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Чекбокс */}
                  <div className="flex items-center pr-4 flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[var(--neon)] bg-[var(--neon)] shadow-[0_0_8px_var(--neon-glow)]'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      {isSelected && <Icon name="Check" size={10} className="text-white" />}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-5 flex justify-end animate-fadein">
            <button
              onClick={handleConfirm}
              className="neon-btn text-white font-semibold px-8 py-3 rounded-xl"
            >
              Перейти к комплектующим →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}