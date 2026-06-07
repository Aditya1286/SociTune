import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Clock, Pause, Play, Heart } from "lucide-react";
import { useState } from "react";
import { LikeButton } from "@/components/LikeButton";

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const LikedSongsPage = () => {
  const { likedSongs, isLoading } = useMusicStore();
  const { currentSong, isPlaying, playAlbum, togglePlay } = usePlayerStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) return null;

  const handlePlayLikedSongs = () => {
    if (!likedSongs || likedSongs.length === 0) return;
    // We treat likedSongs as a temporary album array
    const isLikedPlaylistPlaying = likedSongs.some((song) => song._id === currentSong?._id);
    if (isLikedPlaylistPlaying) togglePlay();
    else playAlbum(likedSongs, 0);
  };

  const handlePlaySong = (index: number) => {
    if (!likedSongs || likedSongs.length === 0) return;
    playAlbum(likedSongs, index);
  };

  const isLikedPlaylistPlaying =
    isPlaying && likedSongs.some((song) => song._id === currentSong?._id);

  return (
    <div className="h-full">
      <style>{`
        .song-row { transition: background 0.15s ease; }
        .song-row:hover { background: rgba(255,255,255,0.04); }
        .song-row.active { background: rgba(168,85,247,0.06); }

        .play-icon-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .play-icon-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(168,85,247,0.35);
        }

        .now-playing-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 14px;
        }
        .eq-bar {
          width: 2.5px;
          background: #a855f7;
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
        <div className="relative min-h-screen" style={{ background: "linear-gradient(to bottom, #4c1d95 0%, #18181b 35%, #18181b 100%)" }}>

          {/* Gradient header backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(76,29,149,0.95) 0%, #18181b 40%)", minHeight: "100vh" }}
            aria-hidden="true"
          />

          <div className="relative z-10">

            {/* ── Hero ── */}
            <div className="flex flex-col sm:flex-row gap-6 p-6 pb-8">

              {/* Cover art */}
              <div className="flex-shrink-0">
                <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-lg shadow-2xl shadow-black/60 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Heart className="size-20 text-white fill-white shadow-xl drop-shadow-lg" />
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-col justify-end gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-300">Playlist</p>

                <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-2">
                  Liked Songs
                </h1>

                <div className="flex items-center gap-2 text-sm text-purple-200 font-medium">
                  <span>{likedSongs.length} songs</span>
                </div>

                {/* Play button */}
                <div className="mt-4">
                  <Button
                    onClick={handlePlayLikedSongs}
                    size="icon"
                    disabled={likedSongs.length === 0}
                    className="play-icon-btn w-12 h-12 rounded-full bg-purple-500 hover:bg-purple-400 border-0"
                  >
                    {isLikedPlaylistPlaying ? (
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
                {likedSongs.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                        <Heart className="size-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-medium text-white mb-2">Songs you like will appear here</h3>
                        <p>Save songs by tapping the heart icon.</p>
                    </div>
                ) : (
                    likedSongs.map((song, index) => {
                    const isCurrentSong = currentSong?._id === song._id;
                    const isHovered = hoveredIndex === index;

                    return (
                        <div
                        key={song._id}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`song-row grid grid-cols-[16px_1fr_auto_52px] gap-4 px-6 py-2.5 rounded-md group
                            ${isCurrentSong ? "active" : ""}`}
                        >
                        {/* # / play icon / bars */}
                        <div className="flex items-center justify-center cursor-pointer" onClick={() => handlePlaySong(index)}>
                            {isCurrentSong && isPlaying ? (
                            <div className="now-playing-bars">
                                <div className="eq-bar" />
                                <div className="eq-bar" />
                                <div className="eq-bar" />
                            </div>
                            ) : isHovered ? (
                            <Play className="h-3.5 w-3.5 text-white fill-white" />
                            ) : (
                            <span className={`text-sm ${isCurrentSong ? "text-purple-400" : "text-zinc-500"}`}>
                                {index + 1}
                            </span>
                            )}
                        </div>

                        {/* Thumbnail + title */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative group cursor-pointer" onClick={() => handlePlaySong(index)}>
                                <img
                                src={song.imageUrl}
                                alt={song.title}
                                className="size-9 rounded object-cover flex-shrink-0"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                    <Play className="size-4 text-white fill-white" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium truncate cursor-pointer hover:underline ${isCurrentSong ? "text-purple-400" : "text-white"}`} onClick={() => handlePlaySong(index)}>
                                    {song.title}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
                            </div>
                        </div>

                        {/* Action + Date */}
                        <div className="hidden sm:flex items-center gap-4">
                            <LikeButton songId={song._id} className={isHovered || true ? "opacity-100" : "opacity-0 group-hover:opacity-100"} />
                            <span className="text-xs text-zinc-500 tabular-nums min-w-[80px]">
                            {song.createdAt ? song.createdAt.split("T")[0] : ""}
                            </span>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center justify-end gap-2">
                            <span className={`text-xs tabular-nums ${isCurrentSong ? "text-purple-400" : "text-zinc-500"}`}>
                            {formatDuration(song.duration)}
                            </span>
                        </div>
                        </div>
                    );
                    })
                )}
              </div>
            </div>

            <div className="h-10" />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default LikedSongsPage;
