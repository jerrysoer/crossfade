interface YouTubeEmbedProps {
  videoId: string;
}

export default function YouTubeEmbed({ videoId }: YouTubeEmbedProps) {
  return (
    <div className="w-full mb-4 rounded-lg overflow-hidden border border-[var(--border)] shadow-sm">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
