import Image from "next/image";
import type { CrossoverDirection } from "@/lib/types";

interface NarrativeBlockProps {
  name: string;
  photoUrl: string | null;
  narrative: string;
  didYouKnow: string;
  crossoverDirection: CrossoverDirection;
  birthday: string | null;
  birthplace: string | null;
  deathday: string | null;
}

const DIRECTION_LABELS: Record<CrossoverDirection, string> = {
  "music-to-film": "Music to Film",
  "film-to-music": "Film to Music",
  simultaneous: "Dual Threat",
};

const ZODIAC_SIGNS: { name: string; symbol: string; start: [number, number]; end: [number, number] }[] = [
  { name: "Capricorn", symbol: "\u2651", start: [12, 22], end: [1, 19] },
  { name: "Aquarius", symbol: "\u2652", start: [1, 20], end: [2, 18] },
  { name: "Pisces", symbol: "\u2653", start: [2, 19], end: [3, 20] },
  { name: "Aries", symbol: "\u2648", start: [3, 21], end: [4, 19] },
  { name: "Taurus", symbol: "\u2649", start: [4, 20], end: [5, 20] },
  { name: "Gemini", symbol: "\u264A", start: [5, 21], end: [6, 20] },
  { name: "Cancer", symbol: "\u264B", start: [6, 21], end: [7, 22] },
  { name: "Leo", symbol: "\u264C", start: [7, 23], end: [8, 22] },
  { name: "Virgo", symbol: "\u264D", start: [8, 23], end: [9, 22] },
  { name: "Libra", symbol: "\u264E", start: [9, 23], end: [10, 22] },
  { name: "Scorpio", symbol: "\u264F", start: [10, 23], end: [11, 21] },
  { name: "Sagittarius", symbol: "\u2650", start: [11, 22], end: [12, 21] },
];

function getZodiacSign(month: number, day: number): { name: string; symbol: string } | null {
  for (const sign of ZODIAC_SIGNS) {
    const [sm, sd] = sign.start;
    const [em, ed] = sign.end;
    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) return sign;
    } else if (
      (month === sm && day >= sd) ||
      (month === em && day <= ed)
    ) {
      return sign;
    }
  }
  return null;
}

function formatBirthday(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function computeAge(birthday: string, deathday: string | null): number {
  const birth = new Date(birthday);
  const ref = deathday ? new Date(deathday) : new Date();
  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function isBirthdayToday(birthday: string): boolean {
  const now = new Date();
  const [, m, d] = birthday.split("-").map(Number);
  return now.getMonth() + 1 === m && now.getDate() === d;
}

export default function NarrativeBlock({
  name,
  photoUrl,
  narrative,
  didYouKnow,
  crossoverDirection,
  birthday,
  birthplace,
  deathday,
}: NarrativeBlockProps) {
  const parsedBirthday = birthday ? birthday.split("-").map(Number) : null;
  const zodiac = parsedBirthday ? getZodiacSign(parsedBirthday[1], parsedBirthday[2]) : null;
  const age = birthday ? computeAge(birthday, deathday) : null;
  const isBirthday = birthday ? isBirthdayToday(birthday) : false;

  return (
    <div className="flex flex-col items-center text-center max-w-[320px] lg:max-w-[280px]">
      {/* Person photo */}
      <div
        className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-5 border border-[var(--border)]"
        style={{ boxShadow: "var(--photo-shadow)" }}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--surface-elevated)] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[var(--text-muted)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 10-16 0" />
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <h2 className="font-[family-name:var(--font-lora)] text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight mb-2">
        {name}
      </h2>

      {/* Birthday greeting */}
      {isBirthday && (
        <p className="text-sm font-medium text-[var(--accent-red)] mb-1 animate-fade-in">
          Happy Birthday!
        </p>
      )}

      {/* Direction label */}
      <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--accent-red)] mb-4">
        {DIRECTION_LABELS[crossoverDirection]}
      </span>

      {/* Bio details grid */}
      {birthday && (
        <div className="w-full grid grid-cols-2 gap-px bg-[var(--border)] rounded-lg overflow-hidden mb-6">
          <div className="bg-[var(--surface)] px-3 py-2.5">
            <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[var(--text-muted)] mb-0.5">
              Birthday
            </p>
            <p className="text-xs text-[var(--text-primary)] font-medium">
              {formatBirthday(birthday)}
            </p>
          </div>
          <div className="bg-[var(--surface)] px-3 py-2.5">
            <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[var(--text-muted)] mb-0.5">
              Birth Sign
            </p>
            <p className="text-xs text-[var(--text-primary)] font-medium">
              {zodiac ? `${zodiac.symbol} ${zodiac.name}` : "—"}
            </p>
          </div>
          <div className="bg-[var(--surface)] px-3 py-2.5">
            <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[var(--text-muted)] mb-0.5">
              Birthplace
            </p>
            <p className="text-xs text-[var(--text-primary)] font-medium truncate">
              {birthplace || "—"}
            </p>
          </div>
          <div className="bg-[var(--surface)] px-3 py-2.5">
            <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[var(--text-muted)] mb-0.5">
              {deathday ? "Died at" : "Age"}
            </p>
            <p className="text-xs text-[var(--text-primary)] font-medium">
              {age !== null ? `${age} years old` : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Narrative quote */}
      <div className="connection-quote text-sm sm:text-base mb-6 px-4">
        {narrative}
      </div>

      {/* Did you know? */}
      {didYouKnow && (
        <div className="w-full bg-[var(--accent-red-dim)] border border-[var(--border)] rounded-lg px-5 py-4">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--accent-red)] mb-2">
            Did you know?
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {didYouKnow}
          </p>
        </div>
      )}
    </div>
  );
}
