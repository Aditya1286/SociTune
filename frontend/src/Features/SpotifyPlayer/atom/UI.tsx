
import React, { useRef, useState } from "react";
import type { SpotifyTrack, WebPlaybackTrack } from "../utils/types";
import { PlayIcon, MusicIcon, VolumeIcon } from "./Icons";

// ─── Shared style tokens ──────────────────────────────────────────────────────

export const btnReset: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  fontFamily: "inherit",
};

export const GREEN = "#1DB954";
export const BG = "#0A0A0A";

// ─── fmt ──────────────────────────────────────────────────────────────────────

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
}

export const AlbumArt: React.FC<AlbumArtProps> = ({ track, size = 280 }) => {
  const img = track?.album?.images?.[0]?.url;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        overflow: "hidden",
        flexShrink: 0,
        background: "#141414",
      }}
    >
      {img ? (
        <img
          src={img}
          alt={track?.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MusicIcon size={48} color="#2a2a2a" />
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
    const rect = barRef.current!.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.floor(ratio * duration));
  };

  return (
    <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          fontSize: 11,
          color: "#555",
          width: 34,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmt.time(position)}
      </span>
      <div
        ref={barRef}
        onClick={handleClick}
        style={{
          flex: 1,
          height: 3,
          background: "#1e1e1e",
          borderRadius: 2,
          cursor: "pointer",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#fff",
            borderRadius: 2,
            transition: "width 0.1s linear",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: "#555",
          width: 34,
          fontVariantNumeric: "tabular-nums",
        }}
      >
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
  <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
    <VolumeIcon size={13} color="#444" />
    <input
      type="range"
      min={0}
      max={100}
      value={volume}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ flex: 1, accentColor: "#fff", cursor: "pointer" }}
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

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "6px 12px",
        borderRadius: 4,
        cursor: "pointer",
        background: isActive ? "#161616" : hovered ? "#111" : "transparent",
        transition: "background 0.12s",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}
        onClick={onPlay}
      >
        {img ? (
          <img
            src={img}
            alt=""
            style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 2, display: "block" }}
          />
        ) : (
          <div
            style={{
              width: 38,
              height: 38,
              background: "#1a1a1a",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MusicIcon size={14} color="#333" />
          </div>
        )}
        {hovered && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
            }}
          >
            <PlayIcon size={12} color="#fff" />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }} onClick={onPlay}>
        <div
          style={{
            fontSize: 13,
            color: isActive ? GREEN : "#e0e0e0",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {track?.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#555",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {fmt.artists(track?.artists)}
        </div>
      </div>

      {/* Queue button */}
      <button
        onClick={(e) => { e.stopPropagation(); onQueue(); }}
        style={{
          ...btnReset,
          fontSize: 10,
          color: "#444",
          letterSpacing: "0.08em",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.12s",
          whiteSpace: "nowrap",
        }}
      >
        + QUEUE
      </button>

      {/* Duration */}
      <span
        style={{ fontSize: 11, color: "#444", minWidth: 32, textAlign: "right" }}
      >
        {fmt.time(track?.duration_ms ?? 0)}
      </span>
    </div>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div style={{ marginBottom: 28 }}>
    <div
      style={{
        padding: "0 16px 10px",
        fontSize: 10,
        letterSpacing: "0.14em",
        color: "#3a3a3a",
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {title}
    </div>
    {children}
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
    style={{
      ...btnReset,
      width: "100%",
      textAlign: "left",
      padding: "8px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      color: active ? "#fff" : "#484848",
      background: active ? "#141414" : "transparent",
      borderRadius: 4,
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      transition: "all 0.12s",
    }}
  >
    {icon}
    {label}
  </button>
);