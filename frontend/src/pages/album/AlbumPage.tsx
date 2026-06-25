import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Clock, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const AlbumPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { fetchAlbumById, currentAlbum, isLoading } = useMusicStore();

  const renderArtistLinks = (artistString: string) => {
    const names = artistString.split(",").map(n => n.trim());
    return (
      <>
        {names.map((name, i) => (
          <span key={name}>
            <span 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/artists/${encodeURIComponent(name)}`);
              }}
              className="hover:underline hover:text-white cursor-pointer transition-colors"
            >
              {name}
            </span>
            {i < names.length - 1 && ", "}
          </span>
        ))}
      </>
    );
  };
  const { currentSong, isPlaying, playAlbum, togglePlay } = usePlayerStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (albumId) fetchAlbumById(albumId);
  }, [fetchAlbumById, albumId]);

  if (isLoading) return null;

  const handlePlayAlbum = () => {
    if (!currentAlbum) return;
    const isCurrentAlbumPlaying = currentAlbum?.songs.some((song) => song._id === currentSong?._id);
    if (isCurrentAlbumPlaying) togglePlay();
    else playAlbum(currentAlbum?.songs, 0);
  };

  const handlePlaySong = (index: number) => {
    if (!currentAlbum) return;
    playAlbum(currentAlbum?.songs, index);
  };

  const isAlbumPlaying =
    isPlaying && currentAlbum?.songs.some((song) => song._id === currentSong?._id);

  return (
    <div className="h-full">
      <style>{`
        .song-row { transition: background 0.15s ease; }
        .song-row:hover { background: rgba(255,255,255,0.04); }
        .song-row.active { background: rgba(34,197,94,0.06); }

        .play-icon-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .play-icon-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(34,197,94,0.35);
        }

        .now-playing-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 14px;
        }
        .eq-bar {
          width: 2.5px;
          background: #22c55e;
          border-radius: 1px;
          animation: eq 0.9s ease-in-out infinite alternate;
        }
        .eq-bar:nth-child(1) { height: 55%; animation-delay: 0s; }
        .eq-bar:nth-child(2) { height: 100%; animation-delay: 0.2s; }
        .eq-bar:nth-child(3) { height: 40%; animation-delay: 0.4s; }
        @keyframes eq {
          from { transform: scaleY(0.25); }
          to   { transform: scaleY(1); }
        }

        .divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0 24px;
        }
      `}</style>

      <ScrollArea className="h-full rounded-md">
        <div className="relative min-h-screen" style={{ background: "linear-gradient(to bottom, #1a2e1a 0%, #18181b 35%, #18181b 100%)" }}>

          {/* Gradient header backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(26,46,26,0.95) 0%, #18181b 40%)", minHeight: "100vh" }}
            aria-hidden="true"
          />

          <div className="relative z-10">

            {/* ── Hero ── */}
            <div className="flex flex-col sm:flex-row gap-6 p-6 pb-8">

              {/* Album art */}
              <div className="flex-shrink-0">
                <img
                  src={currentAlbum?.imageUrl}
                  alt={currentAlbum?.title}
                  className="w-44 h-44 sm:w-52 sm:h-52 object-cover rounded-lg shadow-2xl shadow-black/60"
                />
              </div>

              {/* Meta */}
              <div className="flex flex-col justify-end gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Album</p>

                <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
                  {currentAlbum?.title}
                </h1>

                <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                  <span className="text-white font-medium">{currentAlbum && renderArtistLinks(currentAlbum.artist)}</span>
                  <span className="text-zinc-600">·</span>
                  <span>{currentAlbum?.songs.length} songs</span>
                  <span className="text-zinc-600">·</span>
                  <span>{currentAlbum?.releaseYear}</span>
                </div>

                {/* Play button */}
                <div className="mt-4">
                  <Button
                    onClick={handlePlayAlbum}
                    size="icon"
                    className="play-icon-btn w-12 h-12 rounded-full bg-green-500 hover:bg-green-400 border-0"
                  >
                    {isAlbumPlaying ? (
                      <Pause className="h-5 w-5 text-black fill-black" />
                    ) : (
                      <Play className="h-5 w-5 text-black fill-black ml-0.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Track list ── */}
            <div>
              {/* Header */}
              <div className="divider" />
              <div className="grid grid-cols-[16px_1fr_auto_52px] gap-4 px-10 py-2 text-xs text-zinc-500 uppercase tracking-wider">
                <span>#</span>
                <span>Title</span>
                <span className="hidden sm:block">Date added</span>
                <span className="flex justify-end"><Clock className="h-3.5 w-3.5" /></span>
              </div>
              <div className="divider" />

              {/* Rows */}
              <div className="px-4 py-3 space-y-0.5">
                {currentAlbum?.songs.map((song, index) => {
                  const isCurrentSong = currentSong?._id === song._id;
                  const isHovered = hoveredIndex === index;

                  return (
                    <div
                      key={song._id}
                      onClick={() => handlePlaySong(index)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={`song-row grid grid-cols-[16px_1fr_auto_52px] gap-4 px-6 py-2.5 rounded-md cursor-pointer group
                        ${isCurrentSong ? "active" : ""}`}
                    >
                      {/* # / play icon / bars */}
                      <div className="flex items-center justify-center">
                        {isCurrentSong && isPlaying ? (
                          <div className="now-playing-bars">
                            <div className="eq-bar" />
                            <div className="eq-bar" />
                            <div className="eq-bar" />
                          </div>
                        ) : isHovered ? (
                          <Play className="h-3.5 w-3.5 text-white fill-white" />
                        ) : (
                          <span className={`text-sm ${isCurrentSong ? "text-green-500" : "text-zinc-500"}`}>
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* Thumbnail + title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={song.imageUrl}
                          alt={song.title}
                          className="size-9 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isCurrentSong ? "text-green-400" : "text-white"}`}>
                            {song.title}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{renderArtistLinks(song.artist)}</p>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="hidden sm:flex items-center">
                        <span className="text-xs text-zinc-500 tabular-nums">
                          {song.createdAt.split("T")[0]}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center justify-end">
                        <span className={`text-xs tabular-nums ${isCurrentSong ? "text-green-500" : "text-zinc-500"}`}>
                          {formatDuration(song.duration)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-10" />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AlbumPage;