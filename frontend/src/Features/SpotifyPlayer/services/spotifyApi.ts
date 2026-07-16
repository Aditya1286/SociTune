
import { getValidToken } from "./Auth";
import type {
  SpotifyUser,
  SpotifyTrack,
  SpotifyPlaylist,
  SearchResults,
} from "../utils/types";

// ─── Base fetch ───────────────────────────────────────────────────────────────

async function spotifyFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T | undefined> {
  try {
    const token = await getValidToken();
    if (!token){
      throw new Error("")
    };
  
    console.log("PATH: ",path)
    const res = await fetch(`https://api.spotify.com/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  
    if (res.status === 204 || res.status === 205) {
      return undefined;
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;
    return data;
  } catch (error) {
    console.error("Spotify Fetch Error:", error);
    throw new Error("Error Encountered in spotify fetch");
  }
}

// ─── API surface ──────────────────────────────────────────────────────────────

const SONG_SEARCH_LIMIT=10

export const api = {
  // User
  me: () =>
    spotifyFetch<SpotifyUser>("/me"),

  // Player
  player: () =>
    spotifyFetch("/me/player"),

  transferPlayback: (deviceId: string) =>
    spotifyFetch("/me/player", {
      method: "PUT",
      body: JSON.stringify({ device_ids: [deviceId], play: false }),
    }),

  play: (deviceId?: string, body?: Record<string, unknown>) => {
    const qs = deviceId ? `?device_id=${deviceId}` : "";
    return spotifyFetch(`/me/player/play${qs}`, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  pause: () =>
    spotifyFetch("/me/player/pause", { method: "PUT" }),

  next: () =>
    spotifyFetch("/me/player/next", { method: "POST" }),

  prev: () =>
    spotifyFetch("/me/player/previous", { method: "POST" }),

  seek: (positionMs: number) =>
    spotifyFetch(`/me/player/seek?position_ms=${positionMs}`, { method: "PUT" }),

  volume: (pct: number) =>
    spotifyFetch(`/me/player/volume?volume_percent=${pct}`, { method: "PUT" }),

  shuffle: (state: boolean) =>
    spotifyFetch(`/me/player/shuffle?state=${state}`, { method: "PUT" }),

  repeat: (state: "off" | "context" | "track") =>
    spotifyFetch(`/me/player/repeat?state=${state}`, { method: "PUT" }),

  // Queue
  addToQueue: (uri: string) =>
    spotifyFetch(`/me/player/queue?uri=${uri}`, { method: "POST" }),

  getQueue: () =>
    spotifyFetch<{ currently_playing: SpotifyTrack; queue: SpotifyTrack[] }>("/me/player/queue"),

  // Library
  savedTracks: () =>
    spotifyFetch<{ items: { track: SpotifyTrack }[] }>("/me/tracks?limit=20"),

  savedAlbums: () =>
    spotifyFetch("/me/albums?limit=20"),


  likeTrack: (id: string) =>
    spotifyFetch(`/me/tracks?ids=${id}`, { method: "PUT" }),

  unlikeTrack: (id: string) =>
    spotifyFetch(`/me/tracks?ids=${id}`, { method: "DELETE" }),

  // Discovery
  recentlyPlayed: () =>
    spotifyFetch<{ items: { track: SpotifyTrack }[] }>(
      "/me/player/recently-played?limit=20"
    ),

  topTracks: () =>
    spotifyFetch<{ items: SpotifyTrack[] }>("/me/top/tracks?limit=20"),

  // Playlists
  playlists: () =>
    spotifyFetch<{ items: SpotifyPlaylist[] }>("/me/playlists?limit=30"),

  playlistTracks: (id: string) =>
    spotifyFetch<{ items: { item: SpotifyTrack }[] }>(
      `/playlists/${id}/items`
    ),

  // Search
  search: (query: string) =>
    spotifyFetch<SearchResults>(
      `/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=${SONG_SEARCH_LIMIT}`
    ),

  //Deprecated API
  isTrackLiked: (ids: string[]) =>
    spotifyFetch<boolean[]>(`/me/tracks/contains?ids=${ids.join(",")}`),
};
