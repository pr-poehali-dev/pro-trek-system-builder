import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminScreensTab from '@/components/AdminScreensTab';
import Icon from '@/components/ui/icon';
import { seedDemo } from '@/lib/api';

const SUPPLIERS = [
  { code: 'arlight', name: 'Arlight', note: 'MAG-45 (48В) + TRACK-4TR (220В)', statusLabel: 'Ожидает доступ из ЛК', statusColor: '#f59e0b' },
  { code: 'ego', name: 'EGO Lighting', note: 'EGO-TRACK-48 + EGO-TRACK-220', statusLabel: 'Demo-данные', statusColor: '#8b5cf6' },
];

const TABS = [
  { key: 'screens',  label: 'Экраны',          icon: 'Image'     },
  { key: 'supplier', label: 'Поставщик',        icon: 'Building2' },
  { key: 'upload',   label: 'Файлы каталога',   icon: 'Upload'    },
  { key: 'demo',     label: 'Демо-данные',      icon: 'Database'  },
];

export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'screens' | 'supplier' | 'upload' | 'demo'>('screens');
  const [supplier, setSupplier] = useState('arlight');
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

      {/* Хедер */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-0 z-40">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--neon)] flex items-center justify-center">
            <Icon name="Settings" size={14} className="text-white" />
          </div>
          <span className="text-base font-black text-[var(--text-primary)]">Настройки</span>
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
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={12} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Экраны ── */}
        {tab === 'screens' && <AdminScreensTab />}

        {/* ── Поставщик ── */}
        {tab === 'supplier' && (
          <div>
            <div className="text-sm text-[var(--text-muted)] mb-4">
              Выберите поставщика для расчётов. Переключение пересчитает спецификацию на шаге 5.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {SUPPLIERS.map(s => (
                <button
                  key={s.code}
                  onClick={() => setSupplier(s.code)}
                  className={`pro-card p-5 text-left transition-all ${
                    supplier === s.code
                      ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.06)] shadow-[0_0_16px_var(--neon-glow)]'
                      : 'hover:border-[rgba(61,90,254,0.4)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full transition-colors ${supplier === s.code ? 'bg-[var(--neon)]' : 'bg-[var(--border)]'}`} />
                      <span className="font-bold text-[var(--text-primary)]">{s.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${s.statusColor}22`, color: s.statusColor, border: `1px solid ${s.statusColor}44` }}>
                      {s.statusLabel}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] ml-4">{s.note}</div>
                  {supplier === s.code && (
                    <div className="mt-2 ml-4 text-[11px] text-[var(--neon)] font-semibold flex items-center gap-1">
                      <Icon name="Check" size={11} /> Активный
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="pro-card p-4 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-2">
                <Icon name="Clock" size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-400 mb-1">Arlight — ожидаем доступ из ЛК</div>
                  <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Как только Arlight выдаст логин/пароль — загрузите файлы каталога, прайса и остатков через вкладку «Файлы каталога».
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Файлы каталога ── */}
        {tab === 'upload' && (
          <div>
            <div className="pro-card p-4 mb-5">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={14} className="text-[var(--neon)] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Поставщик пришлёт файлы (JSON или Excel). Загрузите их здесь — система разберёт структуру, определит треки / соединители / светильники и разложит по категориям.
                </div>
              </div>
            </div>
            <div className="pro-card p-8 text-center text-[var(--text-muted)]">
              <Icon name="Upload" size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">Функция загрузки каталога появится после получения доступа от Arlight</div>
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
                  <div className="font-bold text-sm text-[var(--text-primary)] mb-1">Загрузить демо-данные</div>
                  <div className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                    Заполняет базу тестовыми товарами для проверки работы калькулятора без реального каталога.
                  </div>
                  <button
                    onClick={handleSeedDemo}
                    disabled={seedLoading}
                    className="neon-btn text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {seedLoading ? (
                      <><span className="animate-spin inline-block">⚡</span> Загружаю...</>
                    ) : (
                      <><Icon name="Zap" size={14} /> Загрузить демо</>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {seedResult && (
              <div className="pro-card p-4 border-green-500/30 bg-green-500/5 animate-fadein">
                <div className="flex items-center gap-2 text-green-400 font-semibold text-sm mb-2">
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