import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { Loader2, Sparkles, Flame, Mic2, Activity, Music2, Clock, Quote, Network } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FriendButton } from "@/components/FriendButton";
import { cn } from "@/lib/utils";

export default function MatchesPage() {
  const { recommendations, fetchRecommendations, isLoading, setSelectedUser, onlineUsers } = useChatStore();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  if (isLoading && recommendations.length === 0) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[#060a0a]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="bg-[#060a0a] text-[#f0faf7] min-h-[calc(100vh-80px)] overflow-y-auto relative font-['Space_Grotesk'] w-full rounded-xl border border-white/5 pb-20 custom-scrollbar">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none fixed" />
      <div className="absolute top-[60%] left-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none fixed" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-16">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-6">
            <Sparkles size={16} /> Your Musical Soulmates
          </div>
          
          <h1 className="font-['Bebas_Neue'] text-[clamp(48px,8vw,96px)] leading-[0.9] tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-emerald-500">
            MUSIC MATCHES
          </h1>
          <p className="text-[#9aada8] text-lg max-w-xl mx-auto font-light">
            Discover users who share your exact music taste. We analyze your listening history, audio profiles, and favorite genres to find perfect matches.
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-20 animate-in fade-in duration-1000">
            <Music2 className="size-16 text-emerald-500/20 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Matches Yet</h3>
            <p className="text-[#9aada8]">Listen to more music so we can analyze your unique taste and find your perfect matches.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:gap-12 pb-10">
            {recommendations.map((match, index) => {
              const details = match.matchDetails;
              const matchPercentage = Math.round(match.similarityScore || 0);
              
              return (
                <div 
                  key={match._id}
                  className="bg-[#0d1211] border border-[#1e2422] rounded-3xl p-6 lg:p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both"
                  style={{ animationDelay: `${150 + index * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-500/10 transition-colors duration-500 pointer-events-none" />
                  
                  {/* Header / User Info */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-10 relative z-10 border-b border-white/5 pb-8">
                    <div 
                        className="flex items-center gap-5 cursor-pointer group/user"
                        onClick={() => setSelectedUser(match, 'profile')}
                    >
                        <div className="relative">
                            <Avatar className="size-20 lg:size-24 border-2 border-[#1e2422] group-hover/user:border-emerald-500/50 transition-colors shadow-2xl">
                                <AvatarImage src={match.imageUrl} />
                                <AvatarFallback className="bg-zinc-800 text-3xl font-bold">{match.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "absolute bottom-1 right-1 h-5 w-5 rounded-full ring-4 ring-[#0d1211]",
                                onlineUsers.has(match.clerkId) ? "bg-emerald-500" : "bg-zinc-500"
                            )} />
                        </div>
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-white group-hover/user:text-emerald-400 transition-colors">{match.fullName}</h2>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {match.username && <p className="text-[#6b7c78] text-sm">@{match.username}</p>}
                                {details?.preferredTime && details.preferredTime !== "Unknown" && (
                                    <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[10px] text-zinc-300 uppercase tracking-wider font-medium">
                                        <Clock className="size-3 text-emerald-400" />
                                        {details.preferredTime} Listener
                                    </span>
                                )}
                            </div>
                            <div className="mt-3">
                                <FriendButton user={match} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
                        <span className="font-['Caveat'] text-2xl text-emerald-400/80 -mb-2">Match Grade {details?.grade && `— ${details.grade}`}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-7xl font-['Bebas_Neue'] text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-400 tracking-wide drop-shadow-md">
                                {matchPercentage}
                            </span>
                            <span className="text-2xl text-emerald-500 font-bold">%</span>
                        </div>
                    </div>
                  </div>

                  {/* AI Narrative Summary */}
                  {details?.narrative_summary && (
                      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 mb-8 relative z-10 flex items-start gap-4 group/quote hover:bg-emerald-950/30 transition-colors">
                          <Quote className="size-6 text-emerald-500/40 shrink-0 mt-1 group-hover/quote:text-emerald-400 transition-colors" />
                          <div>
                              <p className="text-emerald-50 text-sm md:text-base leading-relaxed font-medium">
                                  {details.narrative_summary}
                              </p>
                              {details.taste_tension_points && details.taste_tension_points.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                      <span className="text-[10px] text-emerald-500/70 uppercase tracking-widest font-bold">Tension Points:</span>
                                      {details.taste_tension_points.map((tp, i) => (
                                          <span key={i} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                                              {tp}
                                          </span>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

                  {/* The "Why" - 3 Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    
                    {/* Column 1: Top Common Songs */}
                    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <Flame size={16} />
                            </div>
                            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-widest">Shared Anthems</h3>
                        </div>
                        
                        {details?.topSongs && details.topSongs.length > 0 ? (
                            <div className="space-y-3">
                                {details.topSongs.slice(0, 4).map((song, idx) => (
                                    <div key={song.id} className="flex flex-col justify-center group/song bg-white/5 p-2 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                                        <div className="flex items-baseline gap-2 min-w-0">
                                            <span className="text-xs text-[#6b7c78] font-mono">{idx + 1}.</span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-white truncate group-hover/song:text-emerald-300 transition-colors">{song.title}</p>
                                                <p className="text-[10px] text-[#6b7c78] truncate mt-0.5">{song.artist}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-[#6b7c78] uppercase tracking-widest font-semibold">You played</span>
                                                <span className="text-xs font-mono text-emerald-400/80">{song.playsA}x</span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[9px] text-[#6b7c78] uppercase tracking-widest font-semibold">They played</span>
                                                <span className="text-xs font-mono text-cyan-400/80">{song.playsB}x</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[#6b7c78] italic">No exact track overlap yet.</p>
                        )}
                    </div>

                    {/* Column 2: Artists & Genres */}
                    <div className="bg-black/20 rounded-2xl p-5 border border-white/5 flex flex-col gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                                    <Mic2 size={16} />
                                </div>
                                <h3 className="text-sm font-semibold text-white/90 uppercase tracking-widest">Shared Artists</h3>
                            </div>
                            {details?.topArtists && details.topArtists.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {details.topArtists.slice(0, 5).map((artist, idx) => (
                                        <span key={idx} className="text-xs font-medium bg-[#1e2422] text-white/80 px-2.5 py-1 rounded-md border border-white/5">
                                            {artist.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[#6b7c78] italic">Vibing to different artists.</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Network className="size-4 text-emerald-400" />
                                <h3 className="text-sm font-semibold text-white/90 uppercase tracking-widest">Signal Breakdown</h3>
                            </div>
                            {details?.signal_breakdown ? (
                                <div className="space-y-3 mt-4">
                                    {[
                                        { label: 'Genre Overlap', val: details.signal_breakdown.genre_overlap },
                                        { label: 'Audio Similarity', val: details.signal_breakdown.audio_similarity },
                                        { label: 'Mood Alignment', val: details.signal_breakdown.mood_alignment },
                                        { label: 'Artist Graph', val: details.signal_breakdown.artist_graph },
                                    ].map(signal => (
                                        <div key={signal.label} className="flex items-center justify-between">
                                            <span className="text-xs text-[#9aada8]">{signal.label}</span>
                                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                {Math.round(signal.val * 100)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[#6b7c78] italic">Signals unavailable.</p>
                            )}
                        </div>
                    </div>

                    {/* Column 3: Audio DNA */}
                    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                                <Activity size={16} />
                            </div>
                            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-widest">Audio DNA Sync</h3>
                        </div>

                        {details?.audioMatch ? (
                            <div className="space-y-4">
                                {[
                                    { label: 'Energy Alignment', val: details.audioMatch.energy },
                                    { label: 'Vibe / Mood', val: details.audioMatch.valence },
                                    { label: 'BPM & Tempo', val: details.audioMatch.tempo },
                                    { label: 'Acoustic Feel', val: details.audioMatch.acousticness }
                                ].map(feature => (
                                    <div key={feature.label}>
                                        <div className="flex justify-between mb-1.5 text-xs font-medium">
                                            <span className="text-[#9aada8]">{feature.label}</span>
                                            <span className="text-emerald-400">{feature.val}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-[#1e2422] rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" 
                                                style={{ width: `${feature.val}%` }} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[#6b7c78] italic">Audio profiling unavailable.</p>
                        )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
