import { ProjectState } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';

interface Props { state: ProjectState; next: (p?: Partial<ProjectState>) => void; totalSteps: number; }

const OPTIONS = [
  {
    id: 'track',
    title: 'Трековые системы',
    sub: 'Магнитные и трековые профили',
    icon: '⚡',
    img: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/4a443e29-20a7-4b96-bed2-bcae52679c39.png',
    gradient: 'from-blue-900/40 to-blue-950/80',
    badge: 'Конструктор',
    active: true,
  },
  {
    id: 'lighting',
    title: 'Освещение',
    sub: 'Светильники и лампы',
    icon: '💡',
    img: null,
    gradient: 'from-amber-900/20 to-amber-950/60',
    badge: 'Скоро',
    active: false,
  },
];

export default function Step1Start({ next, totalSteps }: Props) {
  return (
    <div className="animate-fadein">
      <ProgressBar current={1} total={totalSteps} label="Тип системы" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4 px-3 py-1 rounded-full border border-[var(--neon)] text-[var(--neon)] text-xs font-mono tracking-widest uppercase">
            PRO-TREK v1.0
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mb-3 leading-tight">
            Конструктор трековых<br />
            <span className="neon-text">систем освещения</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
            Соберите спецификацию трековой системы за 5 минут. Автоматический расчёт комплектующих от нескольких поставщиков.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => opt.active && next({ trackType: 'surface' })}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 text-left group ${
                opt.active
                  ? 'border-[var(--border)] hover:border-[var(--neon)] hover:shadow-[0_0_30px_var(--neon-glow)] cursor-pointer'
                  : 'border-[var(--border)] opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Image / gradient bg */}
              <div className={`h-44 bg-gradient-to-b ${opt.gradient} relative overflow-hidden`}>
                {opt.img && (
                  <img src={opt.img} alt={opt.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    opt.active ? 'badge-48v' : 'bg-[var(--border)] text-[var(--text-muted)]'
                  }`}>
                    {opt.badge}
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 text-2xl">{opt.icon}</div>
              </div>

              {/* Text */}
              <div className="p-4 bg-[var(--bg-card)]">
                <div className="font-bold text-[var(--text-primary)] text-base mb-0.5">{opt.title}</div>
                <div className="text-[var(--text-secondary)] text-xs">{opt.sub}</div>
                {opt.active && (
                  <div className="mt-3 text-[var(--neon)] text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Начать <span>→</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Suppliers marquee */}
        <div className="mt-12 text-center">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-4">Поставщики</div>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {['Arlight', 'EGO', 'Artelamp', 'Light Star', 'Novotech', 'Maytoni'].map(name => (
              <span key={name} className="text-[var(--text-muted)] text-xs font-semibold opacity-60 hover:opacity-100 hover:text-[var(--text-secondary)] transition-opacity">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
