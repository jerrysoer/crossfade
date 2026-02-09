export default function FeedLoadingSkeleton() {
  return (
    <div className="feed-card flex flex-col items-center justify-center px-6 bg-[var(--background)]">
      {/* Photo skeleton */}
      <div className="w-28 h-28 rounded-full bg-[var(--surface-elevated)] animate-shimmer mb-5" />

      {/* Name skeleton */}
      <div className="h-7 w-48 bg-[var(--surface-elevated)] animate-shimmer rounded mb-3" />

      {/* Direction label skeleton */}
      <div className="h-3 w-24 bg-[var(--surface-elevated)] animate-shimmer rounded mb-6" />

      {/* Bio grid skeleton */}
      <div className="w-full max-w-[320px] grid grid-cols-2 gap-px bg-[var(--border)] rounded-lg overflow-hidden mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--surface)] px-3 py-4">
            <div className="h-2 w-12 bg-[var(--surface-elevated)] animate-shimmer rounded mb-2" />
            <div className="h-3 w-20 bg-[var(--surface-elevated)] animate-shimmer rounded" />
          </div>
        ))}
      </div>

      {/* Narrative skeleton */}
      <div className="w-full max-w-[300px] space-y-2 mb-6 px-4">
        <div className="h-3 w-full bg-[var(--surface-elevated)] animate-shimmer rounded" />
        <div className="h-3 w-5/6 bg-[var(--surface-elevated)] animate-shimmer rounded" />
        <div className="h-3 w-4/6 bg-[var(--surface-elevated)] animate-shimmer rounded" />
      </div>

      {/* Loading text */}
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)]"
              style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <span className="text-xs">Discovering...</span>
      </div>
    </div>
  );
}
