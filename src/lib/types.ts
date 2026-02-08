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
  trivia?: string;
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
  trivia?: string;
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
  birthday: string | null;
  birthplace: string | null;
  deathday: string | null;
}

export interface CreditTrivia {
  title: string;
  fact: string;
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
  creditTrivia?: CreditTrivia[];
}
