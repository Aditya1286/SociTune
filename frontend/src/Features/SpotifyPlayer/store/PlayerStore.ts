import { create } from "zustand";
import type {
  PlayerStore,
  SpotifyUser,
  SpotifyPlayerInstance,
  WebPlaybackTrack,
  RepeatMode,
  ViewId,
  SearchResults,
  SpotifyTrack,
  ActivePlaylist,
  PlaybackState,
} from "../utils/types";

export const useStore = create<PlayerStore>((set) => ({
  // Auth
  user: null as SpotifyUser | null,
  setUser: (user) => set({ user }),

  // SDK
  player: null as SpotifyPlayerInstance | null,
  deviceId: null as string | null,
  setPlayer: (player) => set({ player }),
  setDeviceId: (deviceId) => set({ deviceId }),

  // Playback
  track: null as WebPlaybackTrack | null,
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 80,
  shuffle: false,
  repeat: "off" as RepeatMode,
  isLiked: false,
  setPlaybackState: (state: Partial<PlaybackState>) => set(state),
  setPosition: (position) => set({ position }),
  setIsLiked: (isLiked) => set({ isLiked }),

  // UI
  view: "home" as ViewId,
  searchQuery: "",
  searchResults: null as SearchResults | null,
  queueItems: [] as SpotifyTrack[],
  activePlaylist: null as ActivePlaylist | null,
  setView: (view) => set({ view }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setQueueItems: (queueItems) => set({ queueItems }),
  setActivePlaylist: (activePlaylist) => set({ activePlaylist }),
}));