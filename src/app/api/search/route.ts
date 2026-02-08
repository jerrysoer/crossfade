import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const TMDB_BASE = "https://api.themoviedb.org/3";
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "TMDB_API_KEY not set" }, { status: 500 });
  }

  const url = `${TMDB_BASE}/search/person?query=${encodeURIComponent(query)}&language=en-US&page=1&api_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json([]);
  }

  const data = await res.json();
  const results = (data.results || [])
    .slice(0, 8)
    .map((p: { id: number; name: string; profile_path: string | null; known_for_department: string }) => ({
      id: p.id,
      name: p.name,
      photoPath: p.profile_path,
      department: p.known_for_department,
    }));

  return NextResponse.json(results);
}
