import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

interface IcProps {
  d: string;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
}

const Ic: React.FC<IcProps> = ({
  d,
  size = 16,
  color = "currentColor",
  fill = "none",
  strokeWidth = 1.8,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={d} />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = 16, color = "#fff" }) => (
  // Use a standalone SVG — fill-only, no stroke
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 3l14 9-14 9V3z" fill={color} stroke="none" />
  </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

export const SkipBackIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => (
  <Ic d="M19 20L9 12l10-8v16zm-14-16v16" size={size} color={color} />
);

export const SkipFwdIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => (
  <Ic d="M5 4l10 8-10 8V4zm14 0v16" size={size} color={color} />
);

export const ShuffleIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => (
  <Ic d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" size={size} color={color} />
);

export const RepeatIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => (
  <Ic
    d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"
    size={size}
    color={color}
  />
);

export const HeartIcon: React.FC<IconProps> = ({
  size = 16,
  color = "currentColor",
  filled = false,
}) => (
  <Ic
    d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
    size={size}
    color={color}
    fill={filled ? color : "none"}
  />
);

export const MusicIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => (
  <Ic
    d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z"
    size={size}
    color={color}
  />
);

export const VolumeIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => (
  <Ic
    d="M11 5L6 9H2v6h4l5 4V5zm9.07-1.07a16 16 0 010 16.14M15.54 8.46a5 5 0 010 7.07"
    size={size}
    color={color}
  />
);

export const HomeIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => (
  <Ic d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" size={size} color={color} />
);

export const SearchIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => (
  <Ic d="M11 21a10 10 0 100-20 10 10 0 000 20zm5-5l4 4" size={size} color={color} />
);

export const LibraryIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => (
  <Ic
    d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5V5a2 2 0 012-2h12a2 2 0 012 2v14.5"
    size={size}
    color={color}
  />
);

export const QueueIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => (
  <Ic d="M4 6h16M4 12h16M4 18h12" size={size} color={color} />
);

export const SpotifyLogo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);