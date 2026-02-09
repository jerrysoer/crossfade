interface PanelDotsProps {
  activeIndex: number;
  count?: number;
}

const LABELS = ["Film", "", "Music"];

export default function PanelDots({ activeIndex, count = 3 }: PanelDotsProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none z-10">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {LABELS[i] && i === activeIndex && (
            <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[var(--accent-red)] animate-fade-in">
              {LABELS[i]}
            </span>
          )}
          <div
            className={`rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-6 h-2 bg-[var(--accent-red)]"
                : "w-2 h-2 bg-[var(--border-dark)]"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
