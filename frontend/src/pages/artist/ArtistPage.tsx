import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { axiosInstance } from "@/lib/axios";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  Heart, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  Disc, 
  ArrowLeft, 
  Calendar, 
  Instagram, 
  Youtube, 
  Globe, 
  ExternalLink, 
  Users 
} from "lucide-react";
import type { Song, Album } from "@/types";

interface ArtistDetails {
  _id: string;
  name: string;
  imageUrl: string;
  monthlyListeners: number;
  followers: number;
  genres: string[];
  bio: string;
  verified: boolean;
  country?: string;
  instagram?: string;
  youtube?: string;
  spotify?: string;
  website?: string;
  moreSongs: Array<{ title: string; isInformationalOnly: boolean }>;
  similarArtists: string[];
  songs: Song[];
  albums: Album[];
}

export default function ArtistPage() {
  const { artistName } = useParams<{ artistName: string }>();
  const navigate = useNavigate();
  
  const { currentSong, isPlaying, playAlbum, togglePlay } = usePlayerStore();
  const { likedSongs, toggleLikeSong, fetchLikedSongs } = useMusicStore();

  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    fetchLikedSongs();
  }, [fetchLikedSongs]);

  useEffect(() => {
    if (!artistName) return;
    
    const fetchArtistDetails = async () => {
      setIsLoading(true);
      setError(null);
      setImageLoaded(false);
      try {
        const response = await axiosInstance.get(`/songs/artist/${encodeURIComponent(artistName)}`);
        setArtist(response.data);
      } catch (err: any) {
        console.error("Failed to fetch artist details:", err);
        setError(err.response?.data?.message || "Failed to load artist profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtistDetails();
  }, [artistName]);

  if (isLoading) {
    return (
      <div className="h-full bg-zinc-950 flex flex-col overflow-y-auto px-6 py-8 space-y-8">
        {/* Banner Skeleton */}
        <div className="h-72 md:h-96 bg-zinc-900/20 border border-white/5 rounded-3xl animate-pulse flex items-end p-8 relative">
          <div className="space-y-4 w-full relative z-10">
            <div className="h-5 w-28 bg-zinc-800 rounded-full" />
            <div className="h-14 w-2/3 bg-zinc-800 rounded-lg" />
            <div className="h-5 w-48 bg-zinc-800 rounded-full" />
          </div>
        </div>
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-4">
            <div className="h-6 w-36 bg-zinc-850 rounded" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-zinc-900/30 border border-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="h-80 bg-zinc-900/30 border border-white/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-zinc-500 text-lg font-medium"
        >
          {error || "Artist profile not found"}
        </motion.div>
        <button 
          onClick={() => navigate("/search")}
          className="flex items-center gap-2.5 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-semibold rounded-full transition-all text-xs shadow-lg shadow-emerald-500/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </button>
      </div>
    );
  }

  // Play whole catalog of popular songs
  const handlePlayArtistCatalog = () => {
    if (artist.songs.length === 0) return;
    const currentIsArtistSong = artist.songs.some(s => s._id === currentSong?._id);
    if (currentIsArtistSong) {
      togglePlay();
    } else {
      playAlbum(artist.songs, 0);
    }
  };

  const handlePlaySingleTrack = (index: number) => {
    const song = artist.songs[index];
    if (currentSong?._id === song._id) {
      togglePlay();
    } else {
      playAlbum(artist.songs, index);
    }
  };

  const isArtistPlaying = isPlaying && artist.songs.some(s => s._id === currentSong?._id);
  const visibleSongs = showAllTracks ? artist.songs : artist.songs.slice(0, 5);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full bg-zinc-950 overflow-y-auto select-none pb-28 relative font-sans scrollbar-thin scrollbar-thumb-zinc-800"
    >
      {/* ── Top Hero Banner ── */}
      <div className="relative h-88 md:h-[400px] w-full overflow-hidden flex items-end">
        {/* Blur Placeholder */}
        <div className="absolute inset-0 bg-zinc-900 animate-pulse z-0" />
        
        {/* Background Image Layer */}
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ 
            scale: imageLoaded ? 1.05 : 1.1, 
            opacity: imageLoaded ? 0.3 : 0 
          }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-cover bg-center filter blur-3xl pointer-events-none z-0"
          style={{ backgroundImage: `url(${artist.imageUrl})` }}
        />

        {/* Sharp Background Banner (Crossfade / Fade in) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 0.75 : 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0"
          style={{ backgroundImage: `url(${artist.imageUrl})` }}
        />

        {/* Dynamic gradient overlay to read text easily */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/25 to-transparent z-10" />

        {/* Hidden img tag to handle load event */}
        <img 
          src={artist.imageUrl} 
          alt="" 
          className="hidden" 
          onLoad={() => setImageLoaded(true)}
        />

        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-20 p-3 rounded-full bg-black/40 border border-white/5 text-zinc-400 hover:text-white transition-all hover:bg-black/60 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Hero Banner Content */}
        <div className="relative z-20 px-8 pb-8 flex flex-col md:flex-row items-start md:items-end gap-6 w-full">
          {/* Avatar with soft drop shadow */}
          <div className="relative size-32 md:size-40 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl flex-shrink-0 bg-zinc-900">
            <img 
              src={artist.imageUrl} 
              alt={artist.name} 
              className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'scale-100 blur-0' : 'scale-110 blur-md'}`}
            />
          </div>

          <div className="space-y-2.5 min-w-0">
            {artist.verified && (
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center size-5 bg-blue-500 text-white rounded-full">
                  <UserCheck className="w-3.5 h-3.5 fill-current" />
                </span>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Verified Artist</span>
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight truncate leading-tight drop-shadow-sm">
              {artist.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-semibold mt-1">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-zinc-500" /> {artist.monthlyListeners.toLocaleString()} monthly listeners</span>
              <span className="size-1 rounded-full bg-zinc-700 hidden sm:inline" />
              <span>{artist.followers.toLocaleString()} followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div className="px-8 py-6 flex items-center gap-4">
        {artist.songs.length > 0 && (
          <button 
            onClick={handlePlayArtistCatalog}
            className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-black hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
          >
            {isArtistPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>
        )}

        <div className="flex flex-wrap gap-2">
          {artist.genres.map((genre) => (
            <span key={genre} className="text-[10px] bg-white/[0.04] text-zinc-400 border border-white/5 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider">
              {genre}
            </span>
          ))}
          {artist.country && (
            <span className="text-[10px] bg-white/[0.04] text-zinc-400 border border-white/5 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider">
              📍 {artist.country}
            </span>
          )}
        </div>
      </div>

      {/* ── Main Layout: Popular Tracks on Left, About Card on Right ── */}
      <div className="px-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        
        {/* Left Column: Playable Tracks & Albums */}
        <div className="space-y-8 min-w-0">
          
          {/* Popular Songs */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Popular Tracks</h2>
            
            <div className="space-y-1 bg-white/[0.01] border border-white/[0.03] rounded-2xl p-2">
              {artist.songs.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">No local tracks available.</div>
              ) : (
                visibleSongs.map((song, index) => {
                  const isCurrent = currentSong?._id === song._id;
                  const isLiked = likedSongs.some(s => s._id === song._id);
                  return (
                    <motion.div
                      key={song._id}
                      onClick={() => handlePlaySingleTrack(index)}
                      whileHover={{ x: 2 }}
                      className={`group flex items-center gap-4 p-3 rounded-xl transition-all duration-350 cursor-pointer border border-transparent border-l-2 ${
                        isCurrent 
                          ? "bg-emerald-500/10 border-l-emerald-500" 
                          : "hover:bg-white/[0.03] hover:border-l-emerald-500/50"
                      }`}
                    >
                      {/* Index / Play Indicator */}
                      <div className="w-6 text-center text-xs font-semibold text-zinc-550 group-hover:text-white transition-colors flex items-center justify-center">
                        <span className="group-hover:hidden">{index + 1}</span>
                        <span className="hidden group-hover:inline">
                          {isCurrent && isPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current text-emerald-400" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current text-white ml-0.5" />
                          )}
                        </span>
                      </div>

                      {/* Artwork */}
                      <div className="size-10 rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                        <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                      </div>

                      {/* Title & Artist */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isCurrent ? "text-emerald-400" : "text-white"}`}>
                          {song.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                      </div>

                      {/* Like Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLikeSong(song._id); }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 hover:scale-115 transition-all duration-200"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? "text-red-500 fill-current" : ""}`} />
                      </button>

                      {/* Duration */}
                      <span className="text-xs text-zinc-500 font-medium w-12 text-right pr-2">
                        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Expand / Collapse Tracks Toggle */}
            {artist.songs.length > 5 && (
              <button
                onClick={() => setShowAllTracks(!showAllTracks)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs font-bold px-3.5 py-2 hover:bg-white/5 rounded-xl border border-white/5"
              >
                <span>{showAllTracks ? "Show Less" : "Show More"}</span>
                {showAllTracks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Albums Section */}
          {artist.albums.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Disc className="w-4 h-4 text-emerald-400" />
                Albums & Releases
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {artist.albums.map((album) => (
                  <div
                    key={album._id}
                    onClick={() => navigate(`/albums/${album._id}`)}
                    className="group p-3 rounded-2xl bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/50 hover:border-white/10 transition-all duration-300 cursor-pointer shadow-lg"
                  >
                    <div className="aspect-square w-full rounded-xl overflow-hidden border border-white/5 mb-3 relative bg-zinc-950">
                      <img src={album.imageUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-lg">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">{album.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{album.releaseYear}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: About Sidebar Card */}
        <div className="space-y-6 lg:sticky lg:top-6">
          
          {/* Biography Card */}
          <div className="group relative rounded-3xl bg-zinc-900/20 border border-white/5 overflow-hidden shadow-2xl p-6 space-y-6 hover:bg-zinc-900/30 transition-colors">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">About the Artist</h3>
            
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-white/5 shadow-inner bg-zinc-950">
              <img 
                src={artist.imageUrl} 
                alt={artist.name} 
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent" />
              
              {artist.verified && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                  <span className="flex items-center justify-center size-5 bg-blue-500 text-white rounded-full shadow-md">
                    <UserCheck className="w-3 h-3 fill-current" />
                  </span>
                  <span className="text-[11px] font-black text-white drop-shadow-md">Verified Artist</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-400 leading-relaxed font-normal transition-all duration-300">
                {artist.bio && artist.bio.length > 200 && !showFullBio 
                  ? `${artist.bio.slice(0, 200)}...` 
                  : artist.bio || "No biography available at this time."}
              </p>
              {artist.bio && artist.bio.length > 200 && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider mt-1 focus:outline-none"
                >
                  {showFullBio ? "Read Less" : "Read More"}
                </button>
              )}
            </div>

            {/* Social Links Panel */}
            <div className="pt-5 border-t border-white/[0.04] flex flex-col gap-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Official Handles</span>
              <div className="flex flex-wrap gap-2">
                {artist.instagram && (
                  <a 
                    href={artist.instagram.startsWith("http") ? artist.instagram : `https://instagram.com/${artist.instagram}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-zinc-350 hover:text-white transition-colors border border-white/5"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Instagram</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-55" />
                  </a>
                )}
                {artist.youtube && (
                  <a 
                    href={artist.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-zinc-350 hover:text-white transition-colors border border-white/5"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    <span>YouTube</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-55" />
                  </a>
                )}
                {artist.spotify && (
                  <a 
                    href={artist.spotify} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-zinc-350 hover:text-white transition-colors border border-white/5"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Spotify</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-55" />
                  </a>
                )}
                {artist.website && (
                  <a 
                    href={artist.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-zinc-350 hover:text-white transition-colors border border-white/5"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-55" />
                  </a>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
