# CrossFade — Product Requirements Document

> **Where the Stage Meets the Screen**

**Version**: 1.1
**Date**: 2026-02-07
**Status**: Phase 1 Complete
**Project Location**: `claude-learning/crossfade/`

---

## 1. Executive Summary

### Problem Statement

Entertainment fans constantly stumble upon surprising crossover facts — "Wait, Idris Elba DJs?" or "Scarlett Johansson has an album?" — but there's no dedicated, beautifully designed tool to explore and discover these crossover talents. The intersection of music and film careers is a rich, underexplored space full of surprising stories.

### Solution Overview

**CrossFade** is a fun, AI-powered entertainment discovery app that reveals the hidden connections between music and film. Users can explore musicians who act, actors who sing, and the fascinating stories behind why creative people cross between these worlds. Every result is backed by real data from TMDB (filmography) and Discogs (discography), enriched with Claude AI storytelling.

### Business Impact (Portfolio Context)

- Demonstrates AI-powered data enrichment with multiple external APIs
- Showcases editorial-quality design with real entertainment data
- Creates shareable, social-ready content (OG images, result cards)
- Highlights full-stack Next.js skills with a polished, deployable product

### Existing Assets

The project already has a solid foundation from a previous "mood pairing" concept:
- **Stack**: Next.js 16, React 19, Tailwind v4, TypeScript
- **APIs**: TMDB integration (movies), Discogs integration (music/albums), Anthropic SDK (Claude AI)
- **Design system**: Dark cinematic theme — gold (#D4A853) + warm (#C75B39) on dark (#0A0A08), Playfair Display + Inter fonts, film grain texture
- **Components**: Hero, ResultCard, MovieCard, AlbumCard, ConnectionText, ShareButton, LoadingState, OG image generator
- **Infrastructure**: @vercel/og for social sharing, Zod validation, rate-limited Discogs client with caching

Many of these components and integrations can be repurposed for the new crossover discovery concept.

---

## 2. Product Vision

### Tagline

**"Where the Stage Meets the Screen"**

### Core Concept

CrossFade reveals the surprising double lives of creative people. Every card tells a story: a musician's breakout film role, an actor's secret album, the moment someone decided to cross the divide. It's entertainment discovery designed to make you say "I had no idea."

### What CrossFade Is NOT

- Not a comprehensive database (that's IMDb/Discogs)
- Not a recommendation engine ("watch this because you liked that")
- Not a music player or film streaming service
- Not a social network

### What CrossFade IS

- A discovery tool — surface surprising crossover facts
- A storytelling platform — AI-written narratives about why people crossed over
- A shareable experience — beautiful cards you want to post
- A vibe — the whole thing should feel like flipping through a well-curated magazine

---

## 3. Target Users

### Primary Persona: The Culture Browser

- **Who**: Entertainment enthusiasts (20-45) who consume both music and film
- **Behavior**: Scrolls through TikTok/Reddit rabbit holes, loves "did you know?" content
- **Motivation**: Discovery and surprise — they want to learn something new and share it
- **Job-to-be-Done**: "Help me discover surprising connections between music and film so I can feel culturally informed and share interesting facts"

### Secondary Persona: The Portfolio Reviewer

- **Who**: Hiring managers, tech leads, fellow developers
- **Behavior**: Evaluating technical skill through project quality
- **Motivation**: Assess full-stack ability, design sensibility, API integration skills
- **Job-to-be-Done**: "Show me a polished, well-architected project that demonstrates real engineering skill"

---

## 4. User Experience & Flows

### 4.1 Primary Flow: Explore a Crossover

```
Landing Page → Browse/Search → Select Artist → View Crossover Profile → Share
```

1. **Landing page**: Hero with tagline, featured crossover of the day, quick-access categories
2. **Discovery**: User browses curated lists OR searches for a specific person
3. **Crossover profile**: Full card showing their music career + film career side by side, with AI-written narrative
4. **Share**: One-click share with auto-generated OG image

### 4.2 Secondary Flow: Random Discovery

```
Landing Page → "Surprise Me" → View Random Crossover → Share or Get Another
```

1. User clicks "Surprise Me" button
2. Claude AI selects a surprising crossover talent
3. Full profile card appears with data from TMDB + Discogs
4. User can share or hit "Another" for a new discovery

### 4.3 Tertiary Flow: Category Browsing

```
Landing Page → Select Category → Browse List → Select Artist → View Profile
```

Categories (12 in prompt, 180+ artists total):
- **Rappers → Hollywood** (28): Ice Cube, Common, Mos Def, Method Man, Ludacris, 50 Cent, Childish Gambino, Eminem, LL Cool J, Drake...
- **Pop/R&B Stars in Film** (19): Rihanna, Beyonce, Justin Timberlake, Janelle Monae, Madonna, Taylor Swift...
- **Disney Channel Alumni** (20): Miley Cyrus, Selena Gomez, Zendaya, Demi Lovato, Olivia Rodrigo, Sabrina Carpenter...
- **Nickelodeon Alumni** (8): Ariana Grande, Victoria Justice, Miranda Cosgrove, Drake Bell...
- **Rock/Alt Musicians Who Act** (22): David Bowie, Tom Waits, Bjork, Jack Black, Meat Loaf, Flea...
- **Country Crossovers** (6): Tim McGraw, Willie Nelson, Dolly Parton, Kris Kristofferson...
- **Actors Who Released Music** (41): Bruce Willis, Scarlett Johansson, Jeff Bridges, Keanu Reeves, Robert Downey Jr, Hugh Laurie, Jeff Goldblum...
- **Jazz/Classical Crossovers** (5): Woody Allen, Harry Connick Jr, Jamie Foxx...
- **International** (7): Jackie Chan, Rain, IU, Vanessa Paradis...
- **Legends in Both** (21): Frank Sinatra, Barbra Streisand, Elvis Presley, Jennifer Lopez, Lady Gaga, Cher...
- **Broadway/TV Musical** (7): Lea Michele, Mandy Moore, Nick Jonas...
- Plus any artist not on the list with real credits in both worlds

---

## 5. Functional Requirements

### 5.1 Core Features (MVP)

#### F1: Crossover Profile Card

**Description**: The centerpiece — a beautiful side-by-side card showing someone's music and film careers.

**User Story**: As a user, I want to see a person's music career and film career displayed side-by-side so that I can appreciate the breadth of their creative work.

**Acceptance Criteria**:
- Given a crossover artist is loaded, the card displays:
  - **Film side**: Top 3-5 notable film/TV roles, poster art (from TMDB), role descriptions
  - **Music side**: Top 3-5 albums/singles, cover art (from Discogs), genre tags
  - **AI narrative**: 2-3 sentence story about their crossover journey (from Claude)
  - **"Did you know?" fact**: One surprising detail about their dual career
- Card renders responsively (mobile-first, scales to desktop)
- Images fall back gracefully when TMDB/Discogs art is unavailable

#### F2: "Surprise Me" Random Discovery

**User Story**: As a user, I want to get a random crossover artist so that I can discover someone I didn't know had a dual career.

**Acceptance Criteria**:
- Given the user clicks "Surprise Me", Claude selects a crossover artist
- The system validates the pick against TMDB and Discogs (both must return results)
- A full profile card is rendered within 8 seconds
- The user can click "Another" to get a new random pick
- Claude avoids repeating the same artist within a session

#### F3: Search

**User Story**: As a user, I want to search for a specific person to see if they have a crossover career.

**Acceptance Criteria**:
- Given a search query, the system checks both TMDB and Discogs for the person
- If found in both: show the crossover profile card
- If found in only one: show a "not a crossfader" message with what was found
- If not found: show a friendly "no results" state
- Search is debounced (300ms) and handles typos gracefully

#### F4: Category Browsing

**User Story**: As a user, I want to browse crossover artists by category so that I can explore a specific type of crossover.

**Acceptance Criteria**:
- Landing page shows 4-6 category pills/cards
- Each category loads a curated list of 6-10 artists with thumbnail + name
- Clicking an artist loads their full crossover profile card
- Categories are pre-defined (not dynamically generated)

#### F5: Social Sharing

**User Story**: As a user, I want to share a crossover discovery as a beautiful card on social media.

**Acceptance Criteria**:
- Each crossover profile has a shareable URL (`/artist/[slug]`)
- OG image is auto-generated showing both career sides (reuse existing @vercel/og)
- "Copy Link" and "Share on X" buttons are available
- Shared links render a proper preview card on social platforms

### 5.2 Nice-to-Have Features (Post-MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Crossover Timeline** | Visual timeline showing when someone switched between music/film | Medium |
| **"Who Crossed Better?" Poll** | Fun interactive poll — were they better as musician or actor? | Low |
| **Daily Crossfader** | Auto-generated daily featured artist (cron + static generation) | Medium |
| **Genre Filter** | Filter by music genre or film genre within categories | Low |
| **Comparison Mode** | Compare two crossover artists side-by-side | Low |

---

## 6. Technical Architecture

### 6.1 Stack (Existing)

| Layer | Technology | Status |
|-------|------------|--------|
| Framework | Next.js 16 (App Router) | Existing |
| UI | React 19, Tailwind v4 | Existing |
| Language | TypeScript | Existing |
| AI | Anthropic SDK (Claude Sonnet 4.5) | Existing |
| Movie Data | TMDB API (v3) | Existing |
| Music Data | Discogs API | Existing |
| Validation | Zod | Existing |
| Social/OG | @vercel/og | Existing |
| Deployment | Vercel | Planned |

### 6.2 API Routes

| Route | Method | Description | Status |
|-------|--------|-------------|--------|
| `/api/discover` | POST | Random crossover discovery — Claude picks an artist, validated against TMDB + Discogs | Implemented |
| `/api/og` | GET | Dynamic OG image generation with person photo + direction badge | Implemented |
| `/api/search` | GET | Search for a person across TMDB + Discogs | Planned (Phase 2) |
| `/api/artist/[slug]` | GET | Full crossover profile with cached data | Planned (Phase 2) |

### 6.3 Data Flow (Implemented)

```
User clicks "Surprise Me"
       │
       ▼
  POST /api/discover { previousNames: [...] }
       │
       ├──► Claude AI (Sonnet 4.5): Pick a crossover artist
       │    Returns: name, narrative, didYouKnow, crossoverDirection,
       │    tmdbSearchQuery, discogsSearchQuery, alternateNames[]
       │
       ├──► Collect all search names (name + queries + alternates, deduplicated)
       │
       ├──► Parallel validation:
       │    ├── TMDB: searchPerson(allNames) or getPersonDetails(tmdbId)
       │    │   └── Multi-name search: tries each name until a match
       │    │
       │    └── Discogs: searchArtist(allNames) + name-validated matching
       │        └── Name normalization strips "(2)" suffixes, compares substrings
       │        └── Generates first-name variants ("Tyrese Gibson" → "Tyrese")
       │
       ├──► Retry logic (3 phases):
       │    1. If TMDB fails → ask Claude for a different artist
       │    2. If Discogs fails → try TMDB canonical name as fallback
       │    3. If Discogs has 0 releases → try name variants for alternate artist
       │
       ├──► Parallel credit fetch:
       │    ├── TMDB: /person/{id}/combined_credits (film + TV)
       │    │   └── Filters "Self" credits, weighted scoring: rating × min(votes/50, 1)
       │    │
       │    └── Discogs: /artists/{id}/releases (4-tier filtering)
       │        └── Tier 1: Main + master → Tier 2: Main → Tier 3: +TrackAppearance → Tier 4: +Producer/Appearance
       │
       ▼
  Merge & Transform → CrossoverArtist type
       │
       ▼
  Return to Client → Render CrossoverCard (3-column layout)
```

### 6.4 Key Types (Implemented)

```typescript
interface CrossoverArtist {
  name: string;
  slug: string;
  photoUrl: string | null;
  narrative: string;           // AI-generated crossover story
  didYouKnow: string;         // AI-generated surprising fact
  filmCredits: FilmCredit[];
  musicCredits: MusicCredit[];
  crossoverDirection: 'music-to-film' | 'film-to-music' | 'simultaneous';
}

interface FilmCredit {
  title: string;
  year: number;
  character: string;
  posterUrl: string | null;
  tmdbId: number;
  tmdbUrl: string;
  rating: number;
  mediaType?: 'movie' | 'tv';  // TV badge support
}

interface MusicCredit {
  title: string;
  artist: string;
  year: number;
  coverUrl: string | null;
  discogsId: number;
  discogsUrl: string;
  genres: string[];
  label: string;
}

// Claude's response type includes alias resolution
interface ClaudeCrossoverResponse {
  name: string;
  crossoverDirection: CrossoverDirection;
  narrative: string;
  didYouKnow: string;
  tmdbSearchQuery: string;
  discogsSearchQuery: string;
  alternateNames?: string[];   // All known aliases for cross-platform search
  tmdbId?: number;
  discogsId?: number;
}
```

### 6.5 TMDB Endpoints (Implemented)

- `GET /search/person?query={name}` — Multi-name search, tries each alias in sequence
- `GET /person/{id}` — Person details (bio, profile photo)
- `GET /person/{id}/combined_credits` — Film + TV filmography (combined, not movie-only)

Scoring: `vote_average * min(vote_count / 50, 1)` filters obscure 10.0-rated entries.
Self-filtering: Removes "Self", "Himself", "Herself" credits; falls back if < 3 acting roles.

### 6.6 Discogs Endpoints (Implemented)

- `GET /database/search?q={name}&type=artist&per_page=10` — Name-validated search
- `GET /artists/{id}` — Artist details + images
- `GET /artists/{id}/releases?sort=year&sort_order=desc&per_page=20` — 4-tier filtered releases

Name validation: Normalizes names (lowercase, strip punctuation, remove "(2)" disambiguation), checks exact match then substring inclusion.

### 6.7 Caching & Rate Limiting

- **Discogs rate limiter**: Token bucket (60 req/min) with queuing
- **In-memory cache**: 24h TTL for all Discogs responses (search, artist, releases)
- **Client-side**: Session-based `seenNames[]` prevents repeat artists

---

## 7. Page Structure

### 7.1 Pages

| Route | Description | Components |
|-------|-------------|------------|
| `/` | Landing page — hero, categories, "surprise me", featured crossover | Hero, CategoryGrid, FeaturedCrossover, Footer |
| `/artist/[slug]` | Individual crossover profile (shareable) | CrossoverCard, FilmCareer, MusicCareer, NarrativeBlock, ShareButton |
| `/category/[slug]` | Category listing page | CategoryHeader, ArtistGrid |
| `/api/discover` | Random discovery endpoint | — |
| `/api/search` | Search endpoint | — |
| `/api/artist/[slug]` | Artist data endpoint | — |
| `/api/og` | OG image generation | — |

### 7.2 Component Evolution

| Existing Component | Reuse Strategy |
|--------------------|----------------|
| `Hero` | Adapt — new tagline, add "Surprise Me" button, keep animations |
| `VibeMoodInput` | Replace with search input + "Surprise Me" button |
| `ResultCard` | Evolve into `CrossoverCard` — same layout concept, new content |
| `MovieCard` | Reuse as `FilmCareerCard` — show role info instead of just title |
| `AlbumCard` | Reuse as `MusicCareerCard` — show discography highlights |
| `ConnectionText` | Evolve into `NarrativeBlock` — AI-written crossover story |
| `ShareButton` | Reuse as-is, update URL structure |
| `LoadingState` | Reuse as-is |
| `ExamplePairings` | Replace with `FeaturedCrossovers` — curated showcase |
| `HowItWorks` | Replace with `CategoryGrid` |
| `Footer` | Reuse as-is |
| OG route | Adapt — show person photo + dual career |

---

## 8. Design Direction

### 8.1 Keep from Current Design

- Dark cinematic palette (#0A0A08 background, gold + warm accents)
- Film grain texture overlay
- Playfair Display (headlines) + Inter (body) typography
- Projector glow ambient effect
- Art frame treatment for posters/album covers
- Entrance animations (fade-in-up, curtain-reveal, letter-spread)

### 8.2 Evolve for New Concept

- **Split-screen motif**: Film side vs. music side — left/right or top/bottom division
- **Crossover indicator**: A visual element showing the "fade" between two worlds (gradient divider, animated transition)
- **Person-centric**: Hero images of people, not just posters/covers
- **Magazine editorial feel**: Each crossover profile should read like a feature article
- **Category cards**: Rich tiles with representative imagery for each category

### 8.3 Mood & Tone

- **Voice**: Warm, witty, slightly irreverent — like a knowledgeable friend at a party
- **Not academic**: "Lady Gaga went from club bangers to Oscar nods" not "Stefani Germanotta's filmography includes..."
- **Celebrate the crossover**: Never dismissive of someone's "other" career
- **Surprise-first**: Lead with the unexpected fact, not the obvious one

---

## 9. AI Prompt Engineering

### 9.1 System Prompt: Crossover Narrator

Claude generates two things per artist:

1. **Narrative** (2-3 sentences): The story of their crossover — why they did it, what made it surprising, what connects their two careers
2. **Did You Know?** (1 sentence): The single most surprising fact about their dual career

### 9.2 System Prompt: Random Discovery

For the "Surprise Me" feature, Claude acts as a curator — selecting an artist who:
- Has genuine credits in both TMDB and Discogs
- Isn't the most obvious pick (avoid listing only the top 10 everyone knows)
- Has an interesting crossover story to tell
- Varies across categories session-to-session

### 9.3 Validation

Every Claude suggestion must be validated:
- TMDB person search must return results
- Discogs artist search must return results
- If either fails, retry with a different pick (max 2 retries)

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Initial page load** | < 2s (static landing, no API calls) |
| **Crossover profile load** | < 8s (includes Claude + TMDB + Discogs) |
| **"Surprise Me" response** | < 10s (Claude pick + validation + enrichment) |
| **Mobile responsive** | Full functionality on 375px+ |
| **Accessibility** | WCAG 2.1 AA — focus styles, alt text, semantic HTML |
| **Rate limits** | Respect Discogs 60 req/min (existing), TMDB 40 req/10s |
| **Error handling** | Graceful fallbacks — show what data is available, never a blank screen |
| **SEO** | Pre-rendered category pages, proper meta tags, structured data |

---

## 11. Environment Variables

```env
ANTHROPIC_API_KEY=       # Claude AI (Sonnet 4.5)
TMDB_API_KEY=            # The Movie Database (v3 API key, query param auth)
DISCOGS_TOKEN=           # Discogs personal access token

# No new keys needed — existing APIs cover all data sources
```

---

## 12. Implementation Phases

### Phase 1: Core Pivot (Complete)

- [x] Update types: `CrossoverArtist`, `FilmCredit`, `MusicCredit`, `ClaudeCrossoverResponse`
- [x] Add TMDB person endpoints (`/search/person`, `/person/{id}/combined_credits`)
- [x] Add Discogs artist endpoints (validated search, `getArtist`, `getArtistReleases`)
- [x] Create `/api/discover` route (random crossover via Claude + TMDB/Discogs validation)
- [x] Create crossover narrator + random discovery prompts (12 categories, 180+ artists)
- [x] Build `CrossoverCard` with 3-column layout (FilmCreditsList | NarrativeBlock | MusicCreditsList)
- [x] Update Hero with "Surprise Me" CTA
- [x] Update OG image generation for crossover cards
- [x] Session-based "don't repeat" logic via `seenNames[]`
- [x] SEO: meta tags, Open Graph, Twitter cards
- [x] Umami analytics integration
- [x] Deploy to Vercel

### Phase 1.5: Robustness Improvements (Complete)

- [x] Multi-name search: both `searchPerson` and `searchArtist` accept `string[]`, try aliases in sequence
- [x] Combined credits: TMDB `/person/{id}/combined_credits` returns film + TV (not movie-only)
- [x] Name validation: Discogs search normalizes names, matches exact then substring before falling back
- [x] Name variant generation: auto-tries first name only for multi-word names (handles "Tyrese Gibson" → "Tyrese")
- [x] 4-tier release filtering: masters → any main → +track appearances → +producer/appearance roles
- [x] `alternateNames` support: Claude provides all known aliases for cross-platform lookup
- [x] Smart retry: 3-phase logic (try alt names → ask Claude for new pick → try TMDB canonical name for Discogs)
- [x] Zero-release fallback: if matched Discogs artist has 0 releases, tries name variants for alternate artist
- [x] Self-credit filtering: removes "Self/Himself/Herself" with weighted vote scoring
- [x] TV badge: `mediaType` field on `FilmCredit` for TV vs movie distinction
- [x] Empty state UI: graceful display when one side has no credits
- [x] Expanded artist database from ~40 to 180+ across 12 categories

### Phase 2: Search + Categories (Planned)

- [ ] Create `/api/search` route (person search across TMDB + Discogs)
- [ ] Build search input component
- [ ] Define category data (static JSON with curated artist lists)
- [ ] Build category grid component for landing page
- [ ] Build `/category/[slug]` page with artist listing
- [ ] Build `/artist/[slug]` page (shareable, deep-linkable profile)

---

## 13. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **"Surprise Me" clicks** | 3+ per session average | Umami events |
| **Share rate** | 10%+ of profile views result in share | Umami events |
| **Search usage** | 40%+ of sessions use search | Umami events |
| **Time on site** | 2+ minutes average | Umami analytics |
| **Portfolio signal** | Positive feedback in interviews/reviews | Qualitative |

---

## 14. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Claude suggests non-existent crossover artists | Broken profile cards | Medium | Validate every suggestion against TMDB + Discogs before rendering; retry on failure |
| Discogs rate limiting (60 req/min) | Slow/failed requests | Medium | Existing token bucket + cache handles this; pre-compute category data |
| TMDB person search returns wrong person | Incorrect filmography | Medium | Use year + known works as disambiguation signals |
| Some artists have thin discographies or filmographies | Sparse profile cards | High | Set minimum thresholds (2+ credits each side); graceful "limited data" state |
| Image availability varies across APIs | Missing posters/covers | Medium | Fallback placeholder art already exists in current design |

---

## 15. Open Questions

1. **Should categories be fully static (curated JSON) or AI-assisted (Claude generates the list)?** Recommendation: Start static for reliability, explore AI-assisted later.
2. ~~**Should we include TV credits or film-only?**~~ **Resolved**: Yes, using TMDB `/combined_credits` endpoint. TV credits now appear with a "TV" badge. This was critical — many crossovers are TV-first (Zendaya in Euphoria, Selena Gomez in Only Murders).
3. **Do we want a "submit a crossfader" feature?** Recommendation: Post-MVP — let users suggest artists we missed.
4. **Spotify/Apple Music embeds?** Recommendation: Post-MVP — would be cool to hear their music, but adds complexity and potential licensing concerns.

---

*Cross/Fade — Because the best artists don't stay in one lane.*
