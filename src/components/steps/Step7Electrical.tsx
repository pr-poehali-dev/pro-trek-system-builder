import { useState, useEffect } from 'react';
import { ProjectState, Product } from '@/lib/types';
import { getCatalog } from '@/lib/api';
import ProgressBar from '@/components/ProgressBar';
import Icon from '@/components/ui/icon';

interface Props { state: ProjectState; update: (p: Partial<ProjectState>) => void; next: () => void; back: () => void; totalSteps: number; }

export default function Step7Electrical({ state, update, next, back, totalSteps }: Props) {
  const [drivers, setDrivers] = useState<Product[]>([]);
  const [controllers, setControllers] = useState<Product[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const totalPower = state.selectedLuminaires.reduce((s, l) => s + Number(l.product.params?.power_w ?? 0) * l.qty, 0);
  const neededPower = Math.ceil(totalPower * 1.25);

  const needController = state.selectedLuminaires.some(l => l.product.params?.dimmable || l.product.params?.control_protocol);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { category: 'driver', supplier_code: state.supplierCode, limit: 50 };
    if (state.voltage) params.voltage = state.voltage;
    getCatalog(params).then(r => {
      const list: Product[] = r.products || [];
      setDrivers(list);
      const suitable = list.find(d => Number(d.params?.power_w ?? 0) >= neededPower);
      if (suitable) setSelectedDriver(suitable);
      setLoading(false);
    }).catch(() => setLoading(false));

    if (needController) {
      getCatalog({ category: 'controller', supplier_code: state.supplierCode, limit: 20 }).then(r => {
        setControllers(r.products || []);
      });
    }
  }, [state.supplierCode, state.voltage, neededPower, needController]);

  const handleNext = () => {
    const extras = [...state.spec];
    if (selectedDriver) {
      extras.push({
        article: selectedDriver.article,
        name: selectedDriver.name,
        category: 'driver',
        qty: 1,
        unit: 'шт',
        price: selectedDriver.price,
        sort: 90,
      });
    }
    update({ spec: extras });
    next();
  };

  return (
    <div className="animate-fadein">
      <ProgressBar current={7} total={totalSteps} label="Электрика" />
      <div className="max-w-4xl mx-auto px-6 py-6">
        <button onClick={back} className="text-[var(--neon)] text-sm mb-5 hover:opacity-80 flex items-center gap-1">← Назад</button>

        {/* Power summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="pro-card p-4 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Мощность светильников</div>
            <div className="text-2xl font-black text-[var(--text-primary)]">{totalPower.toFixed(0)}</div>
            <div className="text-xs text-[var(--text-muted)]">Вт</div>
          </div>
          <div className="pro-card p-4 text-center neon-border">
            <div className="text-xs text-[var(--text-muted)] mb-1">Нужен БП (×1.25)</div>
            <div className="text-2xl font-black neon-text">{neededPower}</div>
            <div className="text-xs text-[var(--text-muted)]">Вт минимум</div>
          </div>
          <div className="pro-card p-4 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Токовводов</div>
            <div className="text-2xl font-black text-[var(--text-primary)]">{state.summary?.power_inlets_qty ?? 1}</div>
            <div className="text-xs text-[var(--text-muted)]">шт</div>
          </div>
        </div>

        {/* Drivers */}
        <div className="pro-card overflow-hidden mb-5">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
            <Icon name="Zap" size={14} className="text-[var(--neon)]" />
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Блок питания</span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-[var(--text-muted)] text-sm">Загружаю...</div>
          ) : drivers.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-muted)]">
              <div className="text-sm mb-1">Блоки питания не найдены в каталоге</div>
              <div className="text-xs">Загрузите каталог через ⚙ Каталог</div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {drivers.map(d => {
                const pw = Number(d.params?.power_w ?? 0);
                const suitable = pw >= neededPower;
                const isSelected = selectedDriver?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDriver(d)}
                    className={`w-full px-4 py-3 flex items-center gap-4 text-left transition-all ${
                      isSelected ? 'bg-[rgba(61,90,254,0.08)]' : 'hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      isSelected ? 'border-[var(--neon)] bg-[var(--neon)]' : 'border-[var(--border)]'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--text-primary)] leading-tight">{d.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{d.article}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-bold ${suitable ? 'neon-text' : 'text-[var(--text-muted)]'}`}>{pw} Вт</div>
                      {d.price && <div className="text-[10px] text-[var(--text-muted)]">{Math.round(d.price).toLocaleString('ru')} ₽</div>}
                      {!suitable && <div className="text-[10px] text-[var(--danger)]">мало мощности</div>}
                      {suitable && pw > 0 && <div className="text-[10px] text-[var(--neon)]">✓ подходит</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Controllers */}
        <div className="pro-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Sliders" size={14} className="text-[var(--neon)]" />
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Управление / Контроллеры</span>
          </div>
          {needController ? (
            controllers.length > 0 ? (
              <div className="space-y-2 mt-2">
                {controllers.slice(0, 3).map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-[var(--text-secondary)]">{c.name}</span>
                    {c.price && <span className="text-[var(--text-muted)] text-xs">{Math.round(c.price).toLocaleString('ru')} ₽</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[var(--text-muted)] mt-1">Контроллеры не найдены в каталоге</div>
            )
          ) : (
            <div className="text-sm text-[var(--text-muted)] mt-1 flex items-center gap-2">
              <Icon name="CheckCircle" size={14} className="text-[var(--success)]" />
              Регулировка не требуется — светильники без диммирования
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={handleNext} className="neon-btn text-white font-semibold px-8 py-3 rounded-xl">
            Финальная сборка →
          </button>
        </div>
      </div>
    </div>
  );
}
