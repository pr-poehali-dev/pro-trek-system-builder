import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminScreensTab from '@/components/AdminScreensTab';
import Icon from '@/components/ui/icon';
import SuppliersTab from '@/components/settings/SuppliersTab';
import CategoriesTab from '@/components/settings/CategoriesTab';
import ProductsTab from '@/components/settings/ProductsTab';

const TABS = [
  { key: 'screens',    label: 'Экраны',      icon: 'Image'     },
  { key: 'suppliers',  label: 'Поставщики',  icon: 'Building2' },
  { key: 'categories', label: 'Категории',   icon: 'Tag'       },
  { key: 'products',   label: 'Товары',      icon: 'Package'   },
];

export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'screens' | 'suppliers' | 'categories' | 'products'>('screens');
  const [drillSeriesId, setDrillSeriesId] = useState<number | undefined>();
  const [drillSeriesName, setDrillSeriesName] = useState<string | undefined>();
  const [drillCatKey, setDrillCatKey] = useState<string | undefined>();
  const [drillSeriesNameForCat, setDrillSeriesNameForCat] = useState<string | undefined>();

  const goToCategories = (seriesName: string) => {
    setDrillSeriesNameForCat(seriesName);
    setTab('categories');
  };

  const goToCat = (catKey: string, seriesName?: string) => {
    setDrillCatKey(catKey);
    setDrillSeriesName(seriesName);
    setDrillSeriesId(undefined);
    setTab('products');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="flex items-center gap-6 px-8 py-4 border-b border-white/6 sticky top-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm flex-shrink-0">
          <Icon name="ArrowLeft" size={15} /> Назад
        </button>
        <span className="text-base font-black text-white flex-shrink-0">Настройки</span>
        <div className="flex gap-1 bg-white/5 p-1 rounded-2xl">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                tab === t.key ? 'bg-[var(--neon)] text-white shadow-[0_0_16px_rgba(61,90,254,0.35)]' : 'text-white/40 hover:text-white/70'
              }`}>
              <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-8">
        {tab === 'screens'    && <AdminScreensTab />}
        {tab === 'suppliers'  && <SuppliersTab onGoToCategories={goToCategories} />}
        {tab === 'categories' && <CategoriesTab onGoToCat={goToCat} contextSeriesName={drillSeriesNameForCat} />}
        {tab === 'products'   && <ProductsTab initSeriesId={drillSeriesId} initSeriesName={drillSeriesName} initCatKey={drillCatKey} />}
      </div>
    </div>
  );
}
