import { useState, useRef } from 'react';
import { seedDemo } from '@/lib/api';
import Icon from '@/components/ui/icon';
import AdminScreensTab from '@/components/AdminScreensTab';

interface Props {
  onClose: () => void;
  onSupplierChange?: (code: string) => void;
  currentSupplier?: string;
}

const SUPPLIERS = [
  {
    code: 'arlight',
    name: 'Arlight',
    note: 'MAG-45 (48В) + TRACK-4TR (220В)',
    status: 'waiting_access',
    statusLabel: 'Ожидает доступ из ЛК',
    statusColor: '#f59e0b',
  },
];

// Типы файлов которые может прислать поставщик
const FILE_TYPES = [
  {
    key: 'catalog',
    label: 'Каталог товаров',
    desc: 'Основной файл — товары, описания, характеристики',
    ext: '.json',
    icon: 'Package',
    required: true,
  },
  {
    key: 'prices',
    label: 'Прайс-лист',
    desc: 'Файл с ценами по артикулу (появится позже)',
    ext: '.json / .xlsx / .csv',
    icon: 'DollarSign',
    required: false,
    pending: true,
  },
  {
    key: 'stock',
    label: 'Остатки склада',
    desc: 'Файл с наличием по артикулу (появится позже)',
    ext: '.json / .xml / .csv',
    icon: 'Warehouse',
    required: false,
    pending: true,
  },
];

