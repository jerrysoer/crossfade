import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name") ?? "Crossover Artist";
  const direction = searchParams.get("direction") ?? "";
  const narrative = searchParams.get("narrative") ?? "";
  const photo = searchParams.get("photo") ?? "";

  const directionLabel =
    direction === "music-to-film"
      ? "Music to Film"
      : direction === "film-to-music"
        ? "Film to Music"
        : "Dual Threat";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F4EE",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top bar — branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "36px",
          }}
        >
          <span
            style={{ color: "#1A1917", fontSize: "24px", fontWeight: 700 }}
          >
            Cross
          </span>
          <span
            style={{
              color: "#D63230",
              fontSize: "20px",
              fontStyle: "italic",
            }}
          >
            /
          </span>
          <span
            style={{ fontSize: "24px", fontWeight: 700, color: "#1A1917" }}
          >
            Fade
          </span>
        </div>

        {/* Center — photo + name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photo}
              alt=""
              width={160}
              height={160}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                background: "#EFEBE3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#9C9890", fontSize: "14px" }}>
                Artist
              </span>
            </div>
          )}

          <span
            style={{
              color: "#1A1917",
              fontSize: "36px",
              fontWeight: 700,
            }}
          >
            {name}
          </span>

          {/* Direction badge */}
          <span
            style={{
              color: "#D63230",
              fontSize: "14px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            {directionLabel}
          </span>
        </div>

        {/* Narrative */}
        {narrative && (
          <div
            style={{
              maxWidth: "700px",
              marginTop: "24px",
              padding: "0 32px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                color: "#5C5955",
                fontSize: "16px",
                fontStyle: "italic",
                lineHeight: 1.6,
              }}
            >
              &ldquo;{narrative}&rdquo;
            </span>
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
