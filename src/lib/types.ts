export type CrossoverDirection = "music-to-film" | "film-to-music" | "simultaneous";

export interface FilmCredit {
  title: string;
  year: number;
  character: string;
  posterUrl: string | null;
  tmdbId: number;
  tmdbUrl: string;
  rating: number;
  mediaType?: "movie" | "tv";
}

export interface MusicCredit {
  title: string;
  artist: string;
  year: number;
  coverUrl: string | null;
  discogsId: number;
  discogsUrl: string;
  genres: string[];
  label: string;
}

export interface CrossoverArtist {
  name: string;
  slug: string;
  photoUrl: string | null;
  narrative: string;
  didYouKnow: string;
  crossoverDirection: CrossoverDirection;
  filmCredits: FilmCredit[];
  musicCredits: MusicCredit[];
}

export interface ClaudeCrossoverResponse {
  name: string;
  crossoverDirection: CrossoverDirection;
  narrative: string;
  didYouKnow: string;
  tmdbSearchQuery: string;
  discogsSearchQuery: string;
  alternateNames?: string[];
  tmdbId?: number;
  discogsId?: number;
}
