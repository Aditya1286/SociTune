// ─── Spotify SDK types ────────────────────────────────────────────────────────

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  uri: string;
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  uri: string;
  images: SpotifyImage[];
  items: { total: number };
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: SpotifyImage[];
}

export type RepeatMode = "off" | "context" | "track";
export type ViewId = "home" | "search" | "library" | "queue" | "playlist";


export interface ActivePlaylist extends SpotifyPlaylist {
  tracks: SpotifyTrack[];
}

// ─── Web Playback SDK types ───────────────────────────────────────────────────

export interface WebPlaybackTrack {
  uri: string;
  id: string;
  type: string;
  media_type: string;
  name: string;
  is_playable: boolean;
  album: {
    uri: string;
    name: string;
    images: SpotifyImage[];
  };
  artists: SpotifyArtist[];
}

export interface WebPlaybackState {
  context: { uri: string | null; metadata: Record<string, unknown> };
  disallows: Record<string, boolean>;
  duration: number;
  paused: boolean;
  position: number;
  repeat_mode: 0 | 1 | 2;
  shuffle: boolean;
  track_window: {
    current_track: WebPlaybackTrack;
    previous_tracks: WebPlaybackTrack[];
    next_tracks: WebPlaybackTrack[];
  };
}

export interface SpotifyPlayerInstance {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  getCurrentState: () => Promise<WebPlaybackState | null>;
  addListener: (event: string, cb: (data: unknown) => void) => void;
  removeListener: (event: string, cb?: (data: unknown) => void) => void;
}

// ─── Zustand store shape ──────────────────────────────────────────────────────

export interface PlayerStore {
  // Auth
  user: SpotifyUser | null;
  setUser: (user: SpotifyUser | null) => void;

  // SDK
  player: SpotifyPlayerInstance | null;
  deviceId: string | null;
  setPlayer: (player: SpotifyPlayerInstance | null) => void;
  setDeviceId: (id: string | null) => void;

  // Playback
  track: WebPlaybackTrack | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isLiked: boolean;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  setPosition: (ms: number) => void;
  setIsLiked: (liked: boolean) => void;

  // UI
  view: ViewId;
  searchQuery: string;
  searchResults: SearchResults | null;
  queueItems: SpotifyTrack[];
  activePlaylist: ActivePlaylist | null;
  setView: (view: ViewId) => void;
  setSearchQuery: (q: string) => void;
  setSearchResults: (r: SearchResults | null) => void;
  setQueueItems: (items: SpotifyTrack[]) => void;
  setActivePlaylist: (pl: ActivePlaylist | null) => void;
}

export interface PlaybackState {
  track: WebPlaybackTrack | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isLiked: boolean;
}

export interface SearchResults {
  tracks?: { items: SpotifyTrack[] };
  artists?: { items: SpotifyArtist[] };
  albums?: { items: SpotifyAlbum[] };
}

// Augment window for Spotify SDK
declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayerInstance;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}