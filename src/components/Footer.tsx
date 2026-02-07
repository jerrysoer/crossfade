export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <p className="font-[family-name:var(--font-playfair)] text-lg text-[var(--text-primary)]">
              Cross<span className="cross-slash">/</span>Fade
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Where the stage meets the screen
            </p>
          </div>

          {/* Attribution — TMDB required */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span>Film data from</span>
              <a
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--text-secondary)] transition-colors"
              >
                TMDB
              </a>
              <span className="text-[var(--border)]">|</span>
              <span>Music data from</span>
              <a
                href="https://www.discogs.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--text-secondary)] transition-colors"
              >
                Discogs
              </a>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] opacity-60">
              This product uses the TMDB API but is not endorsed or certified by
              TMDB.
            </p>
          </div>

          {/* Credits */}
          <div className="text-center md:text-right text-xs text-[var(--text-muted)]">
            <p>
              Powered by{" "}
              <a
                href="https://www.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors"
              >
                Claude
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
