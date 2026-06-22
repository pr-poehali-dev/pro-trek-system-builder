import { useState, useEffect } from 'react';
import { ProjectState } from '@/lib/types';
import { calculateSpec } from '@/lib/api';
import ProgressBar from '@/components/ProgressBar';
import ImageUpload from '@/components/ui/ImageUpload';
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
  supplierLogo: string;
  seriesId: number | null;
  seriesName: string;
  voltage: number | null;
  totalPrice: number | null;
  spec: unknown[];
  summary: unknown;
  pills: { label: string }[];
  description: string;
}

const ARLIGHT_LOGO = 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/67102236-293c-4925-b47f-e13686e93b7e.jpg';
const EGO_LOGO = 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/9e2f7080-ba25-407a-a4ab-2a89623e9876.jpg';

const INIT_SYSTEMS: SystemOption[] = [
  {
    supplierCode: 'arlight',
    supplierName: 'Arlight',
    supplierColor: '#3d5afe',
    supplierLogo: ARLIGHT_LOGO,
    seriesId: 44,
    seriesName: 'TRACK-4TR (220В)',
    voltage: 220,
    totalPrice: null,
    spec: [],
    summary: null,
    description: 'Классическая 4-проводная система. Накладная, встраиваемая, подвесная.',
    pills: [{ label: '220В' }, { label: '4-проводная' }, { label: 'Накладная' }, { label: 'Встраиваемая' }, { label: 'Подвесная' }],
  },
  {
    supplierCode: 'arlight',
    supplierName: 'Arlight',
    supplierColor: '#3d5afe',
    supplierLogo: ARLIGHT_LOGO,
    seriesId: 42,
    seriesName: 'MAG-45 (48В)',
    voltage: 48,
    totalPrice: null,
    spec: [],
    summary: null,
    description: 'Низковольтная система 48В. Безопасна, компактна, IP20.',
    pills: [{ label: '48В' }, { label: 'Маломощная' }, { label: 'IP20' }, { label: 'Накладная' }, { label: 'Встраиваемая' }],
  },
  {
    supplierCode: 'arlight',
    supplierName: 'Arlight',
    supplierColor: '#3d5afe',
    supplierLogo: ARLIGHT_LOGO,
    seriesId: 43,
    seriesName: 'MAG-20 (24В)',
    voltage: 24,
    totalPrice: null,
    spec: [],
    summary: null,
    description: 'Ультракомпактная система 24В для небольших помещений.',
    pills: [{ label: '24В' }, { label: 'Компактная' }, { label: 'IP20' }, { label: 'Накладная' }],
  },
  {
    supplierCode: 'ego',
    supplierName: 'EGO Lighting',
    supplierColor: '#f59e0b',
    supplierLogo: EGO_LOGO,
    seriesId: null,
    seriesName: 'EGO Track System',
    voltage: 220,
    totalPrice: null,
    spec: [],
    summary: null,
    description: 'Премиум-трек 220В. Демо-версия каталога.',
    pills: [{ label: '220В' }, { label: '4-проводная' }, { label: 'DEMO' }],
  },
];

const MOUNT_LABELS: Record<string, string> = {
  surface: 'Накладной', built_in: 'Встраиваемый', harpoon: 'Гарпун', other: 'Подвесной',
};

