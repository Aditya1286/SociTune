import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useStore as useSpotifyStore } from "@/Features/SpotifyPlayer/store/PlayerStore";
import { axiosInstance } from "@/lib/axios";
import { generateSongId } from "@/util/generateSongId";
import type { ListeningEventPayload } from "@/types";

export function usePlaybackTracker() {
  const sessionRef = useRef<{
    trackId: string;
    type: "local" | "spotify";
    playbackStartedAt: number;
    listeningTime: number;
    hasFired: boolean;
    lastTickTime: number;
  } | null>(null);

  useEffect(() => {
    const checkPlayback = async () => {
      // 1. Get current state from both stores
      const localState = usePlayerStore.getState();
      const spotifyState = useSpotifyStore.getState();

      // 2. Identify active track
      let activeTrackId: string | null = null;
      let activeType: "local" | "spotify" | null = null;
      let activeTrackInfo: any = null;

      if (localState.currentSong && localState.isPlaying) {
        activeTrackId = `local-${localState.currentSong._id}`;
        activeType = "local";
        activeTrackInfo = localState.currentSong;
      } else if (spotifyState.track && spotifyState.isPlaying) {
        activeTrackId = `spotify-${spotifyState.track.id}`;
        activeType = "spotify";
        activeTrackInfo = spotifyState.track;
      }

      const now = Date.now();

      // 3. Handle track change or track stop
      if (!activeTrackId) {
        // Nothing is playing, pause the tracking accumulation (set lastTickTime to 0)
        if (sessionRef.current) {
          sessionRef.current.lastTickTime = 0;
        }
        return;
      }

      // If playing a track
      if (!sessionRef.current || sessionRef.current.trackId !== activeTrackId) {
        // Track changed! Reset and start a new session
        sessionRef.current = {
          trackId: activeTrackId,
          type: activeType!,
          playbackStartedAt: now,
          listeningTime: 0,
          hasFired: false,
          lastTickTime: now,
        };
        console.log(`[PlaybackTracker] New session started for track: ${activeTrackId}`);
        return;
      }

      // If continuing same track
      const session = sessionRef.current;
      if (session.lastTickTime > 0) {
        const delta = now - session.lastTickTime;
        session.listeningTime += delta;
      }
      session.lastTickTime = now;

      // 4. Trigger listening event at 30 seconds
      if (session.listeningTime >= 30000 && !session.hasFired) {
        session.hasFired = true; // Set flag immediately to prevent double-firing

        console.log(`[PlaybackTracker] 30 seconds threshold met for track ${activeTrackId}. Sending listening event.`);

        try {
          // Construct payload
          let payload: ListeningEventPayload;
          const playedAtIso = new Date(session.playbackStartedAt).toISOString();
          const durationMsStr = String(Math.round(session.listeningTime));

          // Determine playback source from current URL path
          const path = window.location.pathname;
          let source: ListeningEventPayload["source"] = "organic";
          if (path.startsWith("/search")) {
            source = "search";
          } else if (path.startsWith("/albums") || path.startsWith("/liked-songs")) {
            source = "playlist";
          } else if (path.startsWith("/time-travel")) {
            source = "recommendation";
          } else if (path.startsWith("/chat") || path.startsWith("/notifications")) {
            source = "share";
          } else if (path.startsWith("/radio")) {
            source = "radio";
          }

          if (session.type === "local") {
            const song = activeTrackInfo;
            // A song is completed if listened duration is >= 90% of song duration
            const completed = session.listeningTime >= (song.duration * 1000) * 0.90;
            const fuzzyId = song.external_ids?.fuzzy_id || await generateSongId(song.title, song.artist);

            payload = {
              song_details: {
                title: song.title,
                artist: song.artist,
                external_ids: {
                  spotify_id: song.external_ids?.spotify_id,
                  isrc_id: song.external_ids?.isrc_id,
                  yt_id: song.external_ids?.yt_id,
                  fuzzy_id: fuzzyId,
                },
                primary_genre: song.genre || "unknown",
                duration: String(song.duration),
                audio_details: song.audio_details ? {
                  tempo: song.audio_details.tempo || 0,
                  energy: song.audio_details.energy || 0,
                  valence: song.audio_details.valence || 0,
                  acousticness: song.audio_details.acousticness || 0,
                  danceability: song.audio_details.danceability || 0,
                } : undefined,
                lyrics_details: song.lyrics ? {
                  lyrics: song.lyrics,
                  lyricsSource: song.lyricsSource || "Unknown",
                  lyricsFetchedAt: song.lyricsFetchedAt ? new Date(song.lyricsFetchedAt) : new Date(),
                } : undefined,
                image_url: song.imageUrl,
              },
              played_at: playedAtIso,
              duration_ms: durationMsStr,
              completed,
              source,
            };
          } else {
            // Spotify track
            const track = activeTrackInfo;
            const spotifyDurationMs = spotifyState.duration; // in ms
            const completed = session.listeningTime >= spotifyDurationMs * 0.90;
            const fuzzyId = await generateSongId(track.name, track.artists.map((a: any) => a.name).join(", "));

            // Check if lyrics exist in the player store for this Spotify track
            const lyricsObj = localState.lyrics?.[track.id];
            const lyricsDetails = lyricsObj ? {
              lyrics: lyricsObj,
              lyricsSource: "Genius", // fallback source name
              lyricsFetchedAt: new Date(),
            } : undefined;

            payload = {
              song_details: {
                title: track.name,
                artist: track.artists.map((a: any) => a.name).join(", "),
                external_ids: {
                  spotify_id: track.id,
                  fuzzy_id: fuzzyId,
                },
                primary_genre: "unknown",
                duration: String(Math.round(spotifyDurationMs / 1000)),
                audio_details: undefined,
                lyrics_details: lyricsDetails,
                image_url: track.album?.images?.[0]?.url || "",
              },
              played_at: playedAtIso,
              duration_ms: durationMsStr,
              completed,
              source,
            };
          }

          // Fire asynchronously and do not block
          axiosInstance.post("/users/play-history", payload)
            .then(() => {
              console.log("[PlaybackTracker] Listening event successfully sent to backend.");
            })
            .catch((err) => {
              console.error("[PlaybackTracker] Failed to send listening event to backend:", err);
            });

        } catch (err) {
          console.error("[PlaybackTracker] Error preparing listening event payload:", err);
        }
      }
    };

    // Run the check every 1 second
    const intervalId = setInterval(checkPlayback, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
}
