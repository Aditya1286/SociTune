import { useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { Loader2, Flame, Mic2, Activity, Music2, Network } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FriendButton } from "@/components/FriendButton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function MatchesPage() {
  const { recommendations, fetchRecommendations, isLoading, setSelectedUser, onlineUsers } = useChatStore();
  const navigate = useNavigate();

  const renderArtistLinks = (artistString: string) => {
    const names = artistString.split(",").map(n => n.trim());
    return (
      <>
        {names.map((name, i) => (
          <span key={name}>
            <span 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/artists/${encodeURIComponent(name)}`);
              }}
              className="hover:underline hover:text-white cursor-pointer transition-colors"
            >
              {name}
            </span>
            {i < names.length - 1 && ", "}
          </span>
        ))}
      </>
    );
  };

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (isLoading && recommendations.length === 0) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[#000000]">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#000000] text-zinc-100 min-h-[calc(100vh-80px)] overflow-y-auto relative font-sans w-full rounded-xl border border-white/5 pb-24 custom-scrollbar">
      
      {/* Soft Top Ambient Wash */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#0a1612] via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-[1000px] mx-auto px-8 pt-16">
        
        {/* Editorial Header */}
        <div className="mb-16 text-left border-b border-white/[0.04] pb-10">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Music taste profile</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Musical Soulmates
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl font-light leading-relaxed">
            Discover users who share your exact music taste. We analyze your listening history, audio profiles, and favorite genres to find perfect connections.
          </p>
        </div>

        {/* Matches Feed */}
        <div className="space-y-12">
          {recommendations.length === 0 ? (
            <div className="text-center py-20 border border-white/[0.04] rounded-2xl bg-zinc-950/30">
              <Music2 className="size-10 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-zinc-400 mb-1">No matches found</h3>
              <p className="text-zinc-500 text-xs">Keep listening to more music to discover matches.</p>
            </div>
          ) : (
            recommendations.map((match) => {
              const details = match.matchDetails;
              const matchPercentage = Math.round(match.similarityScore || 0);
              
              return (
                <div 
                  key={match._id}
                  className="bg-[#09090b]/80 border border-white/[0.04] rounded-[24px] p-8 relative overflow-hidden transition-colors hover:bg-[#0a0a0e]/95"
                >
                  
                  {/* Profile & Action Row */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8 pb-6 border-b border-white/[0.04]">
                    <div 
                      className="flex items-center gap-4 cursor-pointer group/user flex-col sm:flex-row text-center sm:text-left"
                      onClick={() => setSelectedUser(match, 'profile')}
                    >
                      <div className="relative">
                        <Avatar className="size-16 border border-white/10 group-hover/user:border-emerald-500/30 transition-colors shadow-lg">
                          <AvatarImage src={match.imageUrl} />
                          <AvatarFallback className="bg-zinc-800 text-xl font-medium">{match.fullName[0]}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-[#09090b]",
                          onlineUsers.has(match.clerkId) ? "bg-emerald-500" : "bg-zinc-500"
                        )} />
                      </div>
                      
                      <div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1">
                          <h2 className="text-xl font-bold text-white group-hover/user:text-emerald-400 transition-colors">
                            {match.fullName}
                          </h2>
                          <span className="text-emerald-400 text-xs font-semibold">
                            {matchPercentage}% Match
                          </span>
                          {match.username && (
                            <>
                              <span className="text-zinc-700">•</span>
                              <span className="text-zinc-500 text-xs font-light">@{match.username}</span>
                            </>
                          )}
                          {details?.preferredTime && details.preferredTime !== "Unknown" && (
                            <>
                              <span className="text-zinc-700">•</span>
                              <span className="text-zinc-400 text-xs font-light">
                                {details.preferredTime} listener
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FriendButton user={match} />
                    </div>
                  </div>

                  {/* AI Narrative Quote block */}
                  {details?.narrative_summary && (
                    <div className="mb-8 relative pl-4 border-l-2 border-emerald-500/50">
                      <p className="text-zinc-300 text-sm italic font-light leading-relaxed">
                        "{details.narrative_summary}"
                      </p>
                    </div>
                  )}

                  {/* 3-Column Clean Borderless Layout with vertical dividers */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-white/[0.04]">
                    
                    {/* Column 1: Shared Anthems */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-1.5 text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                        <Flame size={14} className="text-pink-500" /> Shared Anthems
                      </div>
                      
                      {details?.topSongs && details.topSongs.length > 0 ? (
                        <div className="space-y-3.5">
                          {details.topSongs.slice(0, 3).map((song) => (
                            <div key={song.id} className="flex items-center justify-between gap-3 group/song cursor-pointer">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white group-hover/song:text-emerald-400 transition-colors truncate">
                                  {song.title}
                                </p>
                                <p className="text-[10px] text-zinc-500 truncate">{renderArtistLinks(song.artist)}</p>
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono text-right flex-shrink-0">
                                {song.playsA}x vs {song.playsB}x
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">No overlapping tracks.</p>
                      )}
                    </div>

                    {/* Column 2: Artists & Signal Breakdown */}
                    <div className="space-y-5 md:pl-8">
                      <div>
                        <div className="flex items-center gap-1.5 text-zinc-400 font-semibold text-xs uppercase tracking-wider mb-3">
                          <Mic2 size={14} className="text-cyan-400" /> Shared Artists
                        </div>
                        {details?.topArtists && details.topArtists.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {details.topArtists.slice(0, 4).map((artist, idx) => (
                              <span key={idx} className="text-[10px] font-medium bg-white/5 text-zinc-300 px-2.5 py-0.5 rounded border border-white/[0.02]">
                                {artist.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 italic">No common artists.</p>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                          <Network size={14} className="text-emerald-400" /> Breakdown
                        </div>
                        {details?.signal_breakdown ? (
                          <div className="space-y-2">
                            {[
                              { label: 'Genre Sync', val: details.signal_breakdown.genre_overlap },
                              { label: 'Audio Sync', val: details.signal_breakdown.audio_similarity },
                            ].map(signal => (
                              <div key={signal.label} className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-zinc-500">{signal.label}</span>
                                  <span className="text-zinc-300 font-bold">{Math.round(signal.val * 100)}%</span>
                                </div>
                                <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${signal.val * 100}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 italic">Breakdown unavailable.</p>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Audio DNA */}
                    <div className="space-y-4 md:pl-8">
                      <div className="flex items-center gap-1.5 text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                        <Activity size={14} className="text-amber-400" /> Audio DNA
                      </div>

                      {details?.audioMatch ? (
                        <div className="space-y-3.5">
                          {[
                            { label: 'Energy Sync', val: details.audioMatch.energy },
                            { label: 'Vibe Sync', val: details.audioMatch.valence },
                            { label: 'Acoustic Sync', val: details.audioMatch.acousticness }
                          ].map(feature => (
                            <div key={feature.label} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-medium">
                                <span className="text-zinc-500">{feature.label}</span>
                                <span className="text-emerald-400 font-bold">{feature.val}%</span>
                              </div>
                              <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" 
                                  style={{ width: `${feature.val}%` }} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">Audio DNA unavailable.</p>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
