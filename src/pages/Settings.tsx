import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminScreensTab from '@/components/AdminScreensTab';
import Icon from '@/components/ui/icon';
import { seedDemo } from '@/lib/api';

const TABS = [
  { key: 'screens',   label: 'Экраны',          icon: 'Image'     },
  { key: 'suppliers', label: 'Поставщики',       icon: 'Building2' },
  { key: 'upload',    label: 'Файлы каталога',   icon: 'Upload'    },
  { key: 'demo',      label: 'Демо-данные',      icon: 'Database'  },
];

const SUPPLIERS = [
  {
    code: 'arlight',
    name: 'Arlight',
    color: '#3d5afe',
    logo: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/67102236-293c-4925-b47f-e13686e93b7e.jpg',
    status: 'waiting',
    statusLabel: 'Ожидает доступ из ЛК',
    statusColor: '#f59e0b',
    systems: [
      { name: 'TRACK-4TR (220В)', types: ['Универсальные', 'Гарпунные', 'На поверхность', 'Для гипсокартона'], voltage: '220В', wires: '4-проводная' },
      { name: 'MAG-45 (48В)',     types: ['Универсальные', 'На поверхность', 'Для гипсокартона'],              voltage: '48В',  wires: 'Маломощная' },
      { name: 'MAG-20 (24В)',     types: ['Универсальные', 'На поверхность'],                                  voltage: '24В',  wires: 'Компактная' },
    ],
  },
  {
    code: 'ego',
    name: 'EGO Lighting',
    color: '#f59e0b',
    logo: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/9e2f7080-ba25-407a-a4ab-2a89623e9876.jpg',
    status: 'demo',
    statusLabel: 'Demo-данные',
    statusColor: '#8b5cf6',
    systems: [
      { name: 'EGO Track System', types: ['Универсальные', 'Гарпунные', 'На поверхность'], voltage: '220В', wires: '4-проводная' },
    ],
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'screens' | 'suppliers' | 'upload' | 'demo'>('screens');
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<{ ok: boolean; total: number } | null>(null);

  const handleSeedDemo = async () => {
    setSeedLoading(true);
    setSeedResult(null);
    try { const r = await seedDemo(); setSeedResult(r); } catch (e) { void e; }
    setSeedLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">

      <header className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-0 z-40">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-white/50 hover:text-[var(--neon)] transition-colors">
          <Icon name="ArrowLeft" size={16} /> Назад
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--neon)] flex items-center justify-center shadow-[0_0_12px_var(--neon-glow)]">
            <Icon name="Settings" size={14} className="text-white" />
          </div>
          <span className="text-base font-black text-white">Настройки</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Вкладки */}
        <div className="flex gap-1 mb-6 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)]">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key
                  ? 'bg-[var(--neon)] text-white shadow-[0_0_12px_var(--neon-glow)]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={12} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Экраны ── */}
        {tab === 'screens' && <AdminScreensTab />}

        {/* ── Поставщики ── */}
        {tab === 'suppliers' && (
          <div className="space-y-4">
            <div className="pro-card p-4 flex items-start gap-3">
              <Icon name="Info" size={14} className="text-[var(--neon)] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-white/60 leading-relaxed">
                На шаге 5 клиент видит <strong className="text-white">все системы всех поставщиков</strong> для выбранного типа установки и сам выбирает подходящую. Здесь — справочник: какой поставщик, какие системы, для каких типов.
              </div>
            </div>

            {SUPPLIERS.map(s => (
              <div key={s.code} className="pro-card overflow-hidden">
                {/* Шапка поставщика */}
                <div className="flex items-center gap-4 p-4 border-b border-[var(--border)]" style={{ background: `linear-gradient(135deg, ${s.color}10, transparent)` }}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--border)] flex-shrink-0">
                    <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-white text-base">{s.name}</div>
                    <div className="text-xs text-white/40 mt-0.5">{s.systems.length} системы в каталоге</div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: `${s.statusColor}22`, color: s.statusColor, border: `1px solid ${s.statusColor}44` }}>
                    {s.statusLabel}
                  </span>
                </div>

                {/* Системы */}
                <div className="divide-y divide-[var(--border)]">
                  {s.systems.map((sys, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white">{sys.name}</div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {sys.types.map(t => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-white/50">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${s.color}22`, color: s.color }}>
                          {sys.voltage}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-white/40 border border-[var(--border)]">
                          {sys.wires}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {s.status === 'waiting' && (
                  <div className="px-4 py-3 bg-amber-500/5 border-t border-amber-500/20 flex items-center gap-2">
                    <Icon name="Clock" size={13} className="text-amber-400 flex-shrink-0" />
                    <span className="text-[11px] text-amber-400/80">Ожидаем доступ из ЛК. После получения — загрузите прайс и остатки во вкладке «Файлы каталога».</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Файлы каталога ── */}
        {tab === 'upload' && (
          <div>
            <div className="pro-card p-4 mb-4 flex items-start gap-3">
              <Icon name="Info" size={14} className="text-[var(--neon)] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-white/60 leading-relaxed">
                Поставщик пришлёт файлы (JSON или Excel). Загрузите их здесь — система разберёт структуру и разложит по категориям.
              </div>
            </div>
            <div className="pro-card p-10 text-center">
              <Icon name="Upload" size={36} className="mx-auto mb-3 text-white/20" />
              <div className="text-sm text-white/40">Функция загрузки появится после получения доступа от Arlight</div>
            </div>
          </div>
        )}

        {/* ── Демо-данные ── */}
        {tab === 'demo' && (
          <div>
            <div className="pro-card p-5 mb-4">
              <div className="flex items-start gap-3">
                <Icon name="Database" size={16} className="text-[var(--neon)] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-white mb-1">Загрузить демо-данные</div>
                  <div className="text-xs text-white/50 mb-4 leading-relaxed">
                    Заполняет базу тестовыми товарами для проверки работы калькулятора без реального каталога.
                  </div>
                  <button
                    onClick={handleSeedDemo}
                    disabled={seedLoading}
                    className="neon-btn text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {seedLoading
                      ? <><span className="animate-spin">⚡</span> Загружаю...</>
                      : <><Icon name="Zap" size={14} /> Загрузить демо</>
                    }
                  </button>
                </div>
              </div>
            </div>
            {seedResult && (
              <div className="pro-card p-4 border-green-500/30 bg-green-500/5 animate-fadein">
                <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                  <Icon name="CheckCircle" size={16} /> Готово — добавлено {seedResult.total} товаров
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
