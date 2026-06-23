import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getSupplierSystems, saveSupplierSystem } from '@/lib/api';

const ALL_MOUNT_TYPES = [
  { id: 'surface',  label: 'Универсальные'    },
  { id: 'harpoon',  label: 'Гарпунные'        },
  { id: 'other',    label: 'На поверхность'   },
  { id: 'built_in', label: 'Для гипсокартона' },
];

type SystemDef = { name: string; types: string[]; voltage: string; wires: string };
type SupplierDef = { code: string; name: string; color: string; logo: string; status: string; statusLabel: string; statusColor: string; systems: SystemDef[] };

const ARLIGHT_LOGO = 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/67102236-293c-4925-b47f-e13686e93b7e.jpg';

const SUPPLIERS_DEFAULT: SupplierDef[] = [
  {
    code: 'arlight', name: 'Arlight', color: '#3d5afe', logo: ARLIGHT_LOGO,
    status: 'waiting', statusLabel: 'Ожидает доступ из ЛК', statusColor: '#f59e0b',
    systems: [
      { name: 'TRACK-4TR (220В)', types: ['surface', 'harpoon'],  voltage: '220В', wires: '4-проводная' },
      { name: 'MAG-45 (48В)',     types: ['surface', 'built_in'], voltage: '48В',  wires: 'Маломощная'  },
      { name: 'MAG-20 (24В)',     types: ['surface'],             voltage: '24В',  wires: 'Компактная'  },
    ],
  },
];

export default function SuppliersTab({ onGoToCategories }: { onGoToCategories: (seriesName: string) => void }) {
  const [suppliers, setSuppliers] = useState<SupplierDef[]>(SUPPLIERS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({ arlight: true });
  const [dropOpen, setDropOpen] = useState<string | null>(null);

  useEffect(() => {
    getSupplierSystems().then(data => {
      if (Object.keys(data).length > 0) {
        setSuppliers(prev => prev.map(s => {
          const dbSup = data[s.code];
          if (!dbSup) return s;
          return { ...s, systems: s.systems.map((sys, i) => dbSup[i] ? { ...sys, types: dbSup[i].types } : sys) };
        }));
      }
      setLoading(false);
    });
  }, []);

  const toggleType = (code: string, idx: number, typeId: string) => {
    setSuppliers(prev => {
      const next = prev.map(s => {
        if (s.code !== code) return s;
        return {
          ...s,
          systems: s.systems.map((sys, i) => {
            if (i !== idx) return sys;
            const has = sys.types.includes(typeId);
            return { ...sys, types: has ? sys.types.filter(t => t !== typeId) : [...sys.types, typeId] };
          }),
        };
      });
      const sup = next.find(s => s.code === code)!;
      const sys = sup.systems[idx];
      saveSupplierSystem({ supplier_code: code, system_index: idx, system_name: sys.name, voltage: sys.voltage, wires: sys.wires, types: sys.types });
      return next;
    });
  };

  if (loading) return <div className="py-16 text-center text-white/20 text-sm animate-pulse">Загружаю...</div>;

  return (
    <div className="space-y-1">
      {suppliers.map(s => (
        <div key={s.code}>
          <button
            onClick={() => setOpen(p => ({ ...p, [s.code]: !p[s.code] }))}
            className="w-full flex items-center gap-4 py-4 hover:bg-white/3 rounded-xl px-3 -mx-3 transition-colors group"
          >
            <img src={s.logo} alt={s.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            <span className="text-base font-bold text-white">{s.name}</span>
            <span className="text-sm text-white/30">{s.systems.length} системы</span>
            <span className="ml-auto text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: `${s.statusColor}18`, color: s.statusColor }}>
              {s.statusLabel}
            </span>
            <Icon name={open[s.code] ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-white/30 group-hover:text-white/60 flex-shrink-0" />
          </button>

          {open[s.code] && (
            <div className="ml-14 mb-2">
              {s.systems.map((sys, idx) => {
                const dropKey = `${s.code}-${idx}`;
                const isDropOpen = dropOpen === dropKey;
                const activeTypes = ALL_MOUNT_TYPES.filter(mt => sys.types.includes(mt.id));
                return (
                  <div key={idx} className="flex items-center gap-3 py-3 border-t border-white/5 first:border-0 group/row">
                    <button
                      onClick={() => onGoToCategories(sys.name)}
                      className="flex items-center gap-2 w-48 flex-shrink-0 text-left hover:text-[var(--neon)] transition-colors group/name"
                    >
                      <span className="text-sm font-semibold text-white group-hover/name:text-[var(--neon)] whitespace-nowrap transition-colors">{sys.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded text-[var(--neon)] bg-[var(--neon)]/10 font-semibold whitespace-nowrap">{sys.voltage}</span>
                      <Icon name="ChevronRight" size={13} className="text-white/20 group-hover/name:text-[var(--neon)] transition-colors flex-shrink-0" />
                    </button>

                    <div className="relative flex-1">
                      <button
                        onClick={() => setDropOpen(isDropOpen ? null : dropKey)}
                        className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
                      >
                        <span className="text-xs text-white/50 flex-1 truncate">
                          {activeTypes.length === 0
                            ? 'Типы не выбраны'
                            : activeTypes.map(mt => mt.label).join(', ')
                          }
                        </span>
                        <span className="text-[10px] text-white/25 flex-shrink-0">{activeTypes.length}/{ALL_MOUNT_TYPES.length}</span>
                        <Icon name={isDropOpen ? 'ChevronUp' : 'ChevronDown'} size={12} className="text-white/25 flex-shrink-0" />
                      </button>

                      {isDropOpen && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl p-1 min-w-48">
                          {ALL_MOUNT_TYPES.map(mt => {
                            const active = sys.types.includes(mt.id);
                            return (
                              <button
                                key={mt.id}
                                onClick={() => toggleType(s.code, idx, mt.id)}
                                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-left"
                              >
                                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${active ? 'bg-[var(--neon)] border-[var(--neon)]' : 'border-white/20'}`}>
                                  {active && <Icon name="Check" size={10} className="text-white" />}
                                </div>
                                {mt.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {s.status === 'waiting' && (
                <div className="flex items-center gap-2 py-3 text-amber-400/60 text-xs border-t border-white/5">
                  <Icon name="Clock" size={12} className="flex-shrink-0" />
                  <span>Ожидаем доступ из ЛК. После получения — загрузите данные во вкладке «Товары».</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