export default function Step5SystemSelect({ state, update, next, back, totalSteps }: Props) {
  const [systems, setSystems] = useState<SystemOption[]>(INIT_SYSTEMS);
  const [logos, setLogos] = useState<Record<string, string>>({ arlight: ARLIGHT_LOGO, ego: EGO_LOGO });
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const constructionsPayload = state.constructions.map(c => ({ shape: c.shape, dims: c.dims }));
  const totalLength = state.constructions.reduce((s, c) => s + c.totalLength, 0);

  useEffect(() => {
    if (!state.constructions.length) return;
    INIT_SYSTEMS.forEach((sys, idx) => {
      setLoading(prev => ({ ...prev, [idx]: true }));
      calculateSpec({
        constructions: constructionsPayload,
        supplier_code: sys.supplierCode,
        voltage: sys.voltage,
        mount_type: state.mountType,
      }).then(res => {
        setSystems(prev => {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], totalPrice: res.summary?.total_price ?? null, spec: res.spec ?? [], summary: res.summary ?? null };
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
    update({ supplierCode: sys.supplierCode, voltage: sys.voltage, spec: sys.spec as never, summary: sys.summary as never, angleChoices: {} });
  };

  const handleConfirm = () => {
    const sys = systems.find(s => `${s.supplierCode}-${s.seriesId}` === selected);
    if (!sys) return;
    next({ supplierCode: sys.supplierCode, voltage: sys.voltage, spec: sys.spec as never, summary: sys.summary as never, angleChoices: {} });
  };

  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="animate-fadein">
      <ProgressBar current={5} total={totalSteps} label="Выбор системы" />
      <div className="max-w-5xl mx-auto px-6 py-6">

        <button onClick={back} className="text-[var(--neon)] text-sm mb-6 hover:opacity-80 flex items-center gap-1.5 transition-opacity">
          <Icon name="ArrowLeft" size={14} /> Назад
        </button>

        {/* Заголовок */}
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">Выберите поставщика и систему</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Общая длина трека: <strong className="text-[var(--text-secondary)]">{totalLength.toFixed(1)} м</strong>
              {state.mountType && <span className="ml-2 text-[var(--text-muted)]">· {MOUNT_LABELS[state.mountType] ?? state.mountType}</span>}
            </p>
          </div>
          {anyLoading && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-full border border-[var(--border)]">
              <span className="animate-spin inline-block text-[var(--neon)]">⚡</span>
              Считаю цены...
            </div>
          )}
        </div>

        {/* Карточки систем */}
        <div className="space-y-3">
          {systems.map((sys, idx) => {
            const key = `${sys.supplierCode}-${sys.seriesId}`;
            const isSelected = selected === key;
            const isLoading = loading[idx];
            const logoSrc = logos[sys.supplierCode] ?? sys.supplierLogo;

            return (
              <div
                key={key}
                onClick={() => handleSelect(sys)}
                className={`pro-card p-0 overflow-hidden cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-[var(--neon)] shadow-[0_0_24px_var(--neon-glow)] -translate-y-0.5'
                    : 'hover:border-[rgba(61,90,254,0.45)] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                }`}
              >
                <div className="flex items-stretch">

                  {/* Лого-колонка */}
                  <div
                    className="w-24 md:w-28 flex-shrink-0 flex flex-col items-center justify-center gap-2 p-3 border-r border-[var(--border)] relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${sys.supplierColor}18, ${sys.supplierColor}06)` }}
                  >
                    <ImageUpload
                      src={logoSrc}
                      alt={sys.supplierName}
                      className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
                      imgClassName="w-full h-full object-cover"
                      onReplace={url => setLogos(prev => ({ ...prev, [sys.supplierCode]: url }))}
                    />
                    <span className="text-[9px] font-bold text-[var(--text-muted)] text-center leading-tight uppercase tracking-wide">
                      {sys.supplierName}
                    </span>
                    {/* Accent line */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: sys.supplierColor }} />
                  </div>

                  {/* Контент */}
                  <div className="flex-1 p-4 flex flex-col justify-center gap-2 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-base text-[var(--text-primary)] leading-tight mb-1">
                          {sys.seriesName}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mb-2 leading-relaxed">{sys.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {sys.pills.map((pill, pi) => (
                            <span
                              key={pi}
                              className="text-[10px] px-2.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-secondary)] font-medium"
                            >
                              {pill.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Цена */}
                      <div className="text-right flex-shrink-0 min-w-[100px]">
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">комплектующие</div>
                        {isLoading ? (
                          <div className="text-xs text-[var(--text-muted)] animate-pulse">считаю...</div>
                        ) : sys.totalPrice != null ? (
                          <div className="text-xl font-black" style={{ color: sys.supplierColor }}>
                            ~{Math.round(sys.totalPrice).toLocaleString('ru')} ₽
                          </div>
                        ) : (
                          <div className="text-xs text-[var(--text-muted)]">нет цены</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Чекбокс */}
                  <div className="flex items-center pr-4 flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'shadow-[0_0_10px_var(--neon-glow)]'
                          : 'border-[var(--border)]'
                      }`}
                      style={isSelected ? { backgroundColor: sys.supplierColor, borderColor: sys.supplierColor } : {}}
                    >
                      {isSelected && <Icon name="Check" size={10} className="text-white" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selected && (
          <div className="mt-5 flex justify-end animate-fadein">
            <button onClick={handleConfirm} className="neon-btn text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2">
              Перейти к комплектующим
              <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