export default function AdminPanel({ onClose, onSupplierChange, currentSupplier = 'arlight' }: Props) {
  const [supplier, setSupplier]       = useState(currentSupplier);
  const [tab, setTab]                 = useState<'screens' | 'supplier' | 'upload' | 'demo'>('screens');
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult]   = useState<{ ok: boolean; total: number; results: Record<string, { added: number }> } | null>(null);
  const [uploadResult, setUploadResult] = useState<Record<string, { file: string; status: string }>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleSupplierSelect = (code: string) => {
    setSupplier(code);
    onSupplierChange?.(code);
  };

  const handleSeedDemo = async () => {
    setSeedLoading(true);
    setSeedResult(null);
    try {
      const r = await seedDemo();
      setSeedResult(r);
    } catch {
      // ignore
    }
    setSeedLoading(false);
  };

  // Симуляция обработки файла (до появления реального API)
  const handleFileSelect = (key: string, file: File) => {
    setUploadResult(prev => ({
      ...prev,
      [key]: { file: file.name, status: 'processing' },
    }));
    // Имитируем обработку
    setTimeout(() => {
      setUploadResult(prev => ({
        ...prev,
        [key]: { file: file.name, status: 'ready' },
      }));
    }, 1500);
  };

  const TABS = [
    { key: 'screens',  label: 'Экраны',         icon: 'Image'      },
    { key: 'supplier', label: 'Поставщик',       icon: 'Building2'  },
    { key: 'upload',   label: 'Файлы каталога',  icon: 'Upload'     },
    { key: 'demo',     label: 'Демо-данные',     icon: 'Database'   },
  ];

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-card)] animate-fadein">
      <div className="max-w-3xl mx-auto">

        {/* Tab header */}
        <div className="flex items-center border-b border-[var(--border)] px-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all -mb-px ${
                tab === t.key
                  ? 'border-[var(--neon)] text-[var(--neon)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={12} />
              {t.label}
            </button>
          ))}
          <div className="ml-auto py-3">
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        <div className="p-4">

          {/* ── Tab: Экраны ── */}
          {tab === 'screens' && <AdminScreensTab />}

          {/* ── Tab: Поставщик ── */}
          {tab === 'supplier' && (
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-3">
                Выберите поставщика для расчётов. Переключение пересчитает спецификацию на шаге 5.
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SUPPLIERS.map(s => (
                  <button
                    key={s.code}
                    onClick={() => handleSupplierSelect(s.code)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      supplier === s.code
                        ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.08)] shadow-[0_0_12px_var(--neon-glow)]'
                        : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${supplier === s.code ? 'bg-[var(--neon)]' : 'bg-[var(--border)]'}`} />
                        <span className="text-sm font-bold text-[var(--text-primary)]">{s.name}</span>
                      </div>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ backgroundColor: `${s.statusColor}22`, color: s.statusColor, border: `1px solid ${s.statusColor}44` }}
                      >
                        {s.statusLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] ml-4">{s.note}</div>
                    {supplier === s.code && (
                      <div className="mt-2 ml-4 text-[10px] neon-text font-semibold flex items-center gap-1">
                        <Icon name="Check" size={10} /> Активный
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Статус подключения Arlight */}
              <div className="mt-4 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-2">
                  <Icon name="Clock" size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-amber-400 mb-1">Arlight — ожидаем доступ из ЛК</div>
                    <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Как только Arlight выдаст логин/пароль — загрузите файлы каталога, прайса и остатков через вкладку
                      <button onClick={() => setTab('upload')} className="text-[var(--neon)] ml-1 hover:underline">«Файлы каталога»</button>.
                      Система автоматически разложит всё по категориям и калькулятор заработает с реальными данными.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Файлы каталога ── */}
          {tab === 'upload' && (
            <div>
              <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] mb-4">
                <Icon name="Info" size={14} className="text-[var(--neon)] flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Поставщик пришлёт файлы (обычно JSON или Excel). Загрузите их здесь — система сама
                  разберёт структуру, определит треки / соединители / светильники / БП и разложит по категориям.
                  Цены и остатки — отдельный файл, подключим когда Arlight даст доступ.
                </div>
              </div>

              {/* Выбор поставщика для загрузки */}
              <div className="flex gap-2 mb-4">
                {SUPPLIERS.map(s => (
                  <button
                    key={s.code}
                    onClick={() => setSupplier(s.code)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                      supplier === s.code
                        ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.1)] text-[var(--text-primary)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
                <span className="text-[10px] text-[var(--text-muted)] self-center ml-1">— файлы для этого поставщика</span>
              </div>

              {/* Карточки файлов */}
              <div className="space-y-3">
                {FILE_TYPES.map(ft => {
                  const uploaded = uploadResult[ft.key];
                  return (
                    <div
                      key={ft.key}
                      className={`p-4 rounded-xl border transition-all ${
                        ft.pending
                          ? 'border-dashed border-[var(--border)] opacity-60'
                          : uploaded?.status === 'ready'
                          ? 'border-[var(--success)] bg-[rgba(0,230,118,0.04)]'
                          : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            ft.pending ? 'bg-[var(--border)]' : 'bg-[rgba(61,90,254,0.1)]'
                          }`}>
                            <Icon
                              name={ft.icon as Parameters<typeof Icon>[0]['name']}
                              size={14}
                              className={ft.pending ? 'text-[var(--text-muted)]' : 'text-[var(--neon)]'}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[var(--text-primary)]">{ft.label}</span>
                              {ft.required && (
                                <span className="text-[9px] text-[var(--neon)] border border-[var(--neon)] px-1.5 py-0.5 rounded font-bold">обязательный</span>
                              )}
                              {ft.pending && (
                                <span className="text-[9px] text-amber-400 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded font-semibold">ожидается</span>
                              )}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{ft.desc}</div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">{ft.ext}</div>
                          </div>
                        </div>

                        {/* Статус / кнопка загрузки */}
                        <div className="flex-shrink-0 ml-3">
                          {uploaded?.status === 'processing' && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                              <span className="animate-spin inline-block">⚡</span> Обрабатываю...
                            </div>
                          )}
                          {uploaded?.status === 'ready' && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--success)]">
                              <Icon name="CheckCircle" size={14} />
                              <div>
                                <div className="font-semibold">Загружен</div>
                                <div className="text-[10px] text-[var(--text-muted)] max-w-[120px] truncate">{uploaded.file}</div>
                              </div>
                            </div>
                          )}
                          {!uploaded && !ft.pending && (
                            <>
                              <input
                                type="file"
                                accept=".json,.xlsx,.csv,.xml"
                                className="hidden"
                                ref={el => { fileRefs.current[ft.key] = el; }}
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) handleFileSelect(ft.key, f);
                                }}
                              />
                              <button
                                onClick={() => fileRefs.current[ft.key]?.click()}
                                className="flex items-center gap-1.5 text-xs border border-[var(--border)] text-[var(--text-secondary)] px-3 py-2 rounded-lg hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all"
                              >
                                <Icon name="Upload" size={12} /> Загрузить файл
                              </button>
                            </>
                          )}
                          {!uploaded && ft.pending && (
                            <div className="text-[11px] text-[var(--text-muted)] text-right">
                              <div>Появится позже</div>
                              <div className="text-[10px]">от поставщика</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Прогресс после загрузки */}
                      {uploaded?.status === 'ready' && !ft.pending && (
                        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                          <Icon name="Info" size={11} />
                          <span>
                            Файл принят. Для применения нажмите
                            <button className="text-[var(--neon)] ml-1 hover:underline">«Применить к каталогу»</button>
                            — система разберёт структуру и занесёт данные в базу.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Кнопка применить — появляется если хотя бы 1 файл загружен */}
              {Object.values(uploadResult).some(r => r.status === 'ready') && (
                <div className="mt-4 p-3 rounded-xl border border-[var(--neon)] bg-[rgba(61,90,254,0.06)] flex items-center justify-between animate-fadein">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">Файлы готовы к обработке</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Загружено: {Object.values(uploadResult).filter(r => r.status === 'ready').length} файл(а)
                    </div>
                  </div>
                  <button
                    className="neon-btn text-white text-xs px-5 py-2 rounded-lg font-semibold flex items-center gap-1.5"
                    onClick={() => alert('Обработка файлов — в разработке. Скоро появится!')}
                  >
                    <Icon name="Play" size={12} /> Применить к каталогу
                  </button>
                </div>
              )}

              <div className="mt-4 text-[10px] text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-3">
                <span className="font-semibold text-[var(--text-secondary)]">Как это работает:</span>
                {' '}Получили файл от Arlight (или другого поставщика) → загружаете сюда →
                система автоматически определяет треки, соединители, заглушки, светильники, БП →
                раскладывает по категориям → калькулятор работает с актуальными данными.
                Когда придёт прайс и остатки — загружаете отдельно, цены обновятся без потери каталога.
              </div>
            </div>
          )}

          {/* ── Tab: Демо-данные ── */}
          {tab === 'demo' && (
            <div>
              <div className="flex items-start gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] mb-4">
                <Icon name="FlaskConical" size={14} className="text-[var(--neon)] flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Заполняет базу демо-товарами для тестирования всего флоу.
                  <strong className="text-[var(--text-primary)]"> Arlight: 38 товаров</strong> + <strong className="text-[var(--text-primary)]">EGO Lighting: 31 товар</strong>.
                  Можно запустить повторно — данные обновятся.
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Треки',     count: '0.5–3м, 48В/220В', icon: 'Minus'   },
                  { label: 'Соедин.',   count: 'угол/прямой/гибкий', icon: 'Link'  },
                  { label: 'Светильн.', count: '8–20Вт, DALI',      icon: 'Zap'    },
                  { label: 'БП',        count: '25–120Вт, DALI',    icon: 'Battery'},
                ].map(item => (
                  <div key={item.label} className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                    <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} size={14} className="text-[var(--neon)] mx-auto mb-1" />
                    <div className="text-[11px] font-semibold text-[var(--text-primary)]">{item.label}</div>
                    <div className="text-[9px] text-[var(--text-muted)] leading-tight mt-0.5">{item.count}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSeedDemo}
                disabled={seedLoading}
                className="neon-btn text-white text-sm px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 w-full justify-center"
              >
                <Icon name="Database" size={14} />
                {seedLoading ? '⏳ Заполняю базу...' : '🚀 Загрузить демо-данные (Arlight + EGO)'}
              </button>

              {seedResult && (
                <div className="mt-3 p-3 rounded-lg bg-[rgba(0,230,118,0.05)] border border-[rgba(0,230,118,0.2)] animate-fadein">
                  <div className="text-sm text-[var(--success)] font-semibold mb-2">✅ Готово!</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(seedResult.results).map(([k, v]) => (
                      <div key={k} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                        <strong>{k}:</strong> {v.added} товаров
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-2">
                    Итого: {seedResult.total} товаров · теперь пройдите конструктор для теста
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}