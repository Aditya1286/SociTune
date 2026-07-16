import React, { useEffect, useRef, useState, useCallback } from "react";
import { useStore } from "../store/PlayerStore";
import { api } from "../services/spotifyApi";
import { TrackRow, Section } from "../atom/UI";
import type { SpotifyTrack, SpotifyPlaylist } from "../utils/types";
import { Search, Library, Music, Compass } from "lucide-react";
import { playSpotifyTrackLocally, queueSpotifyTrackLocally } from "../utils/playerBridge";

// ─── Home ─────────────────────────────────────────────────────────────────────

export const HomeView: React.FC = () => {
  const { deviceId, setView } = useStore();
  const [recent, setRecent] = useState<SpotifyTrack[]>([]);
  const [top, setTop] = useState<SpotifyTrack[]>([]);

  useEffect(() => {
    api.recentlyPlayed().then((d) => setRecent(d?.items.map((i) => i.track) ?? []));
    api.topTracks().then((d) => setTop(d?.items ?? []));
  }, []);

  const play = async (track: SpotifyTrack) => {
    if (deviceId) {
      api.play(deviceId, { uris: [track.uri] }).catch(console.error);
    }
    await playSpotifyTrackLocally(track);
  };
  const queue = (track: SpotifyTrack) => {
    api.addToQueue(track.uri).catch(console.error);
    queueSpotifyTrackLocally(track);
    setView("queue");
  };

  return (
    <div className="space-y-8">
      {/* Welcome Ambient Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-zinc-500/5 p-6 border border-white/5 shadow-2xl flex items-center gap-6">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
          <Compass className="size-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Spotify Sync Activated</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-md">
            Stream directly from your Spotify premium account. Your playlists, library, and history are synchronized. Warning: side effects may include extreme head-bopping and sudden urges to dance.
          </p>
        </div>
      </div>

      {recent.length > 0 && (
        <Section title="Recently Played">
          <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 shadow-xl">
            {recent.slice(0, 8).map((t, i) => (
              <TrackRow key={t.id + i} track={t} onPlay={() => play(t)} onQueue={() => queue(t)} />
            ))}
          </div>
        </Section>
      )}

      {top.length > 0 && (
        <Section title="Your Top Tracks">
          <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 shadow-xl">
            {top.slice(0, 8).map((t, i) => (
              <TrackRow key={t.id + i} track={t} onPlay={() => play(t)} onQueue={() => queue(t)} />
            ))}
          </div>
        </Section>
      )}

      {recent.length === 0 && top.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider">Syncing dashboard...</span>
        </div>
      )}
    </div>
  );
};

// ─── Search ───────────────────────────────────────────────────────────────────

export const SearchView: React.FC = () => {
  const { searchQuery, setSearchQuery, searchResults, setSearchResults, deviceId, setView } = useStore();
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

  const play = async (track: SpotifyTrack) => {
    if (deviceId) {
      api.play(deviceId, { uris: [track.uri] }).catch(console.error);
    }
    await playSpotifyTrackLocally(track);
  };
  const queue = (track: SpotifyTrack) => {
    api.addToQueue(track.uri).catch(console.error);
    queueSpotifyTrackLocally(track);
    setView("queue");
  };

  return (
    <div className="space-y-6">
      <div className="relative group/search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500 group-focus-within/search:text-emerald-400 transition-colors" />
        <input
          autoFocus
          value={searchQuery}
          onChange={handleInput}
          placeholder="Search songs, artists, albums on Spotify..."
          className="w-full bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.04] border border-white/5 focus:border-emerald-500/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-inner focus:shadow-[0_0_15px_rgba(16,185,129,0.05)]"
        />
      </div>

      {searchResults?.tracks?.items && searchResults.tracks.items.length > 0 && (
        <Section title="Search Results">
          <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 shadow-xl">
            {searchResults.tracks.items.map((t) => (
              <TrackRow key={t.id} track={t} onPlay={() => play(t)} onQueue={() => queue(t)} />
            ))}
          </div>
        </Section>
      )}

      {searchQuery && !searchResults && (
        <div className="flex items-center justify-center py-20 text-zinc-500 gap-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Searching Spotify library...</span>
        </div>
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
    setActivePlaylist({ ...pl, tracks: data?.items.map((i) => i.item) ?? [] });
    setView("playlist");
  };

  return (
    <div className="space-y-8">
      {saved.length > 0 && (
        <Section title="Liked Songs">
          <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 shadow-xl">
            {saved.slice(0, 8).map((t, i) => (
              <TrackRow
                key={t.id + i}
                track={t}
                onPlay={async () => {
                  if (deviceId) {
                    api.play(deviceId, { uris: [t.uri] }).catch(console.error);
                  }
                  await playSpotifyTrackLocally(t);
                }}
                onQueue={() => {
                  api.addToQueue(t.uri).catch(console.error);
                  queueSpotifyTrackLocally(t);
                  setView("queue");
                }}
              />
            ))}
          </div>
        </Section>
      )}

      {playlists.length > 0 && (
        <div className="space-y-4">
          <div className="px-4 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            Your Playlists
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {playlists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} onClick={() => openPlaylist(pl)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PlaylistCard: React.FC<{ playlist: SpotifyPlaylist; onClick: () => void }> = ({
  playlist,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl shadow-lg transition-all duration-300 flex flex-col gap-3 relative overflow-hidden"
    >
      <div className="aspect-square w-full rounded-xl overflow-hidden bg-zinc-950 border border-white/5 relative">
        {playlist.images?.[0]?.url ? (
          <img
            src={playlist.images[0].url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="size-8 text-zinc-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-emerald-500 rounded-full p-3 shadow-lg shadow-emerald-500/25 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Library className="size-4 text-black" />
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-xs text-white truncate leading-snug group-hover:text-emerald-400 transition-colors">
          {playlist.name}
        </h3>
        <p className="text-[10px] text-zinc-500 mt-1 truncate">
          {playlist.items?.total ?? 0} tracks
        </p>
      </div>
    </div>
  );
};

// ─── Playlist detail ──────────────────────────────────────────────────────────

export const PlaylistView: React.FC = () => {
  const { activePlaylist, deviceId, setView } = useStore();
  if (!activePlaylist) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setView("library")}
          className="text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-base font-extrabold text-white">{activePlaylist.name}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Playlist • {activePlaylist.tracks.length} tracks
          </p>
        </div>
      </div>

      <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 shadow-xl">
        {activePlaylist.tracks.map((t, i) => (
          <TrackRow
            key={i}
            track={t}
            onPlay={async () => {
              if (deviceId) {
                api.play(deviceId, { context_uri: activePlaylist.uri, offset: { position: i } }).catch(console.error);
              }
              await playSpotifyTrackLocally(t);
            }}
            onQueue={() => {
              api.addToQueue(t.uri).catch(console.error);
              queueSpotifyTrackLocally(t);
              setView("queue");
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Queue ────────────────────────────────────────────────────────────────────

export const QueueView: React.FC = () => {
  const { queueItems, setQueueItems, deviceId } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await api.getQueue();
        if (data && data.queue) {
          setQueueItems(data.queue);
        }
      } catch (e) {
        console.error("Error fetching Spotify queue:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [setQueueItems]);

  if (loading && !queueItems.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold uppercase tracking-wider">Syncing queue...</span>
      </div>
    );
  }

  if (!queueItems.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
        <Music className="size-8 text-zinc-700 animate-pulse" />
        <p className="text-sm font-semibold text-zinc-400">Your queue is as silent as a library during final exams.</p>
        <p className="text-xs text-zinc-600">Start queueing up some tracks from search or library to get the vibe rolling.</p>
      </div>
    );
  }

  return (
    <Section title="Up Next">
      <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 shadow-xl">
        {queueItems.map((t, i) => (
          <TrackRow
            key={t.id + i}
            track={t}
            onPlay={async () => {
              if (deviceId) {
                api.play(deviceId, { uris: [t.uri] }).catch(console.error);
              }
              await playSpotifyTrackLocally(t);
            }}
            onQueue={() => {
              api.addToQueue(t.uri).catch(console.error);
              queueSpotifyTrackLocally(t);
            }}
          />
        ))}
      </div>
    </Section>
  );
};