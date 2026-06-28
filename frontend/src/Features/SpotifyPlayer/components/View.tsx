
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useStore } from "../store/PlayerStore";
import { api } from "../api/services";
import { TrackRow, Section } from "../atom/UI";
import type { SpotifyTrack, SpotifyPlaylist } from "../utils/types";

// ─── Home ─────────────────────────────────────────────────────────────────────

export const HomeView: React.FC = () => {
  const { deviceId } = useStore();
  const [recent, setRecent] = useState<SpotifyTrack[]>([]);
  const [top, setTop] = useState<SpotifyTrack[]>([]);

  useEffect(() => {
    api.recentlyPlayed().then((d) => setRecent(d?.items.map((i) => i.track) ?? []));
    api.topTracks().then((d) => setTop(d?.items ?? []));
  }, []);

  const play = (track: SpotifyTrack) =>
    deviceId ? api.play(deviceId, { uris: [track.uri] }) : null;
  const queue = (track: SpotifyTrack) => api.addToQueue(track.uri);

  return (
    <div>
      {recent.length > 0 && (
        <Section title="Recently Played">
          {recent.slice(0, 10).map((t, i) => (
            <TrackRow key={t.id + i} track={t} onPlay={() => play(t)} onQueue={() => queue(t)} />
          ))}
        </Section>
      )}
      {top.length > 0 && (
        <Section title="Your Top Tracks">
          {top.slice(0, 10).map((t, i) => (
            <TrackRow key={t.id + i} track={t} onPlay={() => play(t)} onQueue={() => queue(t)} />
          ))}
        </Section>
      )}
      {recent.length === 0 && top.length === 0 && (
        <div style={{ padding: "40px 20px", color: "#333", fontSize: 13 }}>
          Loading your music…
        </div>
      )}
    </div>
  );
};

// ─── Search ───────────────────────────────────────────────────────────────────

export const SearchView: React.FC = () => {
  const { searchQuery, setSearchQuery, searchResults, setSearchResults, deviceId } = useStore();
  const debounce = useRef<ReturnType<typeof setTimeout>>(0);

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) { setSearchResults(null); return; }
      const data = await api.search(q);
      if(!data) {
        throw new Error("Invalid data")
      }
      setSearchResults(data);
    },
    [setSearchResults]
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(q), 400);
  };

  const play = (track: SpotifyTrack) =>
    deviceId ? api.play(deviceId, { uris: [track.uri] }) : null;
  const queue = (track: SpotifyTrack) => api.addToQueue(track.uri);

  return (
    <div>
      <div style={{ padding: "0 16px 20px" }}>
        <input
          autoFocus
          value={searchQuery}
          onChange={handleInput}
          placeholder="Search songs, artists, albums…"
          style={{
            width: "100%",
            background: "#111",
            border: "1px solid #1e1e1e",
            borderRadius: 4,
            padding: "10px 14px",
            color: "#fff",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
      </div>
      {searchResults?.tracks?.items && searchResults.tracks.items.length > 0 && (
        <Section title="Songs">
          {searchResults.tracks.items.map((t) => (
            <TrackRow key={t.id} track={t} onPlay={() => play(t)} onQueue={() => queue(t)} />
          ))}
        </Section>
      )}
      {searchQuery && !searchResults && (
        <div style={{ padding: "20px", color: "#333", fontSize: 13 }}>Searching…</div>
      )}
    </div>
  );
};

// ─── Library ──────────────────────────────────────────────────────────────────

export const LibraryView: React.FC = () => {
  const { deviceId, setActivePlaylist, setView } = useStore();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [saved, setSaved] = useState<SpotifyTrack[]>([]);

  useEffect(() => {
    api.playlists().then((d) => setPlaylists(d?.items ?? []));
    api.savedTracks().then((d) => setSaved(d?.items.map((i) => i.track) ?? []));
  }, []);

  const openPlaylist = async (pl: SpotifyPlaylist) => {
    const data = await api.playlistTracks(pl.id);
    console.log("data: ",data)
    setActivePlaylist({ ...pl, tracks: data?.items.map((i) => i.item) ?? [] });
    setView("playlist");
  };

  return (
    <div>
      {saved.length > 0 && (
        <Section title="Liked Songs">
          {saved.slice(0, 10).map((t, i) => (
            <TrackRow
              key={t.id + i}
              track={t}
              onPlay={() => deviceId && api.play(deviceId, { uris: [t.uri] })}
              onQueue={() => api.addToQueue(t.uri)}
            />
          ))}
        </Section>
      )}
      {playlists.length > 0 && (
        <Section title="Your Playlists">
          {playlists.map((pl) => (
            <PlaylistRow key={pl.id} playlist={pl} onClick={() => openPlaylist(pl)} />
          ))}
        </Section>
      )}
    </div>
  );
};

const PlaylistRow: React.FC<{ playlist: SpotifyPlaylist; onClick: () => void }> = ({
  playlist,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "6px 12px",
        borderRadius: 4,
        cursor: "pointer",
        background: hovered ? "#111" : "transparent",
        transition: "background 0.12s",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 2,
          overflow: "hidden",
          background: "#141414",
          flexShrink: 0,
        }}
      >
        {playlist.images?.[0]?.url && (
          <img
            src={playlist.images[0].url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>
      <div>
        <div style={{ fontSize: 13, color: "#e0e0e0", fontWeight: 500 }}>{playlist.name}</div>
        <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
          {playlist.items.total} tracks
        </div>
      </div>
    </div>
  );
};

// ─── Playlist detail ──────────────────────────────────────────────────────────

export const PlaylistView: React.FC = () => {
  //I think this is active playlist song
  const { activePlaylist, deviceId, setView } = useStore();
  if (!activePlaylist) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 16px 20px" }}>
        <button
          onClick={() => setView("library")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#444",
            fontSize: 12,
            fontFamily: "inherit",
            padding: 0,
            letterSpacing: "0.06em",
          }}
        >
          ← BACK
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{activePlaylist.name}</div>
          <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
            {activePlaylist.tracks.length} tracks
          </div>
        </div>
      </div>
      {activePlaylist.tracks.map((t, i) => (
        <TrackRow
          key={i}
          track={t}
          onPlay={() =>
            deviceId &&
            api.play(deviceId, { context_uri: activePlaylist.uri, offset: { position: i } })
          }
          onQueue={() => api.addToQueue(t.uri)}
        />
      ))}
    </div>
  );
};

// ─── Queue ────────────────────────────────────────────────────────────────────

export const QueueView: React.FC = () => {
  const { queueItems, deviceId } = useStore();

  if (!queueItems.length) {
    return (
      <div style={{ padding: "40px 20px", color: "#333", fontSize: 13 }}>
        Nothing queued up.
      </div>
    );
  }

  return (
    <Section title="Up Next">
      {queueItems.map((t, i) => (
        <TrackRow
          key={t.id + i}
          track={t}
          onPlay={() => deviceId && api.play(deviceId, { uris: [t.uri] })}
          onQueue={() => api.addToQueue(t.uri)}
        />
      ))}
    </Section>
  );
};