import { useEffect, useState, useRef } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  Disc, 
  Play, 
  Pause,
  ListMusic, 
  TrendingUp, 
  Clock, 
  Heart,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@/lib/axios";
import type { Song, Album } from "@/types";

interface ArtistResult {
  _id: string;
  name: string;
  imageUrl: string;
  monthlyListeners: number;
  followers: number;
  genres: string[];
  bio: string;
}

interface PlaylistResult {
  id: string;
  title: string;
  imageUrl: string;
  artist: string;
}

interface GlobalSearchResults {
  songs: Song[];
  albums: Album[];
  artists: ArtistResult[];
  playlists: PlaylistResult[];
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const userId = currentUser?.clerkId;
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Client-side search caching
  const searchCache = useRef<Record<string, GlobalSearchResults>>({});

  // Global music store data for empty state / sidebar
  const { 
    albums, 
    trendingSongs, 
    featuredSongs, 
    likedSongs,
    fetchAlbums, 
    fetchTrendingSongs, 
    fetchFeaturedSongs,
    fetchLikedSongs,
    toggleLikeSong
  } = useMusicStore();

  const { currentSong, isPlaying, setCurrentSong, togglePlay } = usePlayerStore();

  // Search states
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trendingArtists, setTrendingArtists] = useState<ArtistResult[]>([]);
  const [results, setResults] = useState<GlobalSearchResults>({
    songs: [],
    albums: [],
    artists: [],
    playlists: []
  });

  const placeholders = [
    "What do you want to listen to?",
    "Search songs, artists, or albums...",
    "Try searching for 'Seedhe Maut'...",
    "Try searching for 'Nanku'...",
    "Try searching for 'KR$NA'...",
    "Try searching for 'Sonu Nigam'..."
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Filters
  const [activeFilter, setActiveFilter] = useState<"all" | "songs" | "artists" | "albums" | "playlists">("all");
  const filtersList = [
    { id: "all", label: "All" },
    { id: "songs", label: "Songs" },
    { id: "artists", label: "Artists" },
    { id: "albums", label: "Albums" },
    { id: "playlists", label: "Playlists" }
  ] as const;

  // Keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const clickableItemsRef = useRef<HTMLElement[]>([]);

  // Debounce query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch initial empty-state data & trending artists
  useEffect(() => {
    if (albums.length === 0) fetchAlbums();
    if (trendingSongs.length === 0) fetchTrendingSongs();
    if (featuredSongs.length === 0) fetchFeaturedSongs();
    if (likedSongs.length === 0 && userId) fetchLikedSongs();

    const fetchTrendingArtists = async () => {
      try {
        const res = await axiosInstance.get("/songs/artists/trending");
        setTrendingArtists(res.data);
      } catch (err) {
        console.error("Failed to fetch trending artists:", err);
      }
    };
    fetchTrendingArtists();
  }, [albums, trendingSongs, featuredSongs, likedSongs, fetchAlbums, fetchTrendingSongs, fetchFeaturedSongs, fetchLikedSongs, userId]);

  // Execute global search API with cache lookup
  useEffect(() => {
    const trimmed = debouncedQuery.trim().toLowerCase();
    if (!trimmed) {
      setResults({ songs: [], albums: [], artists: [], playlists: [] });
      setIsLoading(false);
      return;
    }

    // Check cache
    if (searchCache.current[trimmed]) {
      setResults(searchCache.current[trimmed]);
      setIsLoading(false);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/songs/search/global?q=${encodeURIComponent(debouncedQuery)}`);
        // Cache result
        searchCache.current[trimmed] = res.data;
        // Verify query hasn't changed during execution
        if (debouncedQuery.trim().toLowerCase() === trimmed) {
          setResults(res.data);
        }
      } catch (err) {
        console.error("Global search failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Auto-focus search bar on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Reset focus index when results or filter changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [results, activeFilter]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      searchInputRef.current?.blur();
      setFocusedIndex(-1);
      return;
    }

    const items = clickableItemsRef.current.filter(Boolean);
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      items[focusedIndex].click();
    }
  };

  // Sync refs of clickable results for keyboard nav
  const addToClickableRefs = (el: HTMLElement | null) => {
    if (el && !clickableItemsRef.current.includes(el)) {
      clickableItemsRef.current.push(el);
    }
  };

  clickableItemsRef.current = [];

  const handlePlaySong = (song: Song) => {
    if (currentSong?._id === song._id) {
      togglePlay();
    } else {
      setCurrentSong(song);
    }
  };

  const getFilteredResultsCount = () => {
    if (activeFilter === "all") {
      return results.songs.length + results.albums.length + results.artists.length + results.playlists.length;
    }
    if (activeFilter === "songs") return results.songs.length;
    if (activeFilter === "artists") return results.artists.length;
    if (activeFilter === "albums") return results.albums.length;
    if (activeFilter === "playlists") return results.playlists.length;
    return 0;
  };

  const isSongPlaying = (songId: string) => isPlaying && currentSong?._id === songId;

  // Multi-artist parsing utility for frontend display links
  const renderArtistLinks = (artistString: string) => {
    if (!artistString) return null;
    const separatorRegex = /\s*(?:,|\bfeat\.?\b|\bft\.?\b|\bfeaturing\b|&|\bx\b|\/)\s*/i;
    const names = artistString.split(separatorRegex).map(n => n.trim()).filter(Boolean);
    
    return (
      <>
        {names.map((name, i) => (
          <span key={name}>
            <span 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/artists/${encodeURIComponent(name)}`);
              }}
              className="hover:underline hover:text-white cursor-pointer transition-colors font-medium text-zinc-400"
            >
              {name}
            </span>
            {i < names.length - 1 && " & "}
          </span>
        ))}
      </>
    );
  };

  const trendingArtistsList = [
    { name: "Nanku", count: "820K listeners", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300" },
    { name: "Seedhe Maut", count: "1.4M listeners", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300" },
    { name: "Arpit Bala", count: "650K listeners", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300" },
    { name: "Chaar Diwaari", count: "480K listeners", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300" }
  ];

  return (
    <div 
      className="h-full bg-gradient-to-b from-zinc-900/40 via-zinc-950 to-black overflow-y-auto px-8 py-8 select-none font-sans relative scrollbar-thin scrollbar-thumb-zinc-800"
      onKeyDown={handleKeyDown}
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-108 h-108 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Main Grid: Desktop 2 columns (Search & Results/Sidebar) */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 relative z-10">
        
        {/* Main Column: Search, Filters & Results */}
        <div className="space-y-6 min-w-0">
          
          {/* Premium Glassmorphic Search Input Wrapper */}
          <div className="relative group max-w-2xl">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10 rounded-2xl blur-lg opacity-40 group-focus-within:opacity-100 group-focus-within:from-emerald-500/25 group-focus-within:via-indigo-500/15 group-focus-within:to-emerald-500/25 transition-all duration-700 pointer-events-none" />
            
            {/* Glowing Accent Border */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-2xl group-focus-within:from-emerald-500/40 group-focus-within:via-emerald-400/20 group-focus-within:to-indigo-500/40 transition-all duration-500 pointer-events-none" />

            {/* Inner Container */}
            <div className="relative flex items-center bg-zinc-950/65 border border-white/[0.03] backdrop-blur-3xl rounded-2xl px-6 py-4.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300 group-focus-within:bg-black/85 group-focus-within:shadow-[0_20px_50px_rgba(16,185,129,0.1)] group-focus-within:border-emerald-500/20">
              {/* Search Icon Container */}
              <div className="relative flex items-center justify-center size-9 rounded-xl bg-white/[0.03] border border-white/5 mr-1 group-focus-within:bg-emerald-500/10 group-focus-within:border-emerald-500/20 transition-all duration-300">
                {isLoading ? (
                  <div className="w-4.5 h-4.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4.5 h-4.5 text-zinc-400 group-focus-within:text-emerald-400 transition-colors duration-300" />
                )}
              </div>
              
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholders[placeholderIndex]}
                className="flex-1 bg-transparent border-none text-white text-base md:text-lg placeholder-zinc-500 focus:outline-none focus:ring-0 px-4 py-0 font-medium tracking-wide transition-all duration-300"
              />

              <div className="flex items-center gap-3">
                {query && (
                  <button 
                    onClick={() => { setQuery(""); searchInputRef.current?.focus(); }}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                <div className="hidden sm:inline-flex items-center gap-1 bg-zinc-900 border-t border-white/[0.08] border-b border-black/60 shadow-[0_2px_4px_rgba(0,0,0,0.4)] px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold text-zinc-300 tracking-wider">
                  <span>ESC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Pill Filters Row with slide animation */}
          <div className="flex gap-2 items-center overflow-x-auto pb-1 scrollbar-none select-none">
            {filtersList.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`relative px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 flex-shrink-0 border ${
                    isActive 
                      ? "text-zinc-950 border-transparent" 
                      : "bg-zinc-900/30 text-zinc-400 border-white/5 hover:border-white/10 hover:text-white hover:bg-zinc-900/60"
                  }`}
                >
                  {isActive && (
                    <motion.span 
                      layoutId="activeFilterBackground"
                      className="absolute inset-0 bg-white rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Results State Management */}
          <AnimatePresence mode="wait">
            
            {/* 1. Loading State */}
            {isLoading && (
              <motion.div 
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="h-4 w-28 bg-zinc-800 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-48 bg-zinc-900/30 border border-white/5 rounded-2xl animate-pulse" />
                  <div className="h-48 bg-zinc-900/30 border border-white/5 rounded-2xl animate-pulse" />
                </div>
                <div className="space-y-2 mt-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-zinc-900/30 border border-white/5 rounded-2xl animate-pulse" />
                  ))}
                </div>
              </motion.div>
            )}

            {/* 2. Empty / Idle State */}
            {!isLoading && !debouncedQuery.trim() && (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Micro Copy Banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-indigo-500/5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Discover your next favorite sound
                    </h2>
                    <p className="text-xs text-zinc-400 max-w-md">Search across songs, albums, and detailed profiles. Or check trending selections.</p>
                  </div>
                  <div className="flex gap-2.5">
                    <button 
                      onClick={() => navigate("/time-travel")} 
                      className="px-4.5 py-2 text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 transition-all rounded-full shadow-md"
                    >
                      Time Travel
                    </button>
                    <button 
                      onClick={() => setQuery("nanku")} 
                      className="px-4.5 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 active:scale-95 text-white transition-all rounded-full border border-white/5"
                    >
                      Try "Nanku"
                    </button>
                  </div>
                </div>

                {/* Grid layout for Empty State items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Recommended Albums */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Disc className="w-3.5 h-3.5 text-emerald-400" />
                      Recommended Albums
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {albums.slice(0, 4).map((album) => (
                        <div 
                          key={album._id}
                          onClick={() => navigate(`/albums/${album._id}`)}
                          className="group p-3 rounded-2xl bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/55 transition-all duration-300 cursor-pointer shadow-lg"
                        >
                          <div className="aspect-square w-full rounded-xl overflow-hidden border border-white/5 mb-3 relative bg-zinc-950">
                            <img 
                              src={album.imageUrl} 
                              alt={album.title}
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-emerald-400 flex items-center justify-center text-black shadow-lg">
                                <ChevronRight className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-white truncate">{album.title}</p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">{album.artist}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popular Songs */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                      Popular Songs
                    </h3>
                    <div className="space-y-2 bg-white/[0.01] border border-white/[0.03] rounded-2xl p-2.5">
                      {trendingSongs.slice(0, 5).map((song) => (
                        <div
                          key={song._id}
                          onClick={() => handlePlaySong(song)}
                          className="group flex items-center gap-3 p-3 rounded-xl bg-transparent hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
                        >
                          <div className="size-11 rounded-lg overflow-hidden relative flex-shrink-0 border border-white/5 bg-zinc-900">
                            <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              {isSongPlaying(song._id) ? (
                                <Pause className="w-4 h-4 text-white fill-current animate-pulse" />
                              ) : (
                                <Play className="w-4 h-4 text-white fill-current" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{song.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{renderArtistLinks(song.artist)}</p>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-medium px-2">
                            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* 3. Search Results State */}
            {!isLoading && debouncedQuery.trim() && getFilteredResultsCount() > 0 && (
              <motion.div
                key="search-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Top Result + Songs (Grid layout for "All" filter) */}
                {activeFilter === "all" && (
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6">
                    
                    {/* Top Result Card */}
                    {results.artists.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Top Result</h3>
                        <div 
                          ref={addToClickableRefs}
                          onClick={() => navigate(`/artists/${encodeURIComponent(results.artists[0].name)}`)}
                          className="group relative flex flex-col p-6 rounded-3xl bg-gradient-to-br from-white/5 to-zinc-900/50 border border-white/5 hover:border-white/10 hover:bg-zinc-900/85 transition-all duration-300 cursor-pointer shadow-2xl h-full select-none"
                        >
                          <div className="size-24 rounded-full overflow-hidden border border-white/10 shadow-lg mb-6 relative bg-zinc-950">
                            <img 
                              src={results.artists[0].imageUrl} 
                              alt={results.artists[0].name} 
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                            />
                          </div>
                          <div className="mt-auto space-y-1">
                            <h2 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                              {results.artists[0].name}
                            </h2>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
                                Artist
                              </span>
                              <span className="text-[10px] text-zinc-500 font-medium">
                                {results.artists[0].monthlyListeners.toLocaleString()} monthly listeners
                              </span>
                            </div>
                          </div>
                          
                          {/* Play overlay button */}
                          <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-emerald-400 shadow-xl shadow-emerald-950/20 flex items-center justify-center text-zinc-950 scale-0 group-hover:scale-100 transition-all duration-300 hover:bg-emerald-300">
                            <ChevronRight className="w-6 h-6 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Songs List */}
                    {results.songs.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Songs</h3>
                        <div className="space-y-1 bg-white/[0.01] border border-white/[0.03] rounded-3xl p-2">
                          {results.songs.slice(0, 4).map((song) => (
                            <div
                              key={song._id}
                              ref={addToClickableRefs}
                              onClick={() => handlePlaySong(song)}
                              className={`group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                                focusedIndex === clickableItemsRef.current.length - 1
                                  ? "bg-white/10 border-white/10"
                                  : "bg-transparent border-transparent hover:bg-white/[0.03]"
                              }`}
                            >
                              <div className="size-11 rounded-lg overflow-hidden relative flex-shrink-0 border border-white/5 bg-zinc-900">
                                <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  {isSongPlaying(song._id) ? (
                                    <Pause className="w-4 h-4 text-white fill-current animate-pulse" />
                                  ) : (
                                    <Play className="w-4 h-4 text-white fill-current" />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{song.title}</p>
                                <p className="text-[10px] text-zinc-400 truncate mt-0.5">{renderArtistLinks(song.artist)}</p>
                              </div>
                              
                              {/* Like Button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleLikeSong(song._id); }}
                                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 hover:scale-110 transition-all"
                              >
                                <Heart className={`w-4 h-4 ${likedSongs.some(s => s._id === song._id) ? "text-red-500 fill-current" : ""}`} />
                              </button>

                              <span className="text-[10px] text-zinc-500 font-medium w-10 text-right pr-2">
                                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Categorized Results Lists */}
                
                {/* 1. Songs Filter view */}
                {(activeFilter === "songs" || (activeFilter === "all" && results.songs.length > 4)) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      {activeFilter === "all" ? "More Songs" : "Songs"}
                    </h3>
                    <div className="space-y-1 bg-white/[0.01] border border-white/[0.03] rounded-3xl p-2">
                      {(activeFilter === "all" ? results.songs.slice(4) : results.songs).map((song) => (
                        <div
                          key={song._id}
                          ref={addToClickableRefs}
                          onClick={() => handlePlaySong(song)}
                          className="group flex items-center justify-between p-3 rounded-2xl bg-transparent hover:bg-white/[0.03] transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-11 rounded-lg overflow-hidden relative flex-shrink-0 border border-white/5 bg-zinc-900">
                              <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                {isSongPlaying(song._id) ? (
                                  <Pause className="w-4 h-4 text-white fill-current animate-pulse" />
                                ) : (
                                  <Play className="w-4 h-4 text-white fill-current" />
                                )}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{song.title}</p>
                              <p className="text-xs text-zinc-400 truncate mt-0.5">{renderArtistLinks(song.artist)}</p>
                            </div>
                          </div>
                          <span className="text-xs text-zinc-500 font-medium pr-3">
                            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Artists view */}
                {(activeFilter === "artists" || (activeFilter === "all" && results.artists.length > 0)) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Artists</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {results.artists.map((artist) => (
                        <div
                          key={artist.name}
                          ref={addToClickableRefs}
                          onClick={() => navigate(`/artists/${encodeURIComponent(artist.name)}`)}
                          className="group p-4 rounded-3xl bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/50 hover:border-white/10 transition-all duration-300 cursor-pointer text-center"
                        >
                          <div className="size-24 rounded-full overflow-hidden border border-white/5 shadow-lg mx-auto mb-4 relative bg-zinc-950">
                            <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                          </div>
                          <p className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">{artist.name}</p>
                          <p className="text-[9px] bg-white/[0.04] text-zinc-400 inline-block border border-white/5 px-2.5 py-0.5 rounded-full mt-2 font-semibold">Artist</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Albums view */}
                {(activeFilter === "albums" || (activeFilter === "all" && results.albums.length > 0)) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Albums</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {results.albums.map((album) => (
                        <div
                          key={album._id}
                          ref={addToClickableRefs}
                          onClick={() => navigate(`/albums/${album._id}`)}
                          className="group p-3 rounded-2xl bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/55 hover:border-white/10 transition-all duration-300 cursor-pointer shadow-lg"
                        >
                          <div className="aspect-square w-full rounded-xl overflow-hidden border border-white/5 mb-3 relative bg-zinc-950">
                            <img src={album.imageUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-emerald-400 flex items-center justify-center text-black shadow-lg">
                                <ChevronRight className="w-5 h-5 fill-current" />
                              </div>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-white truncate">{album.title}</p>
                          <p className="text-[9px] text-zinc-500 truncate mt-0.5">Album • {album.artist}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Playlists view */}
                {(activeFilter === "playlists" || (activeFilter === "all" && results.playlists.length > 0)) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Playlists</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {results.playlists.map((playlist) => (
                        <div
                          key={playlist.id}
                          ref={addToClickableRefs}
                          onClick={() => playlist.id === "liked-songs" ? navigate("/liked-songs") : null}
                          className="group p-3 rounded-2xl bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/55 hover:border-white/10 transition-all duration-300 cursor-pointer shadow-lg"
                        >
                          <div className="aspect-square w-full rounded-xl overflow-hidden border border-white/5 mb-3 relative bg-zinc-950">
                            <img src={playlist.imageUrl} alt={playlist.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                          </div>
                          <p className="text-xs font-bold text-white truncate">{playlist.title}</p>
                          <p className="text-[9px] text-zinc-500 truncate mt-0.5">Playlist • {playlist.artist}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {/* 4. No Results State */}
            {!isLoading && debouncedQuery.trim() && getFilteredResultsCount() === 0 && (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-zinc-900/50 border border-white/5 flex items-center justify-center text-zinc-500">
                  <X className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white">No results found for "{query}"</h3>
                  <p className="text-xs text-zinc-500 max-w-sm">Please check spelling or search for another track name, album, or collaborative artist.</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Column: Trending / Recent Side Panels */}
        <div className="hidden lg:flex flex-col gap-6 sticky top-6">
          
          {/* Trending Searches */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase px-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              Trending Searches
            </h3>
            <div className="space-y-2">
              {trendingArtists.length > 0 ? (
                trendingArtists.map((artist) => (
                  <div
                    key={artist._id}
                    onClick={() => navigate(`/artists/${encodeURIComponent(artist.name)}`)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/20 border border-white/[0.02] hover:bg-zinc-900/50 hover:border-white/5 active:scale-98 transition-all duration-300 cursor-pointer"
                  >
                    <div className="size-8.5 rounded-full overflow-hidden flex-shrink-0 bg-zinc-900 border border-white/5 shadow-inner">
                      <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate hover:text-emerald-400 transition-colors">{artist.name}</p>
                      <p className="text-[9px] text-zinc-500 truncate">{artist.monthlyListeners?.toLocaleString() || "0"} listeners</p>
                    </div>
                  </div>
                ))
              ) : (
                trendingArtistsList.map((artist) => (
                  <div
                    key={artist.name}
                    onClick={() => setQuery(artist.name)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/20 border border-white/[0.02] hover:bg-zinc-900/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="size-8.5 rounded-full overflow-hidden flex-shrink-0 bg-zinc-900 border border-white/5">
                      <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{artist.name}</p>
                      <p className="text-[9px] text-zinc-500 truncate">{artist.count}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Albums */}
          {albums.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase px-1 flex items-center gap-1.5">
                <ListMusic className="w-3.5 h-3.5 text-zinc-400" />
                Top Albums
              </h3>
              <div className="space-y-2">
                {albums.slice(0, 3).map((album) => (
                  <div
                    key={album._id}
                    onClick={() => navigate(`/albums/${album._id}`)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/20 border border-white/[0.02] hover:bg-zinc-900/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="size-8.5 rounded-lg overflow-hidden flex-shrink-0 border border-white/5 bg-zinc-900">
                      <img src={album.imageUrl} alt={album.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{album.title}</p>
                      <p className="text-[9px] text-zinc-500 truncate">{renderArtistLinks(album.artist)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Liked Songs panel */}
          {userId && likedSongs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase px-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Your Liked Songs
              </h3>
              <div className="space-y-2">
                {likedSongs.slice(0, 3).map((song) => (
                  <div
                    key={song._id}
                    onClick={() => handlePlaySong(song)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/20 border border-white/[0.02] hover:bg-zinc-900/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="size-8.5 rounded-lg overflow-hidden flex-shrink-0 border border-white/5 bg-zinc-900">
                      <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{song.title}</p>
                      <p className="text-[9px] text-zinc-500 truncate">{renderArtistLinks(song.artist)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
