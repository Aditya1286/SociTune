import React, { useEffect, useRef, useState } from "react";
import { PlayIcon, MusicIcon, VolumeIcon } from "./Icons";
import { saveSongEvent } from "../services/SongEvent/songEvent.service";
import {useMutation} from "@tanstack/react-query"
//Types
import type { songEventPayload } from "../services/SongEvent/types";
import type { SpotifyTrack, WebPlaybackTrack } from "../utils/types";

export const GREEN = "#10b981"; // Use site's emerald branding

export const fmt = {
  time: (ms: number): string => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  },
  artists: (artists?: { name: string }[]): string =>
    artists?.map((a) => a.name).join(", ") ?? "",
};

// ─── AlbumArt ─────────────────────────────────────────────────────────────────
interface AlbumArtProps {
  track: WebPlaybackTrack | SpotifyTrack | null;
  size?: number;
  className?: string;
}

export const AlbumArt: React.FC<AlbumArtProps> = ({ track, size = 280, className }) => {
  const img = track?.album?.images?.[0]?.url;
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-zinc-900 border border-white/5 shadow-xl flex-shrink-0 group/art transition-all duration-300 ${className}`}
      style={{ width: size, height: size }}
    >
      {img ? (
        <>
          <img
            src={img}
            alt={track?.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover/art:scale-105"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/art:opacity-100 transition-opacity duration-300" />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <MusicIcon size={48} color="#3f3f46" />
        </div>
      )}
    </div>
  );
};

// ─── ProgressBar ──────────────────────────────────────────────────────────────
interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (ms: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ position, duration, onSeek }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = duration ? (position / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.floor(ratio * duration));
  };

  return (
    <div className="w-full flex items-center gap-3 select-none">
      <span className="text-[10px] font-mono font-semibold text-zinc-500 w-8 text-right tabular-nums">
        {fmt.time(position)}
      </span>
      <div
        ref={barRef}
        onClick={handleClick}
        className="flex-1 h-1.5 bg-zinc-800 rounded-full cursor-pointer relative group/progress transition-all hover:h-2"
      >
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-100"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-lg pointer-events-none"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <span className="text-[10px] font-mono font-semibold text-zinc-500 w-8 text-left tabular-nums">
        {fmt.time(duration)}
      </span>
    </div>
  );
};

// ─── VolumeSlider ─────────────────────────────────────────────────────────────
interface VolumeSliderProps {
  volume: number;
  onChange: (v: number) => void;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({ volume, onChange }) => (
  <div className="flex items-center gap-3 w-full group/volume select-none">
    <VolumeIcon size={14} color="#71717a" />
    <input
      type="range"
      min={0}
      max={100}
      value={volume}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none outline-none cursor-pointer accent-white transition-all group-hover/volume:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent"
    />
  </div>
);

// ─── TrackRow ─────────────────────────────────────────────────────────────────
interface TrackRowProps {
  track: SpotifyTrack;
  onPlay: () => void;
  onQueue: () => void;
  isActive?: boolean;
}


export const TrackRow: React.FC<TrackRowProps> = ({ track, onPlay, onQueue, isActive }) => {
  const [hovered, setHovered] = useState(false);
  const img = track?.album?.images?.[2]?.url ?? track?.album?.images?.[0]?.url;

  const { mutate: sendSongEvent } = useMutation({
    mutationFn: saveSongEvent,
    onError: (err) => {
      console.error("Failed to save song event", err);
    },
  });

  useEffect(() => {
    console.log("check",isActive,track)
    if (!isActive || !track) return;

    const payload: songEventPayload = {
      song_details: {
        title: track.name,
        artist: fmt.artists(track.artists),
        external_ids: {
          spotify_id: track.id,
          fuzzy_id: `${track.name}-${fmt.artists(track.artists)}`,
        },
        primary_genre: "", // fill in once you have genre data available
        duration: fmt.time(track.duration_ms ?? 0),
        image_url: track?.album?.images?.[0]?.url ?? "",
      },
      played_at: new Date().toISOString(),
      duration_ms: String(track.duration_ms ?? 0),
      completed: false,
      source: "organic", //Need to make it dynamic
    };

    sendSongEvent(payload);
    // re-fire only when the actively playing track changes, not on every render
  }, [isActive, track?.id]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center gap-4 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 border border-transparent ${
        isActive
          ? "bg-white/5 border-white/5 shadow-inner"
          : "hover:bg-white/[0.02] hover:border-white/[0.02]"
      }`}
    >
      {/* Thumbnail */}
      <div
        className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md bg-zinc-900 border border-white/5"
        onClick={onPlay}
      >
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MusicIcon size={16} color="#3f3f46" />
          </div>
        )}
        {hovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-all duration-200">
            <PlayIcon size={12} color="#fff" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={onPlay}>
        <div
          className={`text-sm font-semibold truncate transition-colors leading-snug ${
            isActive ? "text-emerald-400" : "text-zinc-200 hover:text-white"
          }`}
        >
          {track?.name}
        </div>
        <div className="text-xs text-zinc-400 truncate mt-0.5">
          {fmt.artists(track?.artists)}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQueue();
          }}
          className={`text-[10px] font-bold text-zinc-500 hover:text-white px-2.5 py-1 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-900 transition-all duration-200 uppercase tracking-wider ${
            hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
          }`}
        >
          + Queue
        </button>

        {/* Duration */}
        <span className="text-xs font-mono text-zinc-500 w-10 text-right">
          {fmt.time(track?.duration_ms ?? 0)}
        </span>
      </div>
    </div>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-6">
    <div className="px-4 pb-2.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
      {title}
    </div>
    <div className="space-y-1">{children}</div>
  </div>
);

// ─── SidebarItem ──────────────────────────────────────────────────────────────
interface SidebarItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-all duration-300 ${
      active
        ? "bg-white/10 text-white shadow-inner border border-white/[0.03]"
        : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);