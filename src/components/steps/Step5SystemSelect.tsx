import { useState, useEffect } from 'react';
import { ProjectState } from '@/lib/types';
import { calculateSpec, getSupplierSystems } from '@/lib/api';
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

// Метаданные поставщиков — фолбэк если БД пустая
const SUPPLIER_META: Record<string, { name: string; color: string; logo: string; seriesId: number | null; voltage: number; description: string }[]> = {
  arlight: [
    { name: 'TRACK-4TR (220В)', color: '#3d5afe', logo: ARLIGHT_LOGO, seriesId: 44, voltage: 220, description: 'Классическая 4-проводная система. Накладная, встраиваемая, подвесная.' },
    { name: 'MAG-45 (48В)',     color: '#3d5afe', logo: ARLIGHT_LOGO, seriesId: 42, voltage: 48,  description: 'Низковольтная система 48В. Безопасна, компактна, IP20.' },
    { name: 'MAG-20 (24В)',     color: '#3d5afe', logo: ARLIGHT_LOGO, seriesId: 43, voltage: 24,  description: 'Ультракомпактная система 24В для небольших помещений.' },
  ],
};

const MOUNT_LABELS: Record<string, string> = {
  surface: 'Накладной', built_in: 'Встраиваемый', harpoon: 'Гарпун', other: 'Подвесной',
};

export default function Step5SystemSelect({ state, update, next, back, totalSteps }: Props) {
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [logos, setLogos] = useState<Record<string, string>>({ arlight: ARLIGHT_LOGO });
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [loadingDb, setLoadingDb] = useState(true);
  const [filterSupplier, setFilterSupplier] = useState<string | null>(null);

  const constructionsPayload = state.constructions.map(c => ({ shape: c.shape, dims: c.dims }));
  const totalLength = state.constructions.reduce((s, c) => s + c.totalLength, 0);

  // 1. Загружаем конфиг из БД, фильтруем по mountType, затем считаем цены
  useEffect(() => {
    if (!state.constructions.length) return;

    getSupplierSystems().then(dbData => {
      // Строим список систем из БД или фолбэк-метаданных
      const filtered: SystemOption[] = [];

      const supplierCodes = Object.keys(SUPPLIER_META);
      for (const code of supplierCodes) {
        const meta = SUPPLIER_META[code];
        const dbSupplier = dbData[code] ?? {};

        meta.forEach((m, i) => {
          const dbSys = dbSupplier[i];
          // Если в БД есть запись — берём типы из БД, иначе показываем всё (фолбэк)
          const allowedTypes: string[] = dbSys?.types ?? [];
          // Если в БД пусто — показываем систему без фильтра (данные ещё не настроены)
          const passes = allowedTypes.length === 0 || allowedTypes.includes(state.mountType ?? '');
          if (!passes) return;

          filtered.push({
            supplierCode: code,
            supplierName: code === 'arlight' ? 'Arlight' : code,
            supplierColor: m.color,
            supplierLogo: m.logo,
            seriesId: m.seriesId,
            seriesName: m.name,
            voltage: m.voltage,
            totalPrice: null,
            spec: [],
            summary: null,
            description: m.description,
            pills: [
              { label: `${m.voltage}В` },
              ...(dbSys?.wires ? [{ label: dbSys.wires }] : []),
            ],
          });
        });
      }

      setSystems(filtered);
      setLoadingDb(false);

      // 2. Считаем цены для каждой прошедшей фильтр системы
      filtered.forEach((sys, idx) => {
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
    });
  }, []);

  // Клик = сразу переход дальше
  const handleSelect = (sys: SystemOption) => {
    next({ supplierCode: sys.supplierCode, voltage: sys.voltage, spec: sys.spec as never, summary: sys.summary as never, angleChoices: {} });
  };

  const anyLoading = Object.values(loading).some(Boolean);

  // Уникальные поставщики для фильтра
  const suppliers = Array.from(new Map(systems.map(s => [s.supplierCode, { code: s.supplierCode, name: s.supplierName, logo: logos[s.supplierCode] ?? s.supplierLogo }])).values());
  const visibleSystems = filterSupplier ? systems.filter(s => s.supplierCode === filterSupplier) : systems;

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

        {/* Загрузка из БД */}
        {loadingDb && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        )}

        {/* Нет систем */}
        {!loadingDb && systems.length === 0 && (
          <div className="pro-card p-8 text-center">
            <Icon name="AlertCircle" size={32} className="mx-auto mb-3 text-amber-400/60" />
            <div className="text-sm text-white/50">Для выбранного типа установки нет доступных систем.<br/>Настройте их в разделе Настройки → Поставщики.</div>
          </div>
        )}

        {/* Фильтр по поставщику */}
        {!loadingDb && suppliers.length > 1 && (
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setFilterSupplier(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filterSupplier === null ? 'bg-[var(--neon)] text-white' : 'bg-white/6 text-white/50 hover:text-white hover:bg-white/10'
              }`}>
              Все
            </button>
            {suppliers.map(sup => (
              <button key={sup.code}
                onClick={() => setFilterSupplier(filterSupplier === sup.code ? null : sup.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filterSupplier === sup.code ? 'bg-[var(--neon)] text-white' : 'bg-white/6 text-white/50 hover:text-white hover:bg-white/10'
                }`}>
                <img src={sup.logo} alt="" className="w-5 h-5 rounded-md object-cover" />
                {sup.name}
              </button>
            ))}
          </div>
        )}

        {/* Карточки */}
        <div className="space-y-3">
          {visibleSystems.map((sys) => {
            const key = `${sys.supplierCode}-${sys.seriesId}`;
            const isLoading = loading[systems.indexOf(sys)];
            const logoSrc = logos[sys.supplierCode] ?? sys.supplierLogo;

            return (
              <div key={key} onClick={() => handleSelect(sys)}
                className="pro-card p-0 overflow-hidden cursor-pointer transition-all duration-200 hover:border-[rgba(61,90,254,0.45)] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] group">
                <div className="flex items-center gap-0">

                  {/* Логотип */}
                  <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center relative">
                    {/* Цветная полоска слева */}
                    <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ backgroundColor: sys.supplierColor }} />
                    <ImageUpload
                      src={logoSrc}
                      alt={sys.supplierName}
                      className="w-14 h-14 rounded-2xl overflow-hidden"
                      imgClassName="w-full h-full object-cover"
                      imgStyle={{ mixBlendMode: 'multiply', filter: 'contrast(1.05)' }}
                      onReplace={url => setLogos(prev => ({ ...prev, [sys.supplierCode]: url }))}
                    />
                  </div>

                  {/* Контент */}
                  <div className="flex-1 py-4 pr-4 flex items-center gap-4 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-base text-white leading-tight">{sys.seriesName}</div>
                      <p className="text-xs text-white/40 mt-0.5 leading-relaxed truncate">{sys.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {sys.pills.map((pill, pi) => (
                          <span key={pi} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/50 font-medium">
                            {pill.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Цена */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-[9px] text-white/25 uppercase tracking-wider mb-1">комплектующие</div>
                      {isLoading ? (
                        <div className="text-xs text-white/30 animate-pulse">считаю...</div>
                      ) : sys.totalPrice != null ? (
                        <div className="text-xl font-black" style={{ color: sys.supplierColor }}>
                          ~{Math.round(sys.totalPrice).toLocaleString('ru')} ₽
                        </div>
                      ) : (
                        <div className="text-xs text-white/25">нет цены</div>
                      )}
                    </div>

                    <Icon name="ChevronRight" size={18} className="text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}