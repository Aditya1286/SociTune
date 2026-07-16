import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import type { SpotifyTrack } from "./types";
import type { Song } from "@/types";

export const playSpotifyTrackLocally = async (track: SpotifyTrack) => {
  const localSongs = useMusicStore.getState().songs;
  
  // Try to find a match in local database by spotify_id or title/artist
  const match = localSongs.find(
    (s) =>
      s.external_ids?.spotify_id === track.id ||
      (s.title.toLowerCase() === track.name.toLowerCase() &&
        s.artist.toLowerCase().includes(track.artists[0]?.name.toLowerCase()))
  );
  
  if (match) {
    usePlayerStore.getState().setCurrentSong(match);
  } else {
    // Create a temporary Spotify Song object
    const spotifySong: Song = {
      _id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      imageUrl: track.album.images?.[0]?.url || "",
      audioUrl: track.preview_url || `spotify:track:${track.id}`,
      duration: track.duration_ms / 1000,
      albumId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      external_ids: {
        spotify_id: track.id,
        fuzzy_id: ""
      }
    };
    usePlayerStore.getState().setCurrentSong(spotifySong);
  }
};

export const queueSpotifyTrackLocally = (track: SpotifyTrack) => {
  const localSongs = useMusicStore.getState().songs;
  
  const match = localSongs.find(
    (s) =>
      s.external_ids?.spotify_id === track.id ||
      (s.title.toLowerCase() === track.name.toLowerCase() &&
        s.artist.toLowerCase().includes(track.artists[0]?.name.toLowerCase()))
  );
  
  const songToQueue: Song = match || {
    _id: track.id,
    title: track.name,
    artist: track.artists.map((a: any) => a.name).join(", "),
    imageUrl: track.album.images?.[0]?.url || "",
    audioUrl: track.preview_url || `spotify:track:${track.id}`,
    duration: track.duration_ms / 1000,
    albumId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    external_ids: {
      spotify_id: track.id,
      fuzzy_id: ""
    }
  };
  
  usePlayerStore.getState().addToQueue(songToQueue);
};
